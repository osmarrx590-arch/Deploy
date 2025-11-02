from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

print('--- Anonymous POST /favoritos ---')
resp = client.post('/favoritos/', json={'produtoId': 8})
print('status', resp.status_code)
try:
    print(resp.json())
except Exception as e:
    print('no json')

print('\n--- GET /favoritos (anonymous) ---')
resp2 = client.get('/favoritos/')
print('status', resp2.status_code)
print(resp2.json())

# Try registering and logging a user to get cookie (if endpoints work via TestClient)
print('\n--- Register & Login flow (TestClient) ---')
reg = client.post('/auth/register', json={'nome': 'TC User', 'email': 'tcuser@example.com', 'password': 'testpass', 'tipo': 'online'})
print('register status', reg.status_code)
try:
    print('register json', reg.json())
except Exception:
    print('register no json')

login = client.post('/auth/login', json={'email': 'tcuser@example.com', 'password': 'testpass'})
print('login status', login.status_code)
try:
    print('login json', login.json())
except Exception:
    print('login no json')

# If login set cookie, TestClient stores cookies
print('\nCookies after login:', client.cookies.get_dict())

print('\n--- Authenticated POST /favoritos ---')
resp3 = client.post('/favoritos/', json={'produtoId': 8})
print('status', resp3.status_code)
try:
    print(resp3.json())
except Exception:
    print('no json')
