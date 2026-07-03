from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Inventory(Base):
    __tablename__ = "inventories"

    id = Column(Integer, primary_key=True, index=True)
    medicine_name = Column(String, index=True, unique=True)
    stock_quantity = Column(Integer, default=0)
    unit_price = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
