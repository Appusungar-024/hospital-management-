from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.user import RoleEnum
from app.models.billing import PaymentModeEnum

# --- User & Auth ---
class UserCreate(BaseModel):
    username: str
    password: str
    role: RoleEnum

class UserResponse(BaseModel):
    id: int
    username: str
    role: RoleEnum

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: RoleEnum
    username: str

# --- Patient ---
class PatientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    mobile: str = Field(..., pattern=r"^\+?[0-9]{10,15}$")
    age: int
    gender: str
    existing_problems: Optional[str] = None

class PatientResponse(BaseModel):
    id: int
    uhid: str
    name: str
    mobile: str
    age: int
    gender: str
    existing_problems: Optional[str] = None # Will be decrypted
    created_at: datetime

    class Config:
        from_attributes = True

# --- Visit ---
class VisitCreate(BaseModel):
    patient_id: int
    bp: Optional[str] = None
    weight: Optional[str] = None
    pulse: Optional[str] = None
    medicines: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None

class VisitResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    bp: Optional[str]
    weight: Optional[str]
    pulse: Optional[str]
    medicines: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Billing ---
class BillingCreate(BaseModel):
    patient_id: int
    visit_id: Optional[int] = None
    amount: float
    payment_mode: PaymentModeEnum
    
    # Insurance / TPA fields
    apply_insurance: bool = False
    provider_name: Optional[str] = None
    policy_number: Optional[str] = None
    insurance_payable: Optional[float] = 0.0

class InsuranceClaimResponse(BaseModel):
    id: int
    provider_name: str
    policy_number: str
    approved_amount: Optional[float]
    claim_status: str

    class Config:
        from_attributes = True

class BillingResponse(BaseModel):
    id: int
    patient_id: int
    visit_id: Optional[int]
    amount: float
    patient_payable: float
    insurance_payable: float
    payment_mode: PaymentModeEnum
    receipt_id: str
    created_at: datetime
    claim: Optional[InsuranceClaimResponse] = None

    class Config:
        from_attributes = True

# --- Expense ---
class ExpenseCreate(BaseModel):
    description: str
    amount: float

class ExpenseResponse(BaseModel):
    id: int
    description: str
    amount: float
    created_at: datetime

    class Config:
        from_attributes = True

# --- Pharmacy ---
class InventoryCreate(BaseModel):
    medicine_name: str
    stock_quantity: int
    unit_price: float

class InventoryResponse(BaseModel):
    id: int
    medicine_name: str
    stock_quantity: int
    unit_price: float
    created_at: datetime

    class Config:
        from_attributes = True

class DispenseRequestItem(BaseModel):
    inventory_id: int
    quantity: int

class DispenseRequest(BaseModel):
    visit_id: int
    items: List[DispenseRequestItem]

class PrescriptionItemResponse(BaseModel):
    id: int
    visit_id: int
    inventory_id: int
    quantity: int
    total_price: float
    dispensed_at: datetime

    class Config:
        from_attributes = True

# --- Lab Diagnostics ---
class LabOrderCreate(BaseModel):
    patient_id: int
    test_type: str

class LabResultResponse(BaseModel):
    id: int
    order_id: int
    result_data: Optional[str]
    attachment_url: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True

class LabOrderResponse(BaseModel):
    id: int
    visit_id: int
    test_type: str
    status: str
    created_at: datetime
    result: Optional[LabResultResponse] = None

    class Config:
        from_attributes = True
