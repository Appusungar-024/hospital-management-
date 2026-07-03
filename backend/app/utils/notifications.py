import os
import logging
from twilio.rest import Client
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "mock_sid")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "mock_token")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "+1234567890")

def send_sms_background(to_number: str, message_body: str):
    """
    Sends an SMS via Twilio in the background.
    """
    logger.info(f"Preparing to send SMS to {to_number}...")
    try:
        if TWILIO_ACCOUNT_SID == "mock_sid":
            # Mock mode for local testing without real Twilio credentials
            logger.info(f"[MOCK SMS] To: {to_number} | Body: {message_body}")
        else:
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=message_body,
                from_=TWILIO_PHONE_NUMBER,
                to=to_number
            )
            logger.info(f"SMS Sent! SID: {message.sid}")
    except Exception as e:
        logger.error(f"Failed to send SMS to {to_number}: {e}")

def send_webhook_background(url: str, payload: dict):
    """
    Dispatches a webhook payload asynchronously.
    """
    logger.info(f"Preparing webhook to {url}...")
    try:
        response = requests.post(url, json=payload, timeout=10)
        logger.info(f"Webhook dispatched to {url} | Status: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send webhook to {url}: {e}")
