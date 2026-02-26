"""Tests for Pydantic models — enum values, serialization, and camelCase aliases."""

import json

import pytest

from app.models import (
    EdgeType,
    InferenceEdge,
    InferenceNode,
    InferencePayload,
    InferenceResponse,
    InferenceResult,
    InferenceNodeResult,
    NodeType,
)


class TestEnumValues:
    """Enum string values must match TypeScript exactly."""

    def test_node_types(self):
        assert NodeType.FactualClaim.value == "FactualClaim"
        assert NodeType.CausalClaim.value == "CausalClaim"
        assert NodeType.Value.value == "Value"
        assert NodeType.Assumption.value == "Assumption"
        assert NodeType.Evidence.value == "Evidence"
        assert NodeType.Policy.value == "Policy"

    def test_edge_types(self):
        assert EdgeType.Supports.value == "Supports"
        assert EdgeType.Undermines.value == "Undermines"
        assert EdgeType.DependsOn.value == "DependsOn"
        assert EdgeType.Contradicts.value == "Contradicts"


class TestInferenceNode:
    def test_parse_with_camel_case(self):
        data = {"id": "n1", "nodeType": "FactualClaim", "label": "Test", "credence": 0.7}
        node = InferenceNode.model_validate(data)
        assert node.id == "n1"
        assert node.node_type == NodeType.FactualClaim
        assert node.label == "Test"
        assert node.credence == 0.7

    def test_null_credence_preserved(self):
        data = {"id": "n1", "nodeType": "Evidence", "label": "Test", "credence": None}
        node = InferenceNode.model_validate(data)
        assert node.credence is None

    def test_zero_credence_not_null(self):
        data = {"id": "n1", "nodeType": "Evidence", "label": "Test", "credence": 0.0}
        node = InferenceNode.model_validate(data)
        assert node.credence == 0.0
        assert node.credence is not None

    def test_missing_credence_defaults_to_none(self):
        data = {"id": "n1", "nodeType": "Evidence", "label": "Test"}
        node = InferenceNode.model_validate(data)
        assert node.credence is None

    def test_serialize_camel_case(self):
        node = InferenceNode(id="n1", node_type=NodeType.FactualClaim, label="Test", credence=0.7)
        d = node.model_dump(by_alias=True)
        assert "nodeType" in d
        assert d["nodeType"] == "FactualClaim"


class TestInferenceEdge:
    def test_parse_with_camel_case(self):
        data = {
            "id": "e1",
            "source": "n1",
            "target": "n2",
            "edgeType": "Supports",
            "strength": 0.8,
        }
        edge = InferenceEdge.model_validate(data)
        assert edge.edge_type == EdgeType.Supports
        assert edge.strength == 0.8

    def test_null_strength(self):
        data = {
            "id": "e1",
            "source": "n1",
            "target": "n2",
            "edgeType": "Undermines",
            "strength": None,
        }
        edge = InferenceEdge.model_validate(data)
        assert edge.strength is None

    def test_serialize_camel_case(self):
        edge = InferenceEdge(
            id="e1", source="n1", target="n2", edge_type=EdgeType.DependsOn, strength=0.5
        )
        d = edge.model_dump(by_alias=True)
        assert "edgeType" in d
        assert d["edgeType"] == "DependsOn"


class TestRoundTrip:
    """Parse frontend JSON → validate → serialize back."""

    def test_payload_round_trip(self):
        frontend_json = {
            "nodes": [
                {"id": "n1", "nodeType": "FactualClaim", "label": "Claim A", "credence": 0.7},
                {"id": "n2", "nodeType": "Evidence", "label": "Evidence B", "credence": None},
            ],
            "edges": [
                {
                    "id": "e1",
                    "source": "n1",
                    "target": "n2",
                    "edgeType": "Supports",
                    "strength": 0.8,
                },
            ],
        }
        payload = InferencePayload.model_validate(frontend_json)
        assert len(payload.nodes) == 2
        assert len(payload.edges) == 1

        # Serialize back
        serialized = json.loads(payload.model_dump_json(by_alias=True))
        assert serialized["nodes"][0]["nodeType"] == "FactualClaim"
        assert serialized["edges"][0]["edgeType"] == "Supports"


class TestInferenceResponse:
    def test_response_structure(self):
        response = InferenceResponse(
            result=InferenceResult(
                nodes=[InferenceNodeResult(id="n1", posterior=0.75)]
            ),
            warnings=["Cycle detected"],
        )
        d = response.model_dump()
        assert d["result"]["nodes"][0]["posterior"] == 0.75
        assert d["warnings"] == ["Cycle detected"]

    def test_empty_warnings_default(self):
        response = InferenceResponse(
            result=InferenceResult(nodes=[])
        )
        assert response.warnings == []
