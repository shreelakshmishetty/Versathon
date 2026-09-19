import os
import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_two_reports_upload_and_comparison():
    ts = int(time.time() * 1000)
    email = f"compare_user_{ts}@example.com"

    # Register
    reg_res = client.post('/api/auth/register', json={
        'name': 'Comparison Patient',
        'email': email,
        'password': 'Password123'
    })
    token = reg_res.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # Upload Report 1 (July)
    july_path = os.path.join(os.path.dirname(__file__), '..', '..', 'sample_cbc_july.pdf')
    with open(july_path, 'rb') as f:
        res1 = client.post(
            '/api/reports/upload',
            files={'file': ('sample_cbc_july.pdf', f.read(), 'application/pdf')},
            headers=headers
        )
    assert res1.status_code == 200
    id1 = res1.json()['id']

    # Upload Report 2 (Sept)
    sept_path = os.path.join(os.path.dirname(__file__), '..', '..', 'sample_cbc_sept.pdf')
    with open(sept_path, 'rb') as f:
        res2 = client.post(
            '/api/reports/upload',
            files={'file': ('sample_cbc_sept.pdf', f.read(), 'application/pdf')},
            headers=headers
        )
    assert res2.status_code == 200
    id2 = res2.json()['id']

    # Historical Comparison POST
    comp_res = client.post(
        '/api/comparisons',
        json={'old_report_id': id1, 'new_report_id': id2},
        headers=headers
    )
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert len(comp_data['comparisons']) >= 1

    # Check Hemoglobin delta (11.5 -> 12.8 = +1.30)
    hemo = next((c for c in comp_data['comparisons'] if 'hemoglobin' in c['test_name'].lower()), None)
    assert hemo is not None
    assert hemo['status'] == 'comparable'
    assert 'increased' in hemo['description']

    # Test PDF Summary generation with comparison attached
    summary_pdf_res = client.get(f'/api/reports/{id2}/download-summary', headers=headers)
    assert summary_pdf_res.status_code == 200
    assert summary_pdf_res.headers['content-type'] == 'application/pdf'
