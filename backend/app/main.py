from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, reports, users, comparisons
from app.database import Base, engine
from app.models.user import User  # noqa: F401
from app.models.report import Comparison, Report, ReportMetadata, TestResult  # noqa: F401

app = FastAPI(
    title='H2 – AI Medical Report Explanation System',
    description='AI-Assisted Educational Medical Report Explanations, OCR, Range Comparisons & Summaries',
    version='2.0.0'
)

# Startup: initialize database tables
@app.on_event('startup')
def startup_event():
    Base.metadata.create_all(bind=engine)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Mount REST endpoints
app.include_router(auth.router, prefix='/api/auth', tags=['Authentication'])
app.include_router(reports.router, prefix='/api/reports', tags=['Reports'])
app.include_router(comparisons.router, prefix='/api/comparisons', tags=['Historical Comparisons'])
app.include_router(users.router, prefix='/api/users', tags=['Users'])


@app.get('/api/health')
def health_check():
    return {
        'status': 'healthy',
        'service': 'H2 Medical Report AI Backend',
        'version': '2.0.0'
    }
