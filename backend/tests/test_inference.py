"""Tests for FastAPI inference endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_health(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestInferEndpoint:
    def test_single_node(self):
        payload = {
            "nodes": [
                {"id": "n1", "nodeType": "FactualClaim", "label": "Test", "credence": 0.7}
            ],
            "edges": [],
        }
        response = client.post("/infer", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data["result"]["nodes"]) == 1
        assert data["result"]["nodes"][0]["id"] == "n1"
        assert abs(data["result"]["nodes"][0]["posterior"] - 0.7) < 0.01

    def test_invalid_node_type(self):
        payload = {
            "nodes": [
                {"id": "n1", "nodeType": "InvalidType", "label": "Test", "credence": 0.5}
            ],
            "edges": [],
        }
        response = client.post("/infer", json=payload)
        assert response.status_code == 422

    def test_empty_payload(self):
        payload = {"nodes": [], "edges": []}
        response = client.post("/infer", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["result"]["nodes"] == []

    def test_support_increases_posterior(self):
        payload = {
            "nodes": [
                {"id": "evidence", "nodeType": "Evidence", "label": "E", "credence": 0.9},
                {"id": "claim", "nodeType": "FactualClaim", "label": "C", "credence": 0.5},
            ],
            "edges": [
                {
                    "id": "e1",
                    "source": "evidence",
                    "target": "claim",
                    "edgeType": "Supports",
                    "strength": 0.8,
                },
            ],
        }
        response = client.post("/infer", json=payload)
        assert response.status_code == 200
        data = response.json()
        posteriors = {n["id"]: n["posterior"] for n in data["result"]["nodes"]}
        assert posteriors["claim"] > 0.5

    def test_cycle_produces_warning(self):
        payload = {
            "nodes": [
                {"id": "A", "nodeType": "FactualClaim", "label": "A", "credence": 0.5},
                {"id": "B", "nodeType": "FactualClaim", "label": "B", "credence": 0.5},
            ],
            "edges": [
                {
                    "id": "e1",
                    "source": "A",
                    "target": "B",
                    "edgeType": "Supports",
                    "strength": 0.8,
                },
                {
                    "id": "e2",
                    "source": "B",
                    "target": "A",
                    "edgeType": "Supports",
                    "strength": 0.3,
                },
            ],
        }
        response = client.post("/infer", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data["warnings"]) > 0
        assert "Cycle detected" in data["warnings"][0]

    def test_cors_preflight(self):
        response = client.options(
            "/infer",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
