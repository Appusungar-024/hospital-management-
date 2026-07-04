from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.billing import Billing, InsuranceClaim, ClaimStatusEnum
from app.models.patient import Patient
from app.models.expense import Expense
from app.models.visit import Visit
from app.models.user import User, RoleEnum
from app.schemas.schemas import BillingCreate, BillingResponse, ExpenseCreate, ExpenseResponse
from app.utils.pdf_generator import create_receipt_pdf
from app.utils.notifications import send_sms_background
from app.routes.auth_routes import get_current_user
import uuid
import datetime

router = APIRouter(prefix="/billing", tags=["billing"])

@router.post("/billing", response_model=BillingResponse)
def create_billing(
    billing: BillingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [RoleEnum.RECEPTIONIST, RoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Only receptionists and admins can create bills")
    patient = db.query(Patient).filter(Patient.id == billing.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    receipt_id = f"REC-{uuid.uuid4().hex[:8].upper()}"
    
    latest_visit = db.query(Visit).filter(Visit.patient_id == billing.patient_id).order_by(Visit.created_at.desc()).first()
    medicine_cost = 0.0
    actual_visit_id = billing.visit_id
    if latest_visit:
        medicine_cost = sum([item.total_price for item in latest_visit.prescription_items])
        if not actual_visit_id:
            actual_visit_id = latest_visit.id
            
    total_amount = billing.amount + medicine_cost
    
    patient_payable = total_amount
    insurance_payable = 0.0
    
    if billing.apply_insurance and billing.insurance_payable:
        insurance_payable = min(billing.insurance_payable, total_amount)
        patient_payable = total_amount - insurance_payable
    
    new_billing = Billing(
        patient_id=billing.patient_id,
        visit_id=actual_visit_id,
        amount=total_amount,
        patient_payable=patient_payable,
        insurance_payable=insurance_payable,
        payment_mode=billing.payment_mode,
        receipt_id=receipt_id
    )
    db.add(new_billing)
    db.commit()
    db.refresh(new_billing)
    
    if billing.apply_insurance:
        claim = InsuranceClaim(
            billing_id=new_billing.id,
            provider_name=billing.provider_name,
            policy_number=billing.policy_number,
            claim_status=ClaimStatusEnum.PENDING
        )
        db.add(claim)
        db.commit()
    
    # Refresh to include claim relation
    db.refresh(new_billing)
    
    # Notify patient
    if patient.mobile:
        msg = f"Dear {patient.name}, your bill receipt #{receipt_id} for ${patient_payable:.2f} has been generated."
        if insurance_payable > 0:
            msg += f" (Insurance covered ${insurance_payable:.2f})"
        background_tasks.add_task(send_sms_background, patient.mobile, msg)
        
    return new_billing

@router.get("/billing/{billing_id}/receipt")
def download_receipt(billing_id: int, db: Session = Depends(get_db)):
    bill = db.query(Billing).filter(Billing.id == billing_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    patient = db.query(Patient).filter(Patient.id == bill.patient_id).first()
    visit = db.query(Visit).filter(Visit.id == bill.visit_id).first()
    
    medicines_list = []
    if visit and visit.prescription_items:
        for item in visit.prescription_items:
            medicines_list.append(f"{item.inventory.medicine_name} (x{item.quantity}): ${item.total_price:.2f}")
    
    receipt_data = {
        "receipt_id": bill.receipt_id,
        "date": bill.created_at.strftime("%Y-%m-%d %H:%M"),
        "patient_name": patient.name,
        "patient_uhid": patient.uhid,
        "amount": bill.amount,
        "patient_payable": bill.patient_payable,
        "insurance_payable": bill.insurance_payable,
        "payment_mode": bill.payment_mode.value,
        "medicines_list": medicines_list
    }
    
    pdf_buffer = create_receipt_pdf(receipt_data)
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=receipt_{bill.receipt_id}.pdf"}
    )

@router.post("/expenses", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    new_expense = Expense(description=expense.description, amount=expense.amount)
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.get("/expenses", response_model=list[ExpenseResponse])
def get_expenses(db: Session = Depends(get_db)):
    return db.query(Expense).all()

# --- Claims ---
@router.get("/claims")
def get_claims(db: Session = Depends(get_db)):
    claims = db.query(InsuranceClaim).all()
    res = []
    for c in claims:
        res.append({
            "id": c.id,
            "receipt_id": c.billing.receipt_id if c.billing else None,
            "patient_name": c.billing.patient.name if c.billing and c.billing.patient else None,
            "provider_name": c.provider_name,
            "policy_number": c.policy_number,
            "claim_amount": c.billing.insurance_payable if c.billing else 0,
            "approved_amount": c.approved_amount,
            "claim_status": c.claim_status
        })
    return res

@router.put("/claims/{claim_id}")
def update_claim(
    claim_id: int,
    status: str,
    approved_amount: float = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [RoleEnum.RECEPTIONIST, RoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to update claims")

    claim = db.query(InsuranceClaim).filter(InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Validate status is a known ClaimStatusEnum value
    valid_statuses = {e.value for e in ClaimStatusEnum}
    if status not in valid_statuses:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status '{status}'. Must be one of: {', '.join(valid_statuses)}"
        )

    claim.claim_status = ClaimStatusEnum(status)
    if approved_amount is not None:
        claim.approved_amount = approved_amount

    db.commit()
    db.refresh(claim)
    return {"message": "Claim updated successfully"}
