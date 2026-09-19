from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.auth.jwt_handler import security, verify_token
from app.database import get_db
from app.models.report import Report, TestResult, Comparison
from app.models.user import User

router = APIRouter()


@router.get('/me/dashboard')
def get_dashboard(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    reports = db.query(Report).filter(Report.user_id == user_id).order_by(Report.created_at.desc()).all()
    recent = []
    total_tests_count = 0

    for report in reports:
        count = db.query(TestResult).filter(TestResult.report_id == report.id).count()
        total_tests_count += count

    for report in reports[:6]:
        recent.append({
            'id': report.id,
            'original_filename': report.original_filename,
            'file_type': report.file_type,
            'report_date': report.report_date.isoformat() if report.report_date else None,
            'laboratory_name': report.laboratory_name or (report.report_meta.laboratory_name if report.report_meta else None),
            'processing_status': report.processing_status,
            'created_at': report.created_at.isoformat() if report.created_at else None,
            'test_count': db.query(TestResult).filter(TestResult.report_id == report.id).count()
        })

    comparisons_count = db.query(Comparison).filter(Comparison.user_id == user_id).count()

    return {
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email
        },
        'welcome': f'Welcome back, {user.name}',
        'total_reports': len(reports),
        'total_tests_analyzed': total_tests_count,
        'comparisons_count': comparisons_count,
        'recent_reports': recent,
    }
