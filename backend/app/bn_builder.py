"""Bayesian Network builder and inference engine.

Converts an argument graph (nodes + edges) into a pgmpy BayesianNetwork,
constructs conditional probability distributions using a log-odds model,
runs variable elimination, and returns posterior probabilities.
"""

from __future__ import annotations

import math
from itertools import product

import numpy as np
from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination
from pgmpy.models import BayesianNetwork

from app.models import (
    EdgeType,
    InferenceEdge,
    InferenceNodeResult,
    InferencePayload,
    InferenceResponse,
    InferenceResult,
)

# Scale factors for each edge type's influence in the log-odds model
SUPPORT_SCALE = 1.2
UNDERMINE_SCALE = 1.2
DEPENDS_SCALE = 2.0
CONTRADICT_SCALE = 1.2

# When a supporting/undermining/contradicting parent is False, the reverse
# effect is scaled by this factor.  0.5 was too aggressive — it meant "parent
# being false actively hurts/helps almost as much as parent being true".
# 0.25 gives a mild nudge: "this evidence isn't present" ≠ "this evidence
# actively refutes you".
ABSENCE_PENALTY_FACTOR = 0.25

# Maximum parents per node (CPD has 2^k columns)
MAX_PARENTS = 15


def _logit(p: float) -> float:
    """Convert probability to log-odds. Clamps to avoid infinities."""
    p = max(1e-9, min(1 - 1e-9, p))
    return math.log(p / (1 - p))


def _sigmoid(x: float) -> float:
    """Convert log-odds to probability."""
    if x > 500:
        return 1.0
    if x < -500:
        return 0.0
    return 1.0 / (1.0 + math.exp(-x))


def _get_bn_edges(
    edges: list[InferenceEdge],
) -> list[tuple[str, str, InferenceEdge]]:
    """Map argument graph edges to BN directed edges (parent, child, original_edge).

    - Supports/Undermines/Contradicts: source → target (source is BN parent)
    - DependsOn: target → source (reversed — the dependency is the influencer)
    """
    bn_edges: list[tuple[str, str, InferenceEdge]] = []
    for edge in edges:
        if edge.edge_type == EdgeType.DependsOn:
            bn_edges.append((edge.target, edge.source, edge))
        else:
            bn_edges.append((edge.source, edge.target, edge))
    return bn_edges


def _detect_and_break_cycles(
    bn_edges: list[tuple[str, str, InferenceEdge]],
) -> tuple[list[tuple[str, str, InferenceEdge]], list[str]]:
    """Remove weakest edges until the graph is acyclic. Returns (acyclic_edges, warnings)."""
    warnings: list[str] = []

    while True:
        # Build adjacency list
        adj: dict[str, list[int]] = {}
        for i, (parent, child, _) in enumerate(bn_edges):
            adj.setdefault(parent, []).append(i)
            adj.setdefault(child, [])  # ensure child is in adj

        # DFS-based cycle detection
        WHITE, GRAY, BLACK = 0, 1, 2
        color: dict[str, int] = {node: WHITE for node in adj}
        cycle_edge_indices: list[int] = []

        def dfs(node: str) -> bool:
            color[node] = GRAY
            for idx in adj.get(node, []):
                _, child, _ = bn_edges[idx]
                if color.get(child, WHITE) == GRAY:
                    cycle_edge_indices.append(idx)
                    return True
                if color.get(child, WHITE) == WHITE:
                    if dfs(child):
                        return True
            color[node] = BLACK
            return False

        found_cycle = False
        for node in list(adj.keys()):
            if color.get(node, WHITE) == WHITE:
                if dfs(node):
                    found_cycle = True
                    break

        if not found_cycle:
            break

        # Remove the weakest edge involved in a cycle
        if cycle_edge_indices:
            weakest_idx = min(
                cycle_edge_indices,
                key=lambda i: bn_edges[i][2].strength
                if bn_edges[i][2].strength is not None
                else 0.5,
            )
            removed = bn_edges[weakest_idx]
            warnings.append(
                f"Cycle detected: removed edge '{removed[2].id}' "
                f"({removed[0]} → {removed[1]}, strength={removed[2].strength})"
            )
            bn_edges = [e for j, e in enumerate(bn_edges) if j != weakest_idx]

    return bn_edges, warnings


