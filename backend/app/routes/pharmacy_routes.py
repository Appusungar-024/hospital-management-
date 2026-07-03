from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.inventory import Inventory
from app.models.prescription_item import PrescriptionItem
from app.models.visit import Visit
from app.models.user import User, RoleEnum
from app.schemas.schemas import InventoryCreate, InventoryResponse, DispenseRequest, PrescriptionItemResponse
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/pharmacy", tags=["pharmacy"])

# Ensure only pharmacist can dispense, or admin
def check_pharmacist(current_user: User = Depends(get_current_user)):
    if current_user.role not in [RoleEnum.PHARMACIST, RoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized as Pharmacist")
    return current_user

@router.get("/inventory", response_model=list[InventoryResponse])
def get_inventory(db: Session = Depends(get_db)):
    return db.query(Inventory).all()

@router.post("/inventory", response_model=InventoryResponse)
def add_inventory(item: InventoryCreate, db: Session = Depends(get_db), _: User = Depends(check_pharmacist)):
    existing = db.query(Inventory).filter(Inventory.medicine_name == item.medicine_name).first()
    if existing:
        existing.stock_quantity += item.stock_quantity
        existing.unit_price = item.unit_price
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_item = Inventory(**item.model_dump())
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return new_item

@router.get("/pending_prescriptions")
def get_pending_prescriptions(db: Session = Depends(get_db), _: User = Depends(check_pharmacist)):
    # Find visits that have medicines prescribed, but no prescription items associated with them
    visits = db.query(Visit).filter(Visit.medicines != None, Visit.medicines != "").all()
    pending = []
    for v in visits:
        if not v.prescription_items:
            pending.append({
                "visit_id": v.id,
                "patient_name": v.patient.name,
                "prescribed_medicines": v.medicines,
                "date": v.created_at
            })
    return pending

@router.post("/dispense", response_model=list[PrescriptionItemResponse])
def dispense_prescription(req: DispenseRequest, db: Session = Depends(get_db), _: User = Depends(check_pharmacist)):
    visit = db.query(Visit).filter(Visit.id == req.visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
        
    responses = []
    for item in req.items:
        inv = db.query(Inventory).filter(Inventory.id == item.inventory_id).first()
        if not inv:
            raise HTTPException(status_code=404, detail=f"Inventory {item.inventory_id} not found")
        if inv.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {inv.medicine_name}")
            
        inv.stock_quantity -= item.quantity
        total_price = inv.unit_price * item.quantity
        
        pi = PrescriptionItem(
            visit_id=visit.id,
            inventory_id=inv.id,
            quantity=item.quantity,
            total_price=total_price
        )
        db.add(pi)
        responses.append(pi)
        
    db.commit()
    for pi in responses:
        db.refresh(pi)
    
    return responses
