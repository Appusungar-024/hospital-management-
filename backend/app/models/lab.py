from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class LabOrderStatusEnum(str, enum.Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class LabOrder(Base):
    __tablename__ = "lab_orders"
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"))
    test_type = Column(String)
    status = Column(Enum(LabOrderStatusEnum, native_enum=False, length=50), default=LabOrderStatusEnum.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    visit = relationship("Visit", backref="lab_orders")
    result = relationship("LabResult", backref="order", uselist=False)

class LabResult(Base):
    __tablename__ = "lab_results"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("lab_orders.id"))
    result_data = Column(String, nullable=True)
    attachment_url = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
