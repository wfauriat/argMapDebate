"""Tests for the Bayesian Network builder and inference engine."""

import math

import pytest

from app.bn_builder import (
    CONTRADICT_SCALE,
    DEPENDS_SCALE,
    SUPPORT_SCALE,
    UNDERMINE_SCALE,
    _get_bn_edges,
    _logit,
    _sigmoid,
    run_inference,
)
from app.models import (
    EdgeType,
    InferenceEdge,
    InferenceNode,
    InferencePayload,
    NodeType,
)


class TestMathHelpers:
    def test_sigmoid_zero(self):
        assert _sigmoid(0) == pytest.approx(0.5)

    def test_logit_half(self):
        assert _logit(0.5) == pytest.approx(0.0)

    def test_roundtrip(self):
        for p in [0.1, 0.3, 0.5, 0.7, 0.9]:
            assert _sigmoid(_logit(p)) == pytest.approx(p, abs=1e-6)

    def test_sigmoid_extreme_positive(self):
        assert _sigmoid(1000) == 1.0

    def test_sigmoid_extreme_negative(self):
        assert _sigmoid(-1000) == 0.0


class TestEdgeDirectionMapping:
    def test_supports_forward(self):
        edge = InferenceEdge(
            id="e1", source="A", target="B", edge_type=EdgeType.Supports, strength=0.8
        )
        bn_edges = _get_bn_edges([edge])
        assert len(bn_edges) == 1
        parent, child, _ = bn_edges[0]
        assert parent == "A"
        assert child == "B"

    def test_undermines_forward(self):
        edge = InferenceEdge(
            id="e1", source="A", target="B", edge_type=EdgeType.Undermines, strength=0.8
        )
        bn_edges = _get_bn_edges([edge])
        parent, child, _ = bn_edges[0]
        assert parent == "A"
        assert child == "B"

    def test_depends_on_reversed(self):
        edge = InferenceEdge(
            id="e1", source="A", target="B", edge_type=EdgeType.DependsOn, strength=0.8
        )
        bn_edges = _get_bn_edges([edge])
        parent, child, _ = bn_edges[0]
        # DependsOn is reversed: target → source
        assert parent == "B"
        assert child == "A"

    def test_contradicts_forward(self):
        edge = InferenceEdge(
            id="e1", source="A", target="B", edge_type=EdgeType.Contradicts, strength=0.8
        )
        bn_edges = _get_bn_edges([edge])
        parent, child, _ = bn_edges[0]
        assert parent == "A"
        assert child == "B"


class TestCycleDetection:
    def test_cycle_is_broken(self):
        payload = InferencePayload(
            nodes=[
                InferenceNode(id="A", node_type=NodeType.FactualClaim, label="A", credence=0.5),
                InferenceNode(id="B", node_type=NodeType.FactualClaim, label="B", credence=0.5),
            ],
            edges=[
                InferenceEdge(
                    id="e1", source="A", target="B", edge_type=EdgeType.Supports, strength=0.8
                ),
                InferenceEdge(
                    id="e2", source="B", target="A", edge_type=EdgeType.Supports, strength=0.3
                ),
            ],
        )
        result = run_inference(payload)
        assert len(result.warnings) > 0
        assert "Cycle detected" in result.warnings[0]
        # Both nodes should still have posteriors
        assert len(result.result.nodes) == 2


class TestSingleRootNode:
    def test_posterior_equals_credence(self):
        payload = InferencePayload(
            nodes=[
                InferenceNode(
                    id="n1", node_type=NodeType.FactualClaim, label="Root", credence=0.7
                )
            ],
            edges=[],
        )
        result = run_inference(payload)
        assert len(result.result.nodes) == 1
        assert result.result.nodes[0].id == "n1"
        assert result.result.nodes[0].posterior == pytest.approx(0.7, abs=1e-4)

    def test_null_credence_defaults_to_half(self):
        payload = InferencePayload(
            nodes=[
                InferenceNode(
                    id="n1", node_type=NodeType.Evidence, label="Root", credence=None
                )
            ],
            edges=[],
        )
        result = run_inference(payload)
        assert result.result.nodes[0].posterior == pytest.approx(0.5, abs=1e-4)


class TestSupportEdge:
    def test_support_increases_posterior(self):
        payload = InferencePayload(
            nodes=[
                InferenceNode(
                    id="evidence", node_type=NodeType.Evidence, label="Evidence", credence=0.9
                ),
                InferenceNode(
                    id="claim", node_type=NodeType.FactualClaim, label="Claim", credence=0.5
                ),
            ],
            edges=[
                InferenceEdge(
                    id="e1",
                    source="evidence",
                    target="claim",
                    edge_type=EdgeType.Supports,
                    strength=0.8,
                ),
            ],
        )
        result = run_inference(payload)
        posteriors = {n.id: n.posterior for n in result.result.nodes}
        # Claim should be above its base credence of 0.5
        assert posteriors["claim"] > 0.5


