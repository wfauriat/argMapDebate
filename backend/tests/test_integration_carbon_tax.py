"""Integration tests using the Carbon Tax example map.

These tests load the full Carbon Tax debate graph and verify that inference
produces sane results. Run after any change to bn_builder or models to
catch regressions.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.bn_builder import run_inference
from app.main import app
from app.models import InferenceEdge, InferenceNode, InferencePayload

EXAMPLE_PATH = Path(__file__).resolve().parents[2] / "public" / "example-maps" / "carbon-tax.json"


@pytest.fixture(scope="module")
def carbon_tax_raw() -> dict:
    with open(EXAMPLE_PATH) as f:
        return json.load(f)


@pytest.fixture(scope="module")
def payload(carbon_tax_raw: dict) -> InferencePayload:
    """Build an InferencePayload from the Carbon Tax example JSON."""
    return InferencePayload.model_validate(
        {
            "nodes": [
                {
                    "id": n["id"],
                    "nodeType": n["data"]["nodeType"],
                    "label": n["data"]["label"],
                    "credence": n["data"].get("credence"),
                }
                for n in carbon_tax_raw["nodes"]
            ],
            "edges": [
                {
                    "id": e["id"],
                    "source": e["source"],
                    "target": e["target"],
                    "edgeType": e["data"]["edgeType"],
                    "strength": e["data"].get("strength"),
                }
                for e in carbon_tax_raw["edges"]
            ],
        }
    )


@pytest.fixture(scope="module")
def posteriors(payload: InferencePayload) -> dict[str, float]:
    """Run inference once and return a {node_id: posterior} dict."""
    response = run_inference(payload)
    assert response.warnings == [], f"Unexpected warnings: {response.warnings}"
    return {n.id: n.posterior for n in response.result.nodes}


@pytest.fixture(scope="module")
def credences(carbon_tax_raw: dict) -> dict[str, float | None]:
    return {n["id"]: n["data"].get("credence") for n in carbon_tax_raw["nodes"]}


# --------------------------------------------------------------------------- #
#  Structural checks
# --------------------------------------------------------------------------- #


class TestStructural:
    """Basic structural sanity: right number of results, valid range, no warnings."""

    def test_all_nodes_have_posteriors(self, posteriors, payload):
        assert len(posteriors) == len(payload.nodes)

    def test_no_missing_nodes(self, posteriors, payload):
        expected_ids = {n.id for n in payload.nodes}
        assert set(posteriors.keys()) == expected_ids

    def test_posteriors_in_valid_range(self, posteriors):
        for nid, p in posteriors.items():
            assert 0.0 <= p <= 1.0, f"{nid} posterior {p} out of [0,1]"

    def test_no_warnings_on_acyclic_graph(self, payload):
        response = run_inference(payload)
        assert response.warnings == []


# --------------------------------------------------------------------------- #
#  Root nodes: posterior ≈ credence
# --------------------------------------------------------------------------- #

# Root nodes are those with no incoming BN edges.
# In the Carbon Tax graph: evidence-1..4, value-1, assumption-1, factual-4.
ROOT_NODES = [
    "evidence-1",
    "evidence-2",
    "evidence-3",
    "evidence-4",
    "value-1",
    "assumption-1",
    "factual-4",
]


class TestRootNodes:
    """Nodes with no BN parents must get posterior = credence."""

    @pytest.mark.parametrize("node_id", ROOT_NODES)
    def test_posterior_equals_credence(self, node_id, posteriors, credences):
        expected = credences[node_id]
        assert expected is not None
        assert posteriors[node_id] == pytest.approx(expected, abs=1e-4), (
            f"{node_id}: expected posterior ≈ {expected}, got {posteriors[node_id]}"
        )


# --------------------------------------------------------------------------- #
#  Support edges increase posteriors
# --------------------------------------------------------------------------- #


class TestSupportEffects:
    def test_assumption2_boosted_by_evidence4(self, posteriors):
        """assumption-2 (clean alternatives, credence=0.7) supported by evidence-4 (0.95, str=0.85)."""
        assert posteriors["assumption-2"] > 0.7

    def test_causal3_boosted_by_evidence3(self, posteriors):
        """causal-3 (revenue-neutral rebates, credence=0.75) supported by evidence-3 (0.8, str=0.7)."""
        assert posteriors["causal-3"] > 0.75

    def test_factual3_boosted_by_factual4(self, posteriors):
        """factual-3 (leakage smaller, credence=0.65) supported by factual-4 (0.7, str=0.35)."""
        assert posteriors["factual-3"] > 0.65


# --------------------------------------------------------------------------- #
#  Undermine edges decrease posteriors
# --------------------------------------------------------------------------- #


class TestUndermineEffects:
    def test_factual2_undermined_by_causal3(self, posteriors):
        """factual-2 (regressive, credence=0.7) undermined by causal-3 (rebates)."""
        assert posteriors["factual-2"] < 0.7

    def test_causal2_near_base_with_opposing_forces(self, posteriors):
        """causal-2 (competitiveness, credence=0.5): support + undermine roughly cancel."""
        assert 0.3 < posteriors["causal-2"] < 0.7


# --------------------------------------------------------------------------- #
#  Contradiction edges
# --------------------------------------------------------------------------- #


class TestContradictionEffects:
    def test_value2_contradicted_by_value1(self, posteriors):
        """value-2 (economic, credence=0.7) contradicted by value-1 (environmental, 0.9, str=0.75)."""
        assert posteriors["value-2"] < 0.7


# --------------------------------------------------------------------------- #
#  DependsOn edges
# --------------------------------------------------------------------------- #


class TestDependsOnEffects:
    def test_causal1_with_mixed_deps_and_support(self, posteriors):
        """causal-1 (credence=0.8): supported by evidence, but depends on shaky assumption-1 (0.5).

        Posterior should stay near credence — support and dependency drag balance.
        """
        assert 0.6 < posteriors["causal-1"] < 0.95


# --------------------------------------------------------------------------- #
#  Policy node (final aggregation)
# --------------------------------------------------------------------------- #


class TestPolicyAggregation:
    def test_policy_posterior_below_credence(self, posteriors):
        """policy-1 (credence=0.6): 3 undermine sources vs 2 support → posterior < credence."""
        assert posteriors["policy-1"] < 0.6

    def test_policy_posterior_positive(self, posteriors):
        """Policy should still have a meaningful positive posterior."""
        assert posteriors["policy-1"] > 0.1


# --------------------------------------------------------------------------- #
#  FastAPI endpoint integration
# --------------------------------------------------------------------------- #


class TestEndpointIntegration:
    """Same checks via the HTTP endpoint to verify serialization round-trip."""

    @pytest.fixture(scope="class")
    def api_result(self, carbon_tax_raw):
        client = TestClient(app)
        api_payload = {
            "nodes": [
                {
                    "id": n["id"],
                    "nodeType": n["data"]["nodeType"],
                    "label": n["data"]["label"],
                    "credence": n["data"].get("credence"),
                }
                for n in carbon_tax_raw["nodes"]
            ],
            "edges": [
                {
                    "id": e["id"],
                    "source": e["source"],
                    "target": e["target"],
                    "edgeType": e["data"]["edgeType"],
                    "strength": e["data"].get("strength"),
                }
                for e in carbon_tax_raw["edges"]
            ],
        }
        response = client.post("/infer", json=api_payload)
        assert response.status_code == 200
        return response.json()

    def test_all_nodes_returned(self, api_result, carbon_tax_raw):
        returned_ids = {n["id"] for n in api_result["result"]["nodes"]}
        expected_ids = {n["id"] for n in carbon_tax_raw["nodes"]}
        assert returned_ids == expected_ids

    def test_no_warnings(self, api_result):
        assert api_result["warnings"] == []

    def test_posteriors_match_direct_call(self, api_result, posteriors):
        """HTTP endpoint must produce the same posteriors as calling run_inference directly."""
        for node in api_result["result"]["nodes"]:
            assert node["posterior"] == pytest.approx(
                posteriors[node["id"]], abs=1e-6
            ), f"Mismatch for {node['id']}"


# --------------------------------------------------------------------------- #
#  Edge cases derived from the Carbon Tax structure
# --------------------------------------------------------------------------- #


class TestEdgeCases:
    def test_cycle_detection_on_mutated_graph(self, payload):
        """Inject a cycle into the Carbon Tax graph and verify it's detected."""
        # Add an edge creating a cycle: policy-1 → causal-1 (causal-1 already → policy-1)
        cycle_edge = InferenceEdge.model_validate(
            {
                "id": "cycle-edge",
                "source": "policy-1",
                "target": "causal-1",
                "edgeType": "Supports",
                "strength": 0.2,
            }
        )
        mutated = InferencePayload(
            nodes=payload.nodes,
            edges=[*payload.edges, cycle_edge],
        )
        response = run_inference(mutated)
        assert len(response.warnings) > 0
        assert any("Cycle detected" in w for w in response.warnings)
        # All nodes should still get posteriors
        assert len(response.result.nodes) == len(payload.nodes)

    def test_null_credences_default_to_half(self):
        """Nodes with null credence should get posterior ≈ 0.5 when isolated."""
        null_payload = InferencePayload.model_validate(
            {
                "nodes": [
                    {"id": "x", "nodeType": "FactualClaim", "label": "X", "credence": None},
                ],
                "edges": [],
            }
        )
        response = run_inference(null_payload)
        assert response.result.nodes[0].posterior == pytest.approx(0.5, abs=1e-4)

    def test_null_strength_defaults_gracefully(self, carbon_tax_raw):
        """Edges with null strength should still produce valid posteriors."""
        # Take a minimal subgraph and null out all strengths
        null_payload = InferencePayload.model_validate(
            {
                "nodes": [
                    {"id": "evidence-1", "nodeType": "Evidence", "label": "E", "credence": 0.85},
                    {"id": "causal-1", "nodeType": "CausalClaim", "label": "C", "credence": 0.8},
                ],
                "edges": [
                    {
                        "id": "e1",
                        "source": "evidence-1",
                        "target": "causal-1",
                        "edgeType": "Supports",
                        "strength": None,
                    },
                ],
            }
        )
        response = run_inference(null_payload)
        posteriors = {n.id: n.posterior for n in response.result.nodes}
        assert 0.0 <= posteriors["causal-1"] <= 1.0
        # With null strength (defaults to 0.5) and strong evidence, should still push up
        assert posteriors["causal-1"] > 0.5
