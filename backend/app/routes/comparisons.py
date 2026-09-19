import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.jwt_handler import security, verify_token
from app.database import get_db
from app.models.report import Comparison, Report, TestResult
from app.utils.status_evaluator import parse_numeric_value

router = APIRouter()


class CompareRequest(BaseModel):
    old_report_id: int
    new_report_id: int


def compare_report_tests(old_tests: List[TestResult], new_tests: List[TestResult]) -> List[Dict[str, Any]]:
    """Compares matching tests between two reports with neutral descriptions and delta calculations."""
    old_map = {t.test_name.strip().lower(): t for t in old_tests}
    new_map = {t.test_name.strip().lower(): t for t in new_tests}

    all_keys = sorted(set(old_map.keys()) | set(new_map.keys()))
    comparisons = []

    for key in all_keys:
        old_item = old_map.get(key)
        new_item = new_map.get(key)

        test_name = new_item.test_name if new_item else old_item.test_name

        if not old_item:
            comparisons.append({
                'test_name': test_name,
                'previous': None,
                'current': new_item.value,
                'unit': new_item.unit,
                'change': None,
                'pct_change': None,
                'status': 'new_only',
                'description': f"Test present in recent report ({new_item.value} {new_item.unit or ''}) but not in older report."
            })
            continue

        if not new_item:
            comparisons.append({
                'test_name': test_name,
                'previous': old_item.value,
                'current': None,
                'unit': old_item.unit,
                'change': None,
                'pct_change': None,
                'status': 'old_only',
                'description': f"Test present in older report ({old_item.value} {old_item.unit or ''}) but not in recent report."
            })
            continue

        # Check unit compatibility
        old_unit = (old_item.unit or '').strip().lower()
        new_unit = (new_item.unit or '').strip().lower()
        if old_unit and new_unit and old_unit != new_unit:
            comparisons.append({
                'test_name': test_name,
                'previous': old_item.value,
                'current': new_item.value,
                'unit': f"{old_item.unit} vs {new_item.unit}",
                'change': None,
                'pct_change': None,
                'status': 'not_reliable',
                'reason': 'Units differ between reports',
                'description': f"These results cannot be reliably compared due to different units ({old_item.unit} vs {new_item.unit})."
            })
            continue

        old_num = parse_numeric_value(old_item.value)
        new_num = parse_numeric_value(new_item.value)

        if old_num is None or new_num is None:
            comparisons.append({
                'test_name': test_name,
                'previous': old_item.value,
                'current': new_item.value,
                'unit': new_item.unit or old_item.unit,
                'change': None,
                'pct_change': None,
                'status': 'not_reliable',
                'reason': 'Non-numeric values',
                'description': "These results cannot be reliably compared numerically."
            })
            continue

        delta = round(new_num - old_num, 3)
        delta_str = f"{delta:+.2f}".rstrip('0').rstrip('.') if delta != 0 else "0.00"

        pct_change_str = None
        if old_num != 0:
            pct = round(((new_num - old_num) / abs(old_num)) * 100, 1)
            pct_change_str = f"{pct:+.1f}%"

        unit_str = f" {new_item.unit}" if new_item.unit else ""
        if delta > 0:
            description = f"Value changed from {old_item.value} to {new_item.value}{unit_str} (increased by {abs(delta):.2f}{unit_str})."
        elif delta < 0:
            description = f"Value changed from {old_item.value} to {new_item.value}{unit_str} (decreased by {abs(delta):.2f}{unit_str})."
        else:
            description = f"Value remained unchanged at {new_item.value}{unit_str}."

        comparisons.append({
            'test_name': test_name,
            'previous': old_item.value,
            'current': new_item.value,
            'unit': new_item.unit or old_item.unit,
            'change': delta_str,
            'pct_change': pct_change_str,
            'status': 'comparable',
            'description': description
        })

    return comparisons


@router.post('')
def create_comparison(
    req: CompareRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials)
    old_report = db.query(Report).filter(Report.id == req.old_report_id, Report.user_id == user_id).first()
    new_report = db.query(Report).filter(Report.id == req.new_report_id, Report.user_id == user_id).first()

    if not old_report or not new_report:
        raise HTTPException(status_code=404, detail='One or both reports not found or access denied')

    old_tests = db.query(TestResult).filter(TestResult.report_id == old_report.id).all()
    new_tests = db.query(TestResult).filter(TestResult.report_id == new_report.id).all()

    comparison_results = compare_report_tests(old_tests, new_tests)

    # Store or update in database
    comp_record = db.query(Comparison).filter(
        Comparison.user_id == user_id,
        Comparison.old_report_id == old_report.id,
        Comparison.new_report_id == new_report.id
    ).first()

    data_json = json.dumps(comparison_results, ensure_ascii=False)
    if comp_record:
        comp_record.comparison_data = data_json
    else:
        comp_record = Comparison(
            user_id=user_id,
            old_report_id=old_report.id,
            new_report_id=new_report.id,
            comparison_data=data_json
        )
        db.add(comp_record)
    db.commit()
    db.refresh(comp_record)

    return {
        'id': comp_record.id,
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
        'comparisons': comparison_results
    }


@router.get('/history')
def list_comparisons(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials)
    records = db.query(Comparison).filter(Comparison.user_id == user_id).order_by(Comparison.created_at.desc()).all()
    out = []
    for r in records:
        out.append({
            'id': r.id,
            'old_report_id': r.old_report_id,
            'new_report_id': r.new_report_id,
            'created_at': r.created_at.isoformat() if r.created_at else None,
            'comparisons': json.loads(r.comparison_data) if r.comparison_data else []
        })
    return out
