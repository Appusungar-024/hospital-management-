from sqlalchemy import Column, Integer, String, Enum
from app.database import Base
import enum

class RoleEnum(str, enum.Enum):
    RECEPTIONIST = "receptionist"
    DOCTOR = "doctor"
    ADMIN = "admin"
    PHARMACIST = "pharmacist"
    LAB_TECHNICIAN = "lab_technician"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(RoleEnum, native_enum=False, length=50))
