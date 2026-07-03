from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import func
from datetime import datetime
import logging

from app.database import SessionLocal
from app.models.visit import Visit
from app.utils.notifications import send_sms_background

logger = logging.getLogger(__name__)

def check_follow_up_reminders():
    """
    Cron job to send reminders for follow-ups scheduled for today.
    """
    logger.info("Running Follow-Up Reminder Cron Job...")
    db = SessionLocal()
    try:
        today = datetime.utcnow().date()
        
        # Find all visits with a follow up date matching today, where reminder has not been sent yet.
        visits = db.query(Visit).filter(
            func.date(Visit.follow_up_date) == today,
            Visit.reminder_sent == False
        ).all()
        
        for visit in visits:
            if visit.patient and visit.patient.mobile:
                msg = f"Reminder: Hello {visit.patient.name}, you have a follow-up appointment scheduled for today. Please visit the clinic."
                send_sms_background(visit.patient.mobile, msg)
                
                # Mark as sent
                visit.reminder_sent = True
                db.commit()
                
    except Exception as e:
        logger.error(f"Error in check_follow_up_reminders: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every minute for testing purposes, but in reality this would be daily at e.g., 08:00 AM
    # scheduler.add_job(check_follow_up_reminders, 'cron', hour=8, minute=0)
    scheduler.add_job(check_follow_up_reminders, 'interval', minutes=1)
    
    scheduler.start()
    logger.info("APScheduler Background Tasks Started!")
