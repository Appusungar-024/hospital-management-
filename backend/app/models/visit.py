from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from sqlalchemy import Enum
from app.database import Base

class TriageLevel(str, enum.Enum):
    GREEN = "Routine"
    YELLOW = "Urgent"
    RED = "Immediate Emergent"

class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    triage_level = Column(Enum(TriageLevel, native_enum=False, length=50), default=TriageLevel.GREEN)
    
    # Vitals
    bp = Column(String)
    weight = Column(String)
    pulse = Column(String)
    
    # Prescription
    medicines = Column(Text)
    notes = Column(Text, nullable=True)
    follow_up_date = Column(DateTime(timezone=True), nullable=True)
    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("Patient", backref="visits")
    doctor = relationship("User", backref="consultations")
