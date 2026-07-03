from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String) # e.g., "DECRYPTED_PATIENT_RECORD", "UPDATED_BILLING"
    target_table = Column(String) # e.g., "Patients"
    target_record_id = Column(Integer, nullable=True) # e.g., Patient ID 104
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", backref="audit_logs")
