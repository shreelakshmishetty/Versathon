import os
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query, status
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.auth.jwt_handler import security, verify_token
from app.database import get_db
from app.models.report import Comparison, Report, ReportMetadata, TestResult
from app.models.user import User
from app.services.report_processor import ReportProcessor
from app.utils.text_extraction import validate_file
from app.routes.comparisons import compare_report_tests

router = APIRouter()
processor = ReportProcessor()


@router.post('/upload')
def upload_report(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user_id = verify_token(credentials)
    if not file.filename:
        raise HTTPException(status_code=400, detail='No file selected for upload')

    # Read content length
    file.file.seek(0, os.SEEK_END)
    size_bytes = file.file.tell()
    size_mb = size_bytes / (1024 * 1024)
    file.file.seek(0)

    if not validate_file(file.filename, size_mb):
        raise HTTPException(
            status_code=400,
            detail='Invalid file. Only PDF, JPG, JPEG, and PNG files under 15MB are supported.'
        )

    # Save file securely
    file_path, file_type, original_filename = processor.save_upload(file, user_id)

    # Process and analyze report
    process_result = processor.process_report(file_path, file_type)

    report_date_obj = None
    if process_result.get('report_date'):
        try:
            report_date_obj = datetime.strptime(process_result['report_date'], '%Y-%m-%d').date()
        except Exception:
            report_date_obj = None

    # Create Report record in MySQL
    report = Report(
        user_id=user_id,
        original_filename=original_filename,
        file_type=file_type,
        file_path=file_path,
        report_date=report_date_obj,
        laboratory_name=process_result.get('laboratory_name'),
        extracted_text=process_result.get('extracted_text'),
        processing_status='completed'
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Save metadata & AI notes
    metadata = ReportMetadata(
        report_id=report.id,
        laboratory_name=process_result.get('laboratory_name'),
        raw_ocr_text=process_result.get('extracted_text'),
        report_summary=process_result.get('report_summary'),
        general_notes="\n".join(process_result.get('general_notes', []))
    )
    db.add(metadata)

    # Save test results
    tests_out = []
    for item in process_result.get('tests', []):
        t_name = item.get('test_name', '').strip()
        if not t_name:
            continue
        test_record = TestResult(
            report_id=report.id,
            test_name=t_name,
            value=item.get('value'),
            unit=item.get('unit'),
            reference_range=item.get('reference_range') or 'Not provided',
            status=item.get('status', 'unknown'),
            explanation=item.get('simple_explanation'),
            important_note=item.get('important_note')
        )
        db.add(test_record)
        tests_out.append(test_record)

    db.commit()

    return {
        'id': report.id,
        'user_id': user_id,
        'original_filename': report.original_filename,
        'file_type': report.file_type,
        'report_date': report.report_date.isoformat() if report.report_date else None,
        'laboratory_name': report.laboratory_name,
        'processing_status': report.processing_status,
        'summary': metadata.report_summary,
        'general_notes': process_result.get('general_notes', []),
        'tests': [
            {
                'id': t.id,
                'test_name': t.test_name,
                'value': t.value,
                'unit': t.unit,
                'reference_range': t.reference_range,
                'status': t.status,
                'explanation': t.explanation,
                'important_note': t.important_note
            }
            for t in tests_out
        ],
    }


@router.get('')
@router.get('/history')
def list_reports(
    sort: str = Query('desc', pattern='^(asc|desc)$'),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials)
    query = db.query(Report).filter(Report.user_id == user_id)
    if sort == 'asc':
        reports = query.order_by(Report.created_at.asc()).all()
    else:
        reports = query.order_by(Report.created_at.desc()).all()

    result = []
    for report in reports:
        test_count = db.query(TestResult).filter(TestResult.report_id == report.id).count()
        result.append({
            'id': report.id,
            'original_filename': report.original_filename,
            'file_type': report.file_type,
            'report_date': report.report_date.isoformat() if report.report_date else None,
            'laboratory_name': report.laboratory_name or (report.report_meta.laboratory_name if report.report_meta else None),
            'processing_status': report.processing_status,
            'upload_date': report.created_at.isoformat() if report.created_at else None,
            'test_count': test_count,
        })
    return result


@router.get('/{report_id}')
def get_report(
    report_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials)
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user_id).first()
    if not report:
        raise HTTPException(status_code=404, detail='Report not found')

    tests = db.query(TestResult).filter(TestResult.report_id == report.id).all()
    meta = report.report_meta

    summary = meta.report_summary if meta and meta.report_summary else (
        f"The report contains {len(tests)} extracted test result(s). "
        "Review each value together with its reference range. This is educational information and is not a diagnosis."
    )

    general_notes = meta.general_notes.split('\n') if meta and meta.general_notes else [
        "This report explanation is for informational purposes only. Always consult a qualified physician for diagnosis."
    ]

    return {
        'id': report.id,
        'original_filename': report.original_filename,
        'file_type': report.file_type,
        'report_date': report.report_date.isoformat() if report.report_date else None,
        'laboratory_name': report.laboratory_name or (meta.laboratory_name if meta else None),
        'processing_status': report.processing_status,
        'extracted_text': report.extracted_text,
        'summary': summary,
        'general_notes': general_notes,
        'uploaded_at': report.created_at.isoformat() if report.created_at else None,
        'tests': [
            {
                'id': t.id,
                'test_name': t.test_name,
                'value': t.value,
                'unit': t.unit,
                'reference_range': t.reference_range,
                'status': t.status,
                'explanation': t.explanation,
                'important_note': t.important_note
            }
            for t in tests
        ],
    }


@router.delete('/{report_id}')
def delete_report(
    report_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials)
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user_id).first()
    if not report:
        raise HTTPException(status_code=404, detail='Report not found')

    if os.path.exists(report.file_path):
        try:
            os.remove(report.file_path)
        except Exception:
            pass

    db.query(TestResult).filter(TestResult.report_id == report.id).delete()
    db.query(ReportMetadata).filter(ReportMetadata.report_id == report.id).delete()
    db.query(Comparison).filter((Comparison.old_report_id == report.id) | (Comparison.new_report_id == report.id)).delete()
    db.delete(report)
    db.commit()
    return {'success': True, 'message': 'Report deleted successfully'}


