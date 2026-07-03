from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.patient import Patient
from app.models.visit import Visit, TriageLevel
from app.schemas.schemas import PatientCreate, PatientResponse
from app.utils.security import encrypt_data, decrypt_data
import uuid

router = APIRouter(prefix="/patients", tags=["patients"])

def generate_uhid():
    return f"UHID-{uuid.uuid4().hex[:8].upper()}"

@router.post("/", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    encrypted_problems = encrypt_data(patient.existing_problems) if patient.existing_problems else None
    
    new_patient = Patient(
        uhid=generate_uhid(),
        name=patient.name,
        mobile=patient.mobile,
        age=patient.age,
        gender=patient.gender,
        encrypted_problems=encrypted_problems
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    
    # Auto-assign Triage Level and create initial Visit
    problems = (patient.existing_problems or "").lower()
    triage = TriageLevel.GREEN
    if any(kw in problems for kw in ["heart", "breath", "pain", "bleed", "emergency", "severe"]):
        triage = TriageLevel.RED
    elif any(kw in problems for kw in ["fever", "fracture", "infection", "urgent"]):
        triage = TriageLevel.YELLOW
        
    initial_visit = Visit(
        patient_id=new_patient.id,
        triage_level=triage
    )
    db.add(initial_visit)
    db.commit()
    
    # Decrypt for response
    response = PatientResponse.model_validate(new_patient)
    response.existing_problems = decrypt_data(new_patient.encrypted_problems) if new_patient.encrypted_problems else None
    return response

@router.get("/", response_model=list[PatientResponse])
def get_patients(search: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Patient)
    if search:
        query = query.filter((Patient.name.ilike(f"%{search}%")) | (Patient.mobile.ilike(f"%{search}%")) | (Patient.uhid.ilike(f"%{search}%")))
    patients = query.offset(skip).limit(limit).all()
    
    responses = []
    for p in patients:
        resp = PatientResponse.model_validate(p)
        resp.existing_problems = decrypt_data(p.encrypted_problems) if p.encrypted_problems else None
        responses.append(resp)
    return responses

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    response = PatientResponse.model_validate(patient)
    response.existing_problems = decrypt_data(patient.encrypted_problems) if patient.encrypted_problems else None
    return response
