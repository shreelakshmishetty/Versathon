# H2 – AI Medical Report Explanation System

**H2** is a production-grade, AI-powered full-stack web application designed to help individuals understand their medical and laboratory test reports in clear, simple, and reassuring language. 

The system extracts digital and scanned text using high-accuracy OCR, detects key test parameters, values, and reference ranges, generates plain-language educational explanations with neutral status evaluations, performs historical report comparisons with numerical delta tracking, and creates downloadable PDF summaries using ReportLab.

---

## ⚠️ Important Medical & Safety Disclaimer

> **THIS IS AN INFORMATION-UNDERSTANDING TOOL, NOT A MEDICAL DIAGNOSIS SYSTEM.**
> 
> H2 is designed strictly for educational and informational purposes. The application **never** claims to diagnose medical conditions, prescribe treatments, recommend changing medication dosages, or replace the clinical judgment of a licensed healthcare provider. When values appear outside reference ranges, neutral, non-alarmist descriptions are provided with clear recommendations to consult a qualified physician.

---

## 🚀 Key Features

1. **User Authentication & Privacy**: Secure user registration, password hashing (bcrypt), and JWT-based authentication with strict per-user data isolation in MySQL.
2. **Multi-Format Report Upload**: Supports digital PDFs, scanned PDFs, JPG, JPEG, and PNG files up to 15 MB with drag-and-drop UI.
3. **Advanced Extraction & OCR**: Combines **PyMuPDF (`fitz`)**, **pdfplumber**, **OpenCV image preprocessing**, and **Tesseract OCR** for extraction from digital or scanned documents.
4. **AI Report Understanding**: Leverages OpenAI GPT models (`gpt-4o-mini`, `gpt-4o`) with structured JSON schemas and robust fallback heuristic parsers to prevent hallucinations and data fabrication.
5. **Neutral Reference Range Evaluation**: Objectively compares extracted numbers to report reference intervals:
   - `Within reported range`
   - `Below reference range`
   - `Above reference range`
   - `Unable to determine`
6. **Historical Report Comparison**: Select any older and newer report to compare matching tests side-by-side with numerical differences (+/- delta), percentage changes, and neutral trend descriptions.
7. **ReportLab PDF Summary Generator**: Generates clean, branded A4 PDF summaries containing user name, laboratory details, test breakdown table, and mandatory safety disclaimers.
8. **Interactive Healthcare UI**: Modern React + Vite frontend with search filters, card/table view toggles, 4-stage active progress stepper, and responsive design.

---

