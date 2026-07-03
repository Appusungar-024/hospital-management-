from sqlalchemy import Column, Integer, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"))
    inventory_id = Column(Integer, ForeignKey("inventories.id"))
    quantity = Column(Integer)
    total_price = Column(Float)
    dispensed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    visit = relationship("Visit", backref="prescription_items")
    inventory = relationship("Inventory")
