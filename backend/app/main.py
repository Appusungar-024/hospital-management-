from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth_routes, patient_routes, visit_routes, billing_routes, dashboard_routes, pharmacy_routes, lab_routes
from app.seed import seed_demo_users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle handler."""
    # Create all tables that don't exist yet (safe for both fresh DBs and Alembic-managed ones)
    from app.database import engine, Base
    import app.models  # noqa: F401 — ensures all models are registered with Base
    Base.metadata.create_all(bind=engine)

    # Seed demo users
    seed_demo_users()

    # Start background scheduler
    from app.utils.scheduler import start_scheduler
    start_scheduler()

    yield
    # Shutdown cleanup (if needed in the future)


app = FastAPI(title="OPD Hospital API", root_path="/api", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(patient_routes.router)
app.include_router(visit_routes.router)
app.include_router(billing_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(pharmacy_routes.router)
app.include_router(lab_routes.router)


@app.get("/")
async def root():
    return {"message": "Hospital OPD API Running"}
