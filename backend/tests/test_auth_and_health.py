import time
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json()['status'] in {'ok', 'healthy'}


def test_registration_and_login_flow():
    unique_email = f'user_test_{int(time.time()*1000)}@example.com'
    register = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': unique_email,
        'password': 'password123',
    })
    assert register.status_code == 200
    token = register.json()['access_token']
    assert isinstance(token, str)

    login = client.post('/api/auth/login', json={
        'email': unique_email,
        'password': 'password123',
    })
    assert login.status_code == 200
    assert login.json()['user']['email'] == unique_email

    profile = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert profile.status_code == 200
    assert profile.json()['email'] == unique_email


def test_invalid_file_rejection():
    response = client.post(
        '/api/reports/upload',
        files={'file': ('bad.txt', b'hello', 'text/plain')},
        headers={'Authorization': 'Bearer invalid'}
    )
    assert response.status_code == 401
