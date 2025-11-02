from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

print('GET /ping ->', client.get('/ping').status_code, client.get('/ping').json())
print('GET /favoritos ->', client.get('/favoritos/').status_code, client.get('/favoritos/').json())
print('POST /favoritos ->', client.post('/favoritos/', json={'produtoId':4}).status_code, client.post('/favoritos/', json={'produtoId':4}).json())
print('GET /favoritos after ->', client.get('/favoritos/').status_code, client.get('/favoritos/').json())
