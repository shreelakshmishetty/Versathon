import os
import io
import time
from fastapi.testclient import TestClient
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.main import app
from app.utils.status_evaluator import (
    evaluate_test_status,
    parse_numeric_value,
    parse_reference_range,
    get_status_label,
    get_neutral_explanation
)
from app.routes.comparisons import compare_report_tests
from app.models.report import TestResult

client = TestClient(app)


def test_health_check():
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'healthy'


def test_status_evaluator():
    # Value inside range
    assert evaluate_test_status("13.5", "12.0 - 16.0") == "within_range"
    # Value below range
    assert evaluate_test_status("10.2", "12.0 - 16.0") == "below_range"
    # Value above range
    assert evaluate_test_status("18.5", "12.0 - 16.0") == "above_range"
    # Less than bound
    assert evaluate_test_status("150", "< 200") == "within_range"
    assert evaluate_test_status("240", "< 200") == "above_range"
    # Greater than bound
    assert evaluate_test_status("70", "> 60") == "within_range"
    assert evaluate_test_status("45", "> 60") == "below_range"
    # Unknown / Not provided
    assert evaluate_test_status("Positive", "Negative") == "unknown"


def test_status_labels_and_neutral_language():
    assert get_status_label("within_range") == "Within reported range"
    assert get_status_label("below_range") == "Below reference range"
    assert get_status_label("above_range") == "Above reference range"
    
    expl = get_neutral_explanation("Hemoglobin", "10.5", "g/dL", "below_range", "12.0-16.0")
    assert "below the reference range" in expl
    # Ensure no diagnostic or alarmist words
    assert "disease" not in expl.lower()
    assert "danger" not in expl.lower()


def test_historical_comparison_math():
    class MockTest:
        def __init__(self, name, val, unit):
            self.test_name = name
            self.value = val
            self.unit = unit

    old_tests = [
        MockTest("Hemoglobin", "11.8", "g/dL"),
        MockTest("Platelets", "250", "10^3/uL"),
        MockTest("Glucose", "110", "mg/dL"),
    ]
    new_tests = [
        MockTest("Hemoglobin", "12.4", "g/dL"),
        MockTest("Platelets", "250", "10^3/uL"),
        MockTest("Glucose", "95", "mg/dL"),
    ]

    results = compare_report_tests(old_tests, new_tests)
    by_name = {r['test_name']: r for r in results}

    assert "Hemoglobin" in by_name
    assert by_name["Hemoglobin"]["change"] == "+0.6"
    assert by_name["Hemoglobin"]["status"] == "comparable"
    assert "increased" in by_name["Hemoglobin"]["description"]

    assert "Platelets" in by_name
    assert by_name["Platelets"]["change"] == "0.00"
    assert "unchanged" in by_name["Platelets"]["description"]

    assert "Glucose" in by_name
    assert by_name["Glucose"]["change"] == "-15"
    assert "decreased" in by_name["Glucose"]["description"]


def test_auth_and_full_report_workflow():
    ts = int(time.time() * 1000)
    unique_email = f"user_{ts}@example.com"

    # 1. Register
    reg_resp = client.post('/api/auth/register', json={
        'name': 'Medical Test User',
        'email': unique_email,
        'password': 'StrongPassword123'
    })
    assert reg_resp.status_code == 200
    token = reg_resp.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Get /me
    me_resp = client.get('/api/auth/me', headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()['email'] == unique_email

    # 3. Create a synthetic test PDF
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=letter)
    c.drawString(100, 750, "Metropolis Diagnostic Laboratory")
    c.drawString(100, 730, "Report Date: 15/08/2026")
    c.drawString(100, 700, "COMPLETE BLOOD COUNT (CBC)")
    c.drawString(100, 670, "Hemoglobin | 12.8 | g/dL | 12.0 - 16.0")
    c.drawString(100, 650, "WBC Count | 6500 | /uL | 4000 - 11000")
    c.drawString(100, 630, "Platelets | 260000 | /uL | 150000 - 450000")
    c.drawString(100, 610, "Fasting Blood Glucose | 92 | mg/dL | 70 - 99")
    c.save()
    pdf_bytes = pdf_buffer.getvalue()

    # 4. Upload Report
    upload_resp = client.post(
        '/api/reports/upload',
        files={'file': ('cbc_report_2026.pdf', pdf_bytes, 'application/pdf')},
        headers=headers
    )
    assert upload_resp.status_code == 200
    report_data = upload_resp.json()
    report_id = report_data['id']
    assert report_id > 0
    assert len(report_data['tests']) >= 1

    # 5. List Reports
    list_resp = client.get('/api/reports', headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    # 6. Get Report Details
    detail_resp = client.get(f'/api/reports/{report_id}', headers=headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()['id'] == report_id
    assert 'summary' in detail_resp.json()

    # 7. Download PDF Summary
    pdf_resp = client.get(f'/api/reports/{report_id}/download-summary', headers=headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers['content-type'] == 'application/pdf'
    assert len(pdf_resp.content) > 1000

    # 8. User Dashboard Stats
    dash_resp = client.get('/api/users/me/dashboard', headers=headers)
    assert dash_resp.status_code == 200
    assert dash_resp.json()['total_reports'] >= 1

    # 9. Delete Report
    del_resp = client.delete(f'/api/reports/{report_id}', headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()['success'] is True