def _build_cpd(
    node_id: str,
    credence: float | None,
    parent_info: list[tuple[str, InferenceEdge]],
) -> TabularCPD:
    """Build a TabularCPD for a node given its parents and edge types.

    Uses a log-odds model: base log-odds from credence, adjusted by
    parent states and edge strengths.
    """
    base_credence = credence if credence is not None else 0.5
    base_log_odds = _logit(base_credence)

    if not parent_info:
        # Root node: simple prior
        p_true = base_credence
        return TabularCPD(
            variable=node_id,
            variable_card=2,
            values=[[1 - p_true], [p_true]],
            state_names={node_id: [False, True]},
        )

    parent_ids = [pid for pid, _ in parent_info]
    n_parents = len(parent_ids)
    n_combos = 2**n_parents

    # Each column is a parent state combination
    # Parent states: False=0, True=1
    p_true_values = []
    for combo_idx in range(n_combos):
        # Decode parent states from column index
        parent_states = []
        for p_idx in range(n_parents):
            parent_states.append(bool((combo_idx >> p_idx) & 1))

        delta = 0.0
        for p_idx, (_, edge) in enumerate(parent_info):
            strength = edge.strength if edge.strength is not None else 0.5
            p_state = parent_states[p_idx]

            if edge.edge_type == EdgeType.Supports:
                if p_state:
                    delta += strength * SUPPORT_SCALE
                else:
                    delta -= strength * SUPPORT_SCALE * ABSENCE_PENALTY_FACTOR
            elif edge.edge_type == EdgeType.Undermines:
                if p_state:
                    delta -= strength * UNDERMINE_SCALE
                else:
                    delta += strength * UNDERMINE_SCALE * ABSENCE_PENALTY_FACTOR
            elif edge.edge_type == EdgeType.DependsOn:
                if not p_state:
                    delta -= strength * DEPENDS_SCALE
            elif edge.edge_type == EdgeType.Contradicts:
                if p_state:
                    delta -= strength * CONTRADICT_SCALE
                else:
                    delta += strength * CONTRADICT_SCALE * ABSENCE_PENALTY_FACTOR

        p_true = _sigmoid(base_log_odds + delta)
        p_true_values.append(p_true)

    values = [
        [1 - p for p in p_true_values],  # P(False | parents)
        p_true_values,  # P(True | parents)
    ]

    return TabularCPD(
        variable=node_id,
        variable_card=2,
        values=values,
        evidence=parent_ids,
        evidence_card=[2] * n_parents,
        state_names={
            node_id: [False, True],
            **{pid: [False, True] for pid in parent_ids},
        },
    )


def run_inference(payload: InferencePayload) -> InferenceResponse:
    """Run Bayesian inference on an argument graph.

    1. Handle empty graph
    2. Detect/break cycles
    3. Build BN edges + parent map
    4. Construct pgmpy BayesianNetwork + CPDs
    5. Run VariableElimination
    6. Return posteriors
    """
    warnings: list[str] = []

    # Empty graph — return empty result
    if not payload.nodes:
        return InferenceResponse(
            result=InferenceResult(nodes=[]),
            warnings=warnings,
        )

    # Build node credence lookup
    node_credence: dict[str, float | None] = {
        n.id: n.credence for n in payload.nodes
    }
    node_ids = set(node_credence.keys())

    # Filter edges to only those connecting existing nodes
    valid_edges = [
        e for e in payload.edges if e.source in node_ids and e.target in node_ids
    ]

    # Map to BN edges
    bn_edges = _get_bn_edges(valid_edges)

    # Break cycles
    bn_edges, cycle_warnings = _detect_and_break_cycles(bn_edges)
    warnings.extend(cycle_warnings)

    # Build parent map: child_id → [(parent_id, edge)]
    parent_map: dict[str, list[tuple[str, InferenceEdge]]] = {
        n.id: [] for n in payload.nodes
    }
    bn_edge_tuples: list[tuple[str, str]] = []

    for parent, child, edge in bn_edges:
        if len(parent_map[child]) >= MAX_PARENTS:
            warnings.append(
                f"Node '{child}' has more than {MAX_PARENTS} parents; "
                f"ignoring edge '{edge.id}'"
            )
            continue
        parent_map[child].append((parent, edge))
        bn_edge_tuples.append((parent, child))

    # Handle isolated nodes (no edges at all) — just return credence as posterior
    if not bn_edge_tuples:
        results = []
        for node in payload.nodes:
            posterior = node.credence if node.credence is not None else 0.5
            results.append(InferenceNodeResult(id=node.id, posterior=round(posterior, 6)))
        return InferenceResponse(
            result=InferenceResult(nodes=results),
            warnings=warnings,
        )

    # Build pgmpy BayesianNetwork
    bn = BayesianNetwork(bn_edge_tuples)

    # Add isolated nodes (nodes with no edges in the BN)
    connected_nodes = set()
    for p, c in bn_edge_tuples:
        connected_nodes.add(p)
        connected_nodes.add(c)

    for node in payload.nodes:
        if node.id not in connected_nodes:
            bn.add_node(node.id)

    # Add CPDs for all nodes
    for node in payload.nodes:
        cpd = _build_cpd(node.id, node.credence, parent_map[node.id])
        bn.add_cpds(cpd)

    # Validate model
    assert bn.check_model()

    # Run inference
    inference_engine = VariableElimination(bn)
    results: list[InferenceNodeResult] = []

    for node in payload.nodes:
        result = inference_engine.query([node.id])
        # P(node=True) — index 1 in state_names [False, True]
        p_true = float(result.values[1])
        results.append(
            InferenceNodeResult(id=node.id, posterior=round(p_true, 6))
        )

    return InferenceResponse(
        result=InferenceResult(nodes=results),
        warnings=warnings,
    )
