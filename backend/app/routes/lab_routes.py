from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.lab import LabOrder, LabResult, LabOrderStatusEnum
from app.models.visit import Visit
from app.models.patient import Patient
from app.models.user import User, RoleEnum
from app.schemas.schemas import LabOrderCreate, LabOrderResponse, LabResultResponse
from app.routes.auth_routes import get_current_user
from app.utils.s3 import upload_file_to_s3
from app.utils.notifications import send_sms_background
from typing import Optional

router = APIRouter(prefix="/lab", tags=["lab"])

def check_lab_auth(current_user: User = Depends(get_current_user)):
    if current_user.role not in [RoleEnum.LAB_TECHNICIAN, RoleEnum.ADMIN, RoleEnum.DOCTOR]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.post("/orders", response_model=LabOrderResponse)
def create_lab_order(order: LabOrderCreate, db: Session = Depends(get_db), _: User = Depends(check_lab_auth)):
    # Verify patient exists and get latest visit
    visit = db.query(Visit).filter(Visit.patient_id == order.patient_id).order_by(Visit.created_at.desc()).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Active visit not found for patient")
        
    new_order = LabOrder(
        visit_id=visit.id,
        test_type=order.test_type
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("/orders", response_model=list[LabOrderResponse])
def get_lab_orders(db: Session = Depends(get_db), _: User = Depends(check_lab_auth)):
    return db.query(LabOrder).order_by(LabOrder.created_at.desc()).all()

@router.get("/orders/patient/{patient_id}", response_model=list[LabOrderResponse])
def get_orders_by_patient(patient_id: int, db: Session = Depends(get_db), _: User = Depends(check_lab_auth)):
    # Find all visits for patient
    visits = db.query(Visit).filter(Visit.patient_id == patient_id).all()
    visit_ids = [v.id for v in visits]
    if not visit_ids:
        return []
    return db.query(LabOrder).filter(LabOrder.visit_id.in_(visit_ids)).order_by(LabOrder.created_at.desc()).all()

@router.post("/orders/{order_id}/result", response_model=LabResultResponse)
async def upload_lab_result(
    order_id: int, 
    background_tasks: BackgroundTasks,
    result_data: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: User = Depends(check_lab_auth)
):
    order = db.query(LabOrder).filter(LabOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")
        
    attachment_url = None
    if file:
        file_bytes = await file.read()
        try:
            attachment_url = upload_file_to_s3(file_bytes, file.filename)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
            
    # Update order status
    order.status = LabOrderStatusEnum.COMPLETED
    
    # Create or update result
    if order.result:
        order.result.result_data = result_data
        if attachment_url:
            order.result.attachment_url = attachment_url
        result = order.result
    else:
        result = LabResult(
            order_id=order.id,
            result_data=result_data,
            attachment_url=attachment_url
        )
        db.add(result)
        
    db.commit()
    db.refresh(result)
    
    # Notify Patient
    if order.visit and order.visit.patient and order.visit.patient.mobile:
        patient = order.visit.patient
        msg = f"Hello {patient.name}, your lab results for {order.test_type} are ready."
        if attachment_url:
            msg += f" You can view them here: {attachment_url}"
        background_tasks.add_task(send_sms_background, patient.mobile, msg)
        
    return result
