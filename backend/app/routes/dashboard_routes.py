from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.patient import Patient
from app.models.billing import Billing
from app.models.expense import Expense
from app.models.visit import Visit, TriageLevel
from app.models.lab import LabOrder, LabOrderStatusEnum
from datetime import datetime, timedelta
from sqlalchemy import case

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_patients = db.query(Patient).count()
    
    # Financials
    total_revenue = db.query(func.sum(Billing.amount)).scalar() or 0.0
    total_expenses = db.query(func.sum(Expense.amount)).scalar() or 0.0
    net_profit = total_revenue - total_expenses
    
    # Queue Management (Patients waiting today)
    today = datetime.utcnow().date()
    patients_registered_today = db.query(Patient).filter(func.date(Patient.created_at) == today).count()
    patients_seen_today = db.query(Visit).filter(func.date(Visit.created_at) == today, Visit.doctor_id != None).count()
    patients_waiting = max(0, patients_registered_today - patients_seen_today)
    
    # Sort queue by triage level
    triage_sort = case(
        (Visit.triage_level == TriageLevel.RED.value, 3),
        (Visit.triage_level == TriageLevel.YELLOW.value, 2),
        (Visit.triage_level == TriageLevel.GREEN.value, 1),
        else_=0
    )
    
    waiting_visits = db.query(Visit).filter(
        func.date(Visit.created_at) == today,
        Visit.doctor_id == None
    ).order_by(
        triage_sort.desc(),
        Visit.created_at.asc()
    ).all()
    
    queue_list = []
    for v in waiting_visits:
        queue_list.append({
            "patient_id": v.patient_id,
            "patient_name": v.patient.name if v.patient else "Unknown",
            "triage_level": v.triage_level,
            "waiting_since": v.created_at.strftime("%H:%M"),
            "visit_id": v.id
        })
        
    # Generate Kanban board data for ALL visits today
    all_visits_today = db.query(Visit).filter(func.date(Visit.created_at) == today).order_by(triage_sort.desc(), Visit.created_at.asc()).all()
    kanban = {
        "waiting": [],
        "consultation": [],
        "lab": [],
        "pharmacy": []
    }
    
    for v in all_visits_today:
        item = {
            "patient_id": v.patient_id,
            "patient_name": v.patient.name if v.patient else "Unknown",
            "triage_level": v.triage_level,
            "waiting_since": v.created_at.strftime("%H:%M"),
            "visit_id": v.id
        }
        if v.doctor_id is None:
            kanban["waiting"].append(item)
        elif v.medicines:
            # Doctor prescribed medicines, now needs dispensing/billing
            kanban["pharmacy"].append(item)
        else:
            # Check if there are pending lab orders
            has_pending_lab = any(lo.status != LabOrderStatusEnum.COMPLETED for lo in v.lab_orders)
            if has_pending_lab:
                kanban["lab"].append(item)
            else:
                kanban["consultation"].append(item)
    
    # Patient Inflow Trend (Last 7 days)
    seven_days_ago = today - timedelta(days=7)
    trend_data = db.query(
        func.date(Patient.created_at).label('date'),
        func.count(Patient.id).label('count')
    ).filter(
        func.date(Patient.created_at) >= seven_days_ago
    ).group_by(
        func.date(Patient.created_at)
    ).all()
    
    trend = [{"date": str(r.date), "patients": r.count} for r in trend_data]
    
    return {
        "total_patients": total_patients,
        "revenue": total_revenue,
        "expenses": total_expenses,
        "net_profit": net_profit,
        "queue": {
            "registered_today": patients_registered_today,
            "seen": patients_seen_today,
            "waiting": patients_waiting,
            "list": queue_list,
            "kanban": kanban
        },
        "trend": trend
    }
