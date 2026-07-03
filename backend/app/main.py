from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth_routes, patient_routes, visit_routes, billing_routes, dashboard_routes, pharmacy_routes, lab_routes
from app.seed import seed_demo_users

app = FastAPI(title="OPD Hospital API", root_path="/api")

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

from app.utils.scheduler import start_scheduler

@app.on_event("startup")
def startup_event():
    seed_demo_users()
    start_scheduler()

@app.get("/")
async def root():
    return {"message": "Hospital OPD API Running"}
