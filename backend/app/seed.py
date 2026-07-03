from sqlalchemy.exc import SQLAlchemyError

from app.database import SessionLocal
from app.models.user import RoleEnum, User
from app.utils.security import get_password_hash


DEMO_USERS = (
    ("admin", RoleEnum.ADMIN),
    ("doctor", RoleEnum.DOCTOR),
    ("receptionist", RoleEnum.RECEPTIONIST),
    ("pharmacist", RoleEnum.PHARMACIST),
    ("lab_tech", RoleEnum.LAB_TECHNICIAN),
)


def seed_demo_users() -> None:
    db = SessionLocal()
    try:
        for username, role in DEMO_USERS:
            user = db.query(User).filter(User.username == username).first()
            if user:
                user.role = role
                user.hashed_password = get_password_hash("password")
                continue

            db.add(
                User(
                    username=username,
                    hashed_password=get_password_hash("password"),
                    role=role,
                )
            )

        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        print(f"Demo user seed skipped: {exc}")
    finally:
        db.close()
