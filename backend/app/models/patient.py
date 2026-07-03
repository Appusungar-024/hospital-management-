from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    uhid = Column(String, unique=True, index=True)  # Unique Health ID
    name = Column(String, index=True)
    mobile = Column(String, index=True)
    email = Column(String, nullable=True)       # NEW: patient email
    age = Column(Integer)
    gender = Column(String)
    address = Column(Text, nullable=True)        # NEW: patient address
    encrypted_problems = Column(Text)  # Encrypted field
    created_at = Column(DateTime(timezone=True), server_default=func.now())