class TestUndermineEdge:
    def test_undermine_decreases_posterior(self):
        payload = InferencePayload(
            nodes=[
                InferenceNode(
                    id="counter", node_type=NodeType.Evidence, label="Counter", credence=0.9
                ),
                InferenceNode(
                    id="claim", node_type=NodeType.FactualClaim, label="Claim", credence=0.5
                ),
            ],
            edges=[
                InferenceEdge(
                    id="e1",
                    source="counter",
                    target="claim",
                    edge_type=EdgeType.Undermines,
                    strength=0.8,
                ),
            ],
        )
        result = run_inference(payload)
        posteriors = {n.id: n.posterior for n in result.result.nodes}
        # Claim should be below its base credence of 0.5
        assert posteriors["claim"] < 0.5


class TestDependsOnEdge:
    def test_dependency_failure_reduces_posterior(self):
        """When a node DependsOn another with low credence, its posterior drops."""
        payload = InferencePayload(
            nodes=[
                InferenceNode(
                    id="dep", node_type=NodeType.Assumption, label="Dependency", credence=0.2
                ),
                InferenceNode(
                    id="claim", node_type=NodeType.FactualClaim, label="Claim", credence=0.8
                ),
            ],
            edges=[
                # claim DependsOn dep → BN edge: dep → claim
                InferenceEdge(
                    id="e1",
                    source="claim",
                    target="dep",
                    edge_type=EdgeType.DependsOn,
                    strength=0.9,
                ),
            ],
        )
        result = run_inference(payload)
        posteriors = {n.id: n.posterior for n in result.result.nodes}
        # Claim's posterior should be pulled down since its dependency has low credence
        assert posteriors["claim"] < 0.8


class TestMultipleParents:
    def test_combined_effects(self):
        payload = InferencePayload(
            nodes=[
                InferenceNode(
                    id="support", node_type=NodeType.Evidence, label="Support", credence=0.9
                ),
                InferenceNode(
                    id="counter", node_type=NodeType.Evidence, label="Counter", credence=0.9
                ),
                InferenceNode(
                    id="claim", node_type=NodeType.FactualClaim, label="Claim", credence=0.5
                ),
            ],
            edges=[
                InferenceEdge(
                    id="e1",
                    source="support",
                    target="claim",
                    edge_type=EdgeType.Supports,
                    strength=0.7,
                ),
                InferenceEdge(
                    id="e2",
                    source="counter",
                    target="claim",
                    edge_type=EdgeType.Undermines,
                    strength=0.7,
                ),
            ],
        )
        result = run_inference(payload)
        posteriors = {n.id: n.posterior for n in result.result.nodes}
        # With equal and opposite forces, claim should stay near 0.5
        assert posteriors["claim"] == pytest.approx(0.5, abs=0.15)


class TestMultiNodeGraph:
    def test_three_node_chain(self):
        """Evidence → supports Claim1 → supports Claim2."""
        payload = InferencePayload(
            nodes=[
                InferenceNode(
                    id="evidence", node_type=NodeType.Evidence, label="E", credence=0.9
                ),
                InferenceNode(
                    id="claim1", node_type=NodeType.FactualClaim, label="C1", credence=0.5
                ),
                InferenceNode(
                    id="claim2", node_type=NodeType.CausalClaim, label="C2", credence=0.5
                ),
            ],
            edges=[
                InferenceEdge(
                    id="e1",
                    source="evidence",
                    target="claim1",
                    edge_type=EdgeType.Supports,
                    strength=0.8,
                ),
                InferenceEdge(
                    id="e2",
                    source="claim1",
                    target="claim2",
                    edge_type=EdgeType.Supports,
                    strength=0.8,
                ),
            ],
        )
        result = run_inference(payload)
        posteriors = {n.id: n.posterior for n in result.result.nodes}
        # Both claims should be above 0.5
        assert posteriors["claim1"] > 0.5
        assert posteriors["claim2"] > 0.5
        # Evidence posterior should be close to its credence
        assert posteriors["evidence"] == pytest.approx(0.9, abs=1e-4)

    def test_mixed_edge_types(self):
        """Support + contradiction on same target."""
        payload = InferencePayload(
            nodes=[
                InferenceNode(id="A", node_type=NodeType.Evidence, label="A", credence=0.8),
                InferenceNode(id="B", node_type=NodeType.Evidence, label="B", credence=0.8),
                InferenceNode(id="C", node_type=NodeType.FactualClaim, label="C", credence=0.5),
            ],
            edges=[
                InferenceEdge(
                    id="e1", source="A", target="C",
                    edge_type=EdgeType.Supports, strength=0.9,
                ),
                InferenceEdge(
                    id="e2", source="B", target="C",
                    edge_type=EdgeType.Contradicts, strength=0.9,
                ),
            ],
        )
        result = run_inference(payload)
        posteriors = {n.id: n.posterior for n in result.result.nodes}
        # With strong support and strong contradiction from equally credible sources,
        # the posterior should be near 0.5
        assert posteriors["C"] == pytest.approx(0.5, abs=0.15)


class TestEmptyGraph:
    def test_empty_returns_empty(self):
        payload = InferencePayload(nodes=[], edges=[])
        result = run_inference(payload)
        assert result.result.nodes == []
        assert result.warnings == []
