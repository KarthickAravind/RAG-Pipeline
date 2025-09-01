from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_generate_minimal():
    payload = {"query": "Create a simple example"}
    res = client.post("/generate", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert "content" in body
    assert "model" in body