@router.post('/{report_id}/analyze')
def reanalyze_report(
    report_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Re-executes AI extraction & analysis on an existing report."""
    user_id = verify_token(credentials)
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user_id).first()
    if not report:
        raise HTTPException(status_code=404, detail='Report not found')

    process_result = processor.process_report(report.file_path, report.file_type)

    if process_result.get('report_date'):
        try:
            report.report_date = datetime.strptime(process_result['report_date'], '%Y-%m-%d').date()
        except Exception:
            pass

    if process_result.get('laboratory_name'):
        report.laboratory_name = process_result['laboratory_name']

    # Update metadata
    meta = report.report_meta
    if not meta:
        meta = ReportMetadata(report_id=report.id)
        db.add(meta)
    meta.laboratory_name = report.laboratory_name
    meta.report_summary = process_result.get('report_summary')
    meta.general_notes = "\n".join(process_result.get('general_notes', []))

    # Replace tests
    db.query(TestResult).filter(TestResult.report_id == report.id).delete()
    for item in process_result.get('tests', []):
        db.add(TestResult(
            report_id=report.id,
            test_name=item.get('test_name'),
            value=item.get('value'),
            unit=item.get('unit'),
            reference_range=item.get('reference_range') or 'Not provided',
            status=item.get('status', 'unknown'),
            explanation=item.get('simple_explanation'),
            important_note=item.get('important_note')
        ))

    db.commit()
    db.refresh(report)

    return get_report(report.id, credentials, db)


@router.get('/{report_id}/download-summary')
@router.get('/{report_id}/pdf')
def download_pdf_summary(
    report_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials)
    user = db.query(User).filter(User.id == user_id).first()
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user_id).first()
    if not report or not user:
        raise HTTPException(status_code=404, detail='Report not found')

    tests = db.query(TestResult).filter(TestResult.report_id == report.id).all()
    pdf_path = processor.generate_pdf_summary(
        report=report,
        tests=tests,
        user_name=user.name
    )

    clean_name = os.path.splitext(report.original_filename)[0]
    return FileResponse(
        pdf_path,
        filename=f"H2_Summary_{clean_name}.pdf",
        media_type='application/pdf'
    )


@router.get('/compare/query')
def query_comparison(
    old_report_id: int,
    new_report_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials)
    old_report = db.query(Report).filter(Report.id == old_report_id, Report.user_id == user_id).first()
    new_report = db.query(Report).filter(Report.id == new_report_id, Report.user_id == user_id).first()

    if not old_report or not new_report:
        raise HTTPException(status_code=404, detail='One or both reports not found')

    old_tests = db.query(TestResult).filter(TestResult.report_id == old_report.id).all()
    new_tests = db.query(TestResult).filter(TestResult.report_id == new_report.id).all()

    comparisons = compare_report_tests(old_tests, new_tests)

    return {
        'old_report': {
            'id': old_report.id,
            'filename': old_report.original_filename,
            'date': old_report.report_date.isoformat() if old_report.report_date else None
        },
        'new_report': {
            'id': new_report.id,
            'filename': new_report.original_filename,
            'date': new_report.report_date.isoformat() if new_report.report_date else None
        },
        'comparisons': comparisons
    }