## 🏗️ Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────┐
│                   React + Vite (Frontend)              │
│  Tailwind-grade UI • React Router • Axios • Lucide UI  │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON / Multipart)
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend (Python)              │
│   Auth / JWT • PyMuPDF • Tesseract OCR • ReportLab     │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼───────────────┐ ┌─────────▼──────────────┐
│       MySQL Database        │ │    OpenAI API Service  │
│  Users • Reports • Tests    │ │  GPT-4o / GPT-4o-mini  │
│  Comparisons • Metadata     │ │  Vision & JSON Schemas │
└─────────────────────────────┘ └────────────────────────┘
```

- **Frontend**: React 19, Vite, React Router 7, Axios, Lucide React, Modern CSS System.
- **Backend**: FastAPI, Python 3.10+, SQLAlchemy ORM, PyMySQL, ReportLab, PyMuPDF, Pytesseract, OpenCV, Passlib, Bcrypt, PyJWT.
- **Database**: MySQL (mandatory).
- **AI Integration**: OpenAI API (Configurable model and base URL).
- **OCR Engine**: Tesseract OCR + OpenCV.

---

## 📁 Folder Structure

```
H2-medical-report-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── MedicalDisclaimer.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── LoadingProgress.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   ├── ReportDetailPage.jsx
│   │   │   ├── ComparePage.jsx
│   │   │   └── ReportHistoryPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   └── report.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   └── report.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── reports.py
│   │   │   ├── comparisons.py
│   │   │   └── users.py
│   │   ├── services/
│   │   │   ├── ai_service.py
│   │   │   ├── report_processor.py
│   │   │   └── pdf_generator.py
│   │   └── utils/
│   │       ├── text_extraction.py
│   │       └── status_evaluator.py
│   ├── tests/
│   │   ├── test_auth_and_health.py
│   │   ├── test_full_suite.py
│   │   └── test_historical_and_images.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
│
├── database/
│   └── schema.sql
├── uploads/
├── generated_reports/
└── README.md
```

---

## 🛠️ Step-by-Step Installation & Setup (Windows)

### 1. Prerequisites
- **Python**: Python 3.10 or higher installed.
- **Node.js**: Node.js v18+ and npm installed.
- **MySQL**: MySQL Server 8.0+ running locally on port 3306.
- **Tesseract OCR (Optional for scanned image OCR)**:
  - Download from: [UB-Mannheim Tesseract Releases](https://github.com/UB-Mannheim/tesseract/wiki)
  - Install to default path: `C:\Program Files\Tesseract-OCR\tesseract.exe`

---

### 2. MySQL Database Setup

Open PowerShell or MySQL Command Line and run:

```sql
CREATE DATABASE IF NOT EXISTS h2_medical_reports;
```

You can initialize the schema using `database/schema.sql`:

```powershell
# Using MySQL CLI in PowerShell
mysql -u root -p h2_medical_reports < database\schema.sql
```

*(Note: FastAPI and SQLAlchemy will also automatically create and verify all tables upon server startup.)*

---

### 3. Backend Setup

1. Open PowerShell and navigate to the `backend` directory:
   ```powershell
   cd backend
   ```

2. (Optional) Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Install all required dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure your `.env` file:
   Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
   Edit `.env` with your actual MySQL credentials and OpenAI API Key:
   ```ini
   DATABASE_HOST=localhost
   DATABASE_PORT=3306
   DATABASE_NAME=h2_medical_reports
   DATABASE_USER=root
   DATABASE_PASSWORD=your_mysql_password

   AI_API_KEY=your_openai_api_key_here
   AI_MODEL=gpt-4o-mini
   AI_BASE_URL=https://api.openai.com/v1

   SECRET_KEY=your_super_secret_jwt_key
   UPLOAD_DIRECTORY=../uploads
   GENERATED_REPORTS_DIRECTORY=../generated_reports
   TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
   MAX_FILE_SIZE_MB=15
   ALLOWED_EXTENSIONS=.pdf,.png,.jpg,.jpeg
   ```

5. Run Automated Tests to verify backend:
   ```powershell
   python -m pytest tests -v
   ```

6. Start the FastAPI Backend Server:
   ```powershell
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   API Docs will be available at: `http://localhost:8000/docs`

---

### 4. Frontend Setup

1. Open a new PowerShell window and navigate to the `frontend` folder:
   ```powershell
   cd frontend
   ```

2. Install Node dependencies:
   ```powershell
   npm install
   ```

3. Start the Vite Development Server:
   ```powershell
   npm run dev
   ```
   Open your browser and navigate to: `http://localhost:5173`

---

## 📡 REST API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch currently authenticated user | Yes |
| `GET` | `/api/users/me/dashboard` | User dashboard statistics & recent reports | Yes |
| `POST` | `/api/reports/upload` | Upload PDF or image medical report | Yes |
| `GET` | `/api/reports` | List all reports belonging to user (with sorting) | Yes |
| `GET` | `/api/reports/{id}` | Retrieve report detail and extracted test rows | Yes |
| `DELETE` | `/api/reports/{id}` | Delete report and cascade associated records | Yes |
| `POST` | `/api/reports/{id}/analyze` | Trigger AI re-analysis on demand | Yes |
| `GET` | `/api/reports/{id}/download-summary` | Download ReportLab generated summary PDF | Yes |
| `POST` | `/api/comparisons` | Generate and store historical comparison | Yes |
| `GET` | `/api/reports/compare/query` | Compare two reports by ID | Yes |
| `GET` | `/api/comparisons/history` | List comparison logs | Yes |
| `GET` | `/api/health` | Backend health check status | No |

---

## 🔒 Security & Privacy Practices

- **Zero Plaintext Secrets**: Passwords are cryptographically hashed using **bcrypt**.
- **No Client-Side Secrets**: OpenAI API keys and database credentials reside exclusively in the backend `.env` file.
- **Strict User Isolation**: All report queries, comparisons, and file access are verified against `current_user.id`.
- **SQL Injection Prevention**: SQLAlchemy parameterized queries protect all database operations.
- **File Validation**: MIME-type, extension, and file size (max 15MB) validation with sanitized storage paths.

---

## 🧪 Testing with Sample Reports

The repository includes pre-generated realistic sample reports for immediate demonstration:
1. `sample_cbc_july.pdf` — Baseline blood panel (Apollo Diagnostics, July 2026).
2. `sample_cbc_sept.pdf` — Follow-up blood panel (Apollo Diagnostics, September 2026).
3. `sample_report_image.png` — High-resolution image report for OCR validation.

Upload both PDFs to test historical comparisons, delta tracking (+1.30 g/dL Hemoglobin, etc.), and ReportLab PDF downloads!
