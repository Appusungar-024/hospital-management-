import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_hospital_workflow():
    # Step 1: Login as doctor to get token for visit creation
    login_data = {"username": "doctor", "password": "password"}
    login_response = client.post("/auth/token", data=login_data)
    assert login_response.status_code == 200, "Failed to login as doctor"
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get initial dashboard stats to track revenue
    stats_response_before = client.get("/dashboard/stats")
    assert stats_response_before.status_code == 200
    initial_revenue = stats_response_before.json().get("revenue", 0.0)

    # Step 2: Register a Fake Patient
    patient_data = {
        "name": "Integration Test Patient",
        "mobile": "+1234567890",
        "age": 30,
        "gender": "Male",
        "existing_problems": "None"
    }
    patient_response = client.post("/patients/", json=patient_data)
    assert patient_response.status_code == 200, "Failed to register patient"
    patient_id = patient_response.json()["id"]

    # Step 3: Register a Fake Visit
    visit_data = {
        "patient_id": patient_id,
        "bp": "120/80",
        "weight": "70kg",
        "pulse": "80",
        "medicines": "Paracetamol",
        "notes": "Test visit"
    }
    visit_response = client.post("/visits/", json=visit_data, headers=headers)
    assert visit_response.status_code == 200, "Failed to register visit"
    visit_id = visit_response.json()["id"]

    # Step 4: Hit the Billing Endpoint
    billing_amount = 150.0
    billing_data = {
        "patient_id": patient_id,
        "visit_id": visit_id,
        "amount": billing_amount,
        "payment_mode": "Cash"
    }
    billing_response = client.post("/billing/billing", json=billing_data)
    assert billing_response.status_code == 200, "Failed to create billing"

    # Step 5: Verify Dashboard Revenue Increased
    stats_response_after = client.get("/dashboard/stats")
    assert stats_response_after.status_code == 200
    final_revenue = stats_response_after.json().get("revenue", 0.0)
    
    # Assert revenue changed exactly by the billing amount
    assert final_revenue == initial_revenue + billing_amount, "Dashboard revenue did not update correctly!"


def test_patient_validation():
    # Attempt to create a patient with an invalid phone number
    invalid_patient_data = {
        "name": "Validation Tester",
        "mobile": "not_a_phone_number",
        "age": 25,
        "gender": "Female",
        "existing_problems": "None"
    }
    response = client.post("/patients/", json=invalid_patient_data)
    # Pydantic should throw 422 Unprocessable Entity for failing the regex
    assert response.status_code == 422, "API did not reject invalid mobile number"

