# OPD Management & Hospital Information System (HIMS)

A modern, full-stack Hospital Information Management System (HIMS) designed to streamline outpatient care workflows, secure patient records, automate diagnostics, and manage hospital financials. 

---

##  Key Modules & Features

### 1. Smart Triage & Live Queue Management
*   **Prioritized Sorting:** Patient queues are sorted dynamically by clinical priority (`triage_level` DESC, `created_at` ASC) parsed automatically from patient complaints (Red / Yellow / Green), moving critical cases to the front.
*   **Status Workflows:** Real-time visibility into *Waiting*, *In-Consultation*, and *Completed* visit workflows.

### 2. Pharmacy Inventory & Prescription Sync
*   **Inventory Control:** Master catalog tracking medication stocks, batch numbers, unit pricing, and expiration dates.
*   **Prescription Deductions:** Doctors write digital prescriptions using catalog items. The Pharmacist reviews and dispenses medications, triggering automatic inventory stock deductions and adding calculated costs directly to the patient's billing invoice.

### 3. Lab & Radiology Diagnostics Integration
*   **Lab Queue:** Separates the doctor's test requests (e.g., Blood tests, X-rays) from the lab results upload workflow.
*   **Object Storage Integration:** Integrates with local AWS S3-compatible object storage (**MinIO**). Lab technicians enter diagnostic notes and upload PDFs/image reports, which are stored securely and instantly linked to the doctor's consultation panel.

### 4. Insurance, TPA & Split-Billing Engine
*   **Co-Pay Split Engine:** Handles complex checkouts by automatically splitting final billing costs between the patient (patient co-pay) and their insurance/TPA provider.
*   **Lifecycle Management:** Tracks TPA claims through *Pending Approval*, *Approved*, and *Settled* statuses.
*   **Itemized Receipts:** Dynamically generates PDF invoices showing Consultation fees, Pharmacy costs, covered Insurance deductions, and Net Patient Payable.

### 5. Automated Communication Engine
*   **Asynchronous Notifications:** Offloads patient communications to FastAPI `BackgroundTasks` to send SMS alerts (via Twilio API) without blocking main server threads.
*   **Cron Reminders:** Powered by `APScheduler` to run background jobs scanning the database and sending automatic SMS checkup follow-up reminders.

### 6. Compliance & Audits
*   **Audit Logging:** Append-only database audit logs detailing system-wide modifications (such as decrypted records, billing adjustments, and status changes) for compliance tracking.

---

##  Tech Stack

*   **Frontend:** React, Vite, Tailwind CSS (v4), TanStack Query, Lucide Icons, Axios.
*   **Backend:** FastAPI (Python), SQLAlchemy, Alembic (Database Migrations), Pydantic.
*   **Database:** PostgreSQL.
*   **Storage:** MinIO / AWS S3.
*   **Background Jobs:** APScheduler & FastAPI BackgroundTasks.
*   **Deployment:** Docker, Docker Compose, Nginx.

---

##  Project Structure

```text
├── backend/                  # FastAPI Backend Application
│   ├── alembic/              # Database migration history
│   ├── app/
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routes/           # FastAPI API endpoints
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── utils/            # PDF generators, S3 helpers, schedulers
│   ├── requirements.txt      # Backend Python dependencies
│   └── Dockerfile
├── frontend/                 # React Frontend Application
│   ├── src/
│   │   ├── layouts/          # UI Shell and Sidebars
│   │   ├── pages/            # View pages (Billing, Lab, Pharmacy, etc.)
│   │   └── api/              # Axios configuration
│   └── package.json          # Node dependencies
├── nginx/                    # Reverse Proxy configuration
├── docker-compose.yml        # Orchestration file
└── README.md
```

---

## Setup & Installation

### Prerequisites
*   Docker & Docker Compose
*   Node.js (v18+)
*   Python (v3.10+)

### 1. Running via Docker (Recommended)
To run the entire system with Nginx, MinIO, PostgreSQL, Frontend, and Backend in production mode:
```bash
docker compose up -d --build
```
Access the application at `http://localhost`.

### 2. Local Development Setup

#### Backend setup:
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and seed database:
   ```bash
   alembic upgrade head
   ```
5. Start development server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

#### Frontend setup:
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
Access the development UI at `http://localhost:5173`.
