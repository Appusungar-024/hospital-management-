from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class PaymentModeEnum(str, enum.Enum):
    CASH = "Cash"
    UPI = "UPI"
    CARD = "Card"

class Billing(Base):
    __tablename__ = "billings"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    
    amount = Column(Float)
    patient_payable = Column(Float, default=0.0)
    insurance_payable = Column(Float, default=0.0)
    payment_mode = Column(Enum(PaymentModeEnum, native_enum=False, length=50))
    receipt_id = Column(String, unique=True, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("Patient", backref="bills")
    visit = relationship("Visit", backref="bill")
    claim = relationship("InsuranceClaim", backref="billing", uselist=False)

class ClaimStatusEnum(str, enum.Enum):
    PENDING = "Pending Approval"
    APPROVED = "Approved"
    SETTLED = "Settled"

class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"
    
    id = Column(Integer, primary_key=True, index=True)
    billing_id = Column(Integer, ForeignKey("billings.id"))
    provider_name = Column(String)
    policy_number = Column(String)
    approved_amount = Column(Float, nullable=True)
    claim_status = Column(Enum(ClaimStatusEnum, native_enum=False, length=50), default=ClaimStatusEnum.PENDING)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
