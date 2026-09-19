import requests
from pathlib import Path
from reportlab.pdfgen import canvas

pdf_path = Path(r'C:\Users\SHREELAKSHMI\OneDrive\Desktop\versathon\H2-Medical-Report\sample_report.pdf')
canvas_obj = canvas.Canvas(str(pdf_path))
canvas_obj.setTitle('H2 Demo Report')
canvas_obj.drawString(80, 770, 'H2 CLINIC DIAGNOSTICS')
canvas_obj.drawString(80, 740, 'Date: 2026-09-19')
canvas_obj.drawString(80, 700, 'Hemoglobin | 10.2 | g/dL | 12.0 - 16.0')
canvas_obj.drawString(80, 680, 'WBC | 12500 | /uL | 4000 - 11000')
canvas_obj.drawString(80, 660, 'Platelets | 250000 | /uL | 150000 - 450000')
canvas_obj.save()

login = requests.post('http://localhost:8000/api/auth/login', json={'email': 'liveverify@example.com', 'password': 'password123'}, timeout=30)
print('LOGIN_STATUS', login.status_code)
print(login.text)
login.raise_for_status()
token = login.json()['access_token']
with open(pdf_path, 'rb') as f:
    resp = requests.post(
        'http://localhost:8000/api/reports/upload',
        files={'file': ('sample_report.pdf', f, 'application/pdf')},
        headers={'Authorization': f'Bearer {token}'},
        timeout=60,
    )
print('UPLOAD_STATUS', resp.status_code)
print(resp.text)
if resp.status_code != 200:
    raise SystemExit(1)
result = resp.json()
print('REPORT_ID', result.get('id'))
print('TESTS', result.get('tests'))
