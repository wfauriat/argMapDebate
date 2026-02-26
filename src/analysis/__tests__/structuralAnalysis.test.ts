import { describe, it, expect } from "vitest";
import {
  getUnsupportedClaims,
  getIsolatedNodes,
  getGraphStats,
  getLoadBearingAssumptions,
  getSensitivityAnalysis,
} from "@/analysis/structuralAnalysis";
import type { ArgumentNode } from "@/types/nodes";
import { NodeType, NodeStatus } from "@/types/nodes";
import type { ArgumentEdge } from "@/types/edges";
import { EdgeType, EdgeWeight } from "@/types/edges";

// --- Helpers ---

function makeNode(id: string, type: NodeType, credence?: number | null): ArgumentNode {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: {
      nodeType: type,
      label: id,
      notes: "",
      status: NodeStatus.Unsupported,
      ...(credence !== undefined ? { credence } : {}),
    } as ArgumentNode["data"],
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  edgeType: EdgeType,
  weight?: EdgeWeight,
  strength?: number | null
): ArgumentEdge {
  return {
    id,
    source,
    target,
    type: edgeType,
    data: { edgeType, notes: "", weight, ...(strength !== undefined ? { strength } : {}) },
  };
}

// --- getUnsupportedClaims ---

describe("getUnsupportedClaims", () => {
  it("returns [] for an empty graph", () => {
    expect(getUnsupportedClaims([], [])).toEqual([]);
  });

  it("returns claim with no Supports edge", () => {
    const nodes = [makeNode("c1", NodeType.FactualClaim)];
    const result = getUnsupportedClaims(nodes, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("c1");
  });

  it("does not return claim that has a Supports edge", () => {
    const nodes = [
      makeNode("c1", NodeType.FactualClaim),
      makeNode("e1", NodeType.Evidence),
    ];
    const edges = [makeEdge("edge1", "e1", "c1", EdgeType.Supports)];
    const result = getUnsupportedClaims(nodes, edges);
    expect(result).toHaveLength(0);
  });

  it("never returns Evidence or Assumption nodes", () => {
    const nodes = [
      makeNode("e1", NodeType.Evidence),
      makeNode("a1", NodeType.Assumption),
    ];
    const result = getUnsupportedClaims(nodes, []);
    expect(result).toHaveLength(0);
  });

  it("returns claim with only Undermines edge (still unsupported)", () => {
    const nodes = [
      makeNode("c1", NodeType.Policy),
      makeNode("c2", NodeType.FactualClaim),
    ];
    const edges = [makeEdge("edge1", "c2", "c1", EdgeType.Undermines)];
    const result = getUnsupportedClaims(nodes, edges);
    expect(result.map((n) => n.id)).toContain("c1");
  });

  it("treats CausalClaim and Policy as claim types", () => {
    const nodes = [
      makeNode("cc", NodeType.CausalClaim),
      makeNode("p", NodeType.Policy),
    ];
    const result = getUnsupportedClaims(nodes, []);
    expect(result).toHaveLength(2);
  });
});

// --- getIsolatedNodes ---

describe("getIsolatedNodes", () => {
  it("returns node with no edges", () => {
    const nodes = [makeNode("n1", NodeType.FactualClaim)];
    const result = getIsolatedNodes(nodes, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("n1");
  });

  it("does not return node that appears in any edge", () => {
    const nodes = [
      makeNode("n1", NodeType.FactualClaim),
      makeNode("n2", NodeType.Evidence),
    ];
    const edges = [makeEdge("e1", "n2", "n1", EdgeType.Supports)];
    const result = getIsolatedNodes(nodes, edges);
    expect(result).toHaveLength(0);
  });

  it("returns only truly isolated nodes in a mixed graph", () => {
    const nodes = [
      makeNode("n1", NodeType.FactualClaim),
      makeNode("n2", NodeType.Evidence),
      makeNode("n3", NodeType.Assumption),
    ];
    const edges = [makeEdge("e1", "n2", "n1", EdgeType.Supports)];
    const result = getIsolatedNodes(nodes, edges);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("n3");
  });
});

// --- getGraphStats ---

describe("getGraphStats", () => {
  it("counts totalNodes and totalEdges correctly", () => {
    const nodes = [
      makeNode("n1", NodeType.FactualClaim),
      makeNode("n2", NodeType.Evidence),
    ];
    const edges = [makeEdge("e1", "n2", "n1", EdgeType.Supports)];
    const stats = getGraphStats(nodes, edges);
    expect(stats.totalNodes).toBe(2);
    expect(stats.totalEdges).toBe(1);
  });

  it("counts nodesByType correctly", () => {
    const nodes = [
      makeNode("n1", NodeType.FactualClaim),
      makeNode("n2", NodeType.FactualClaim),
      makeNode("n3", NodeType.Evidence),
    ];
    const stats = getGraphStats(nodes, []);
    expect(stats.nodesByType[NodeType.FactualClaim]).toBe(2);
    expect(stats.nodesByType[NodeType.Evidence]).toBe(1);
  });

  it("maxSupportChainDepth: linear chain of 3 → depth 2", () => {
    // A supports B, B supports C → chain of 3 nodes, depth 2 edges
    const nodes = [
      makeNode("a", NodeType.Evidence),
      makeNode("b", NodeType.FactualClaim),
      makeNode("c", NodeType.Policy),
    ];
    const edges = [
      makeEdge("e1", "a", "b", EdgeType.Supports),
      makeEdge("e2", "b", "c", EdgeType.Supports),
    ];
    const stats = getGraphStats(nodes, edges);
    expect(stats.maxSupportChainDepth).toBe(2);
  });

  it("does not infinite loop on a cycle", () => {
    const nodes = [
      makeNode("a", NodeType.FactualClaim),
      makeNode("b", NodeType.FactualClaim),
    ];
    const edges = [
      makeEdge("e1", "a", "b", EdgeType.Supports),
      makeEdge("e2", "b", "a", EdgeType.Supports),
    ];
    // Should complete without hanging
    const stats = getGraphStats(nodes, edges);
    expect(stats.maxSupportChainDepth).toBeGreaterThanOrEqual(1);
  });
});

// --- getLoadBearingAssumptions ---

describe("getLoadBearingAssumptions", () => {
  it("assumption with 3 downstream → downstreamCount=3", () => {
    // Assumption A1, claim C1 depends on A1, C1 supports C2, C2 supports C3
    const nodes = [
      makeNode("a1", NodeType.Assumption),
      makeNode("c1", NodeType.FactualClaim),
      makeNode("c2", NodeType.FactualClaim),
      makeNode("c3", NodeType.Policy),
    ];
    const edges = [
      makeEdge("e1", "c1", "a1", EdgeType.DependsOn), // c1 depends on a1
      makeEdge("e2", "c1", "c2", EdgeType.Supports),   // c1 supports c2
      makeEdge("e3", "c2", "c3", EdgeType.Supports),   // c2 supports c3
    ];
    const results = getLoadBearingAssumptions(nodes, edges);
    expect(results).toHaveLength(1);
    expect(results[0].nodeId).toBe("a1");
    expect(results[0].downstreamCount).toBe(3);
  });

  it("assumption with 0 downstream → not returned", () => {
    const nodes = [makeNode("a1", NodeType.Assumption)];
    const result = getLoadBearingAssumptions(nodes, []);
    expect(result).toHaveLength(0);
  });

  it("sorted by downstream count descending", () => {
    const nodes = [
      makeNode("a1", NodeType.Assumption),
      makeNode("a2", NodeType.Assumption),
      makeNode("c1", NodeType.FactualClaim),
      makeNode("c2", NodeType.FactualClaim),
      makeNode("c3", NodeType.FactualClaim),
    ];
    const edges = [
      // a2 has more downstream: c1, c2, c3
      makeEdge("e1", "c1", "a2", EdgeType.DependsOn),
      makeEdge("e2", "c1", "c2", EdgeType.Supports),
      makeEdge("e3", "c2", "c3", EdgeType.Supports),
      // a1 has 1 downstream: c1
      makeEdge("e4", "c1", "a1", EdgeType.DependsOn),
    ];
    const results = getLoadBearingAssumptions(nodes, edges);
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].downstreamCount).toBeGreaterThanOrEqual(
      results[1].downstreamCount
    );
  });

  it("DependsOn propagation direction: target→source in adjacency", () => {
    // DependsOn edge: source=claim, target=assumption
    // Invalidating the assumption (target) should propagate to the claim (source)
    const nodes = [
      makeNode("a1", NodeType.Assumption),
      makeNode("c1", NodeType.Policy),
    ];
    const edges = [
      makeEdge("e1", "c1", "a1", EdgeType.DependsOn),
    ];
    const results = getLoadBearingAssumptions(nodes, edges);
    expect(results).toHaveLength(1);
    expect(results[0].nodeId).toBe("a1");
    expect(results[0].downstreamNodeIds).toContain("c1");
  });
});

// --- getSensitivityAnalysis ---

describe("getSensitivityAnalysis", () => {
  it("returns null when no support edges exist", () => {
    const nodes = [makeNode("n1", NodeType.FactualClaim)];
    expect(getSensitivityAnalysis(nodes, [])).toBeNull();
  });

  it("returns null for empty graph", () => {
    expect(getSensitivityAnalysis([], [])).toBeNull();
  });

  it("linear chain A→B→C → chainLength=3", () => {
    const nodes = [
      makeNode("a", NodeType.Evidence),
      makeNode("b", NodeType.FactualClaim),
      makeNode("c", NodeType.Policy),
    ];
    const edges = [
      makeEdge("e1", "a", "b", EdgeType.Supports),
      makeEdge("e2", "b", "c", EdgeType.Supports),
    ];
    const result = getSensitivityAnalysis(nodes, edges);
    expect(result).not.toBeNull();
    expect(result!.chainLength).toBe(3);
    expect(result!.chainNodeIds).toHaveLength(3);
  });

  it("identifies weakest edge in mixed weights", () => {
    const nodes = [
      makeNode("a", NodeType.Evidence),
      makeNode("b", NodeType.FactualClaim),
      makeNode("c", NodeType.Policy),
    ];
    const edges = [
      makeEdge("e1", "a", "b", EdgeType.Supports, EdgeWeight.Strong),
      makeEdge("e2", "b", "c", EdgeType.Supports, EdgeWeight.Weak),
    ];
    const result = getSensitivityAnalysis(nodes, edges);
    expect(result).not.toBeNull();
    expect(result!.weakestLink).not.toBeNull();
    expect(result!.weakestLink!.kind).toBe("edge");
    expect(result!.weakestLink!.id).toBe("e2");
    // Backward compat
    expect(result!.weakestEdgeId).toBe("e2");
    expect(result!.weakestEdgeWeight).toBe(EdgeWeight.Weak);
  });

  it("no weight set → treated as Moderate", () => {
    const nodes = [
      makeNode("a", NodeType.Evidence),
      makeNode("b", NodeType.FactualClaim),
      makeNode("c", NodeType.Policy),
    ];
    const edges = [
      makeEdge("e1", "a", "b", EdgeType.Supports, EdgeWeight.Weak),
      makeEdge("e2", "b", "c", EdgeType.Supports), // no weight → Moderate
    ];
    const result = getSensitivityAnalysis(nodes, edges);
    expect(result).not.toBeNull();
    // Weak (0.33) < Moderate (0.67), so e1 is weakest
    expect(result!.weakestLink!.kind).toBe("edge");
    expect(result!.weakestLink!.id).toBe("e1");
  });

  it("numerical strength overrides categorical weight", () => {
    const nodes = [
      makeNode("a", NodeType.Evidence),
      makeNode("b", NodeType.FactualClaim),
      makeNode("c", NodeType.Policy),
    ];
    const edges = [
      // Categorical "Strong" but numerical strength is very low
      makeEdge("e1", "a", "b", EdgeType.Supports, EdgeWeight.Strong, 0.1),
      makeEdge("e2", "b", "c", EdgeType.Supports, undefined, 0.9),
    ];
    const result = getSensitivityAnalysis(nodes, edges);
    expect(result).not.toBeNull();
    expect(result!.weakestLink!.kind).toBe("edge");
    expect(result!.weakestLink!.id).toBe("e1");
    expect(result!.weakestLink!.effectiveStrength).toBeCloseTo(0.1);
  });

  it("low-credence node is identified as weakest link", () => {
    const nodes = [
      makeNode("a", NodeType.Evidence, 0.9),
      makeNode("b", NodeType.Assumption, 0.1),  // very low credence
      makeNode("c", NodeType.Policy, 0.8),
    ];
    const edges = [
      makeEdge("e1", "a", "b", EdgeType.Supports, undefined, 0.8),
      makeEdge("e2", "b", "c", EdgeType.Supports, undefined, 0.8),
    ];
    const result = getSensitivityAnalysis(nodes, edges);
    expect(result).not.toBeNull();
    expect(result!.weakestLink!.kind).toBe("node");
    expect(result!.weakestLink!.id).toBe("b");
    expect(result!.weakestLink!.effectiveStrength).toBe(0.1);
    expect(result!.weakestLink!.reason).toContain("credence");
    // Backward compat: weakestEdgeId should be null when weakest is a node
    expect(result!.weakestEdgeId).toBeNull();
  });

  it("nodes without credence are not considered as weakest links", () => {
    const nodes = [
      makeNode("a", NodeType.Evidence),  // no credence
      makeNode("b", NodeType.FactualClaim),  // no credence
      makeNode("c", NodeType.Policy),  // no credence
    ];
    const edges = [
      makeEdge("e1", "a", "b", EdgeType.Supports, undefined, 0.3),
      makeEdge("e2", "b", "c", EdgeType.Supports, undefined, 0.9),
    ];
    const result = getSensitivityAnalysis(nodes, edges);
    expect(result).not.toBeNull();
    // Only edges are candidates, so weakest is e1 with strength 0.3
    expect(result!.weakestLink!.kind).toBe("edge");
    expect(result!.weakestLink!.id).toBe("e1");
  });

  it("compares edge strength and node credence on same scale", () => {
    const nodes = [
      makeNode("a", NodeType.Evidence, 0.8),
      makeNode("b", NodeType.FactualClaim, 0.5),
      makeNode("c", NodeType.Policy, 0.7),
    ];
    const edges = [
      makeEdge("e1", "a", "b", EdgeType.Supports, undefined, 0.6),
      makeEdge("e2", "b", "c", EdgeType.Supports, undefined, 0.9),
    ];
    const result = getSensitivityAnalysis(nodes, edges);
    expect(result).not.toBeNull();
    // Candidates: node a=0.8, node b=0.5, node c=0.7, edge e1=0.6, edge e2=0.9
    // Weakest is node b with credence 0.5
    expect(result!.weakestLink!.kind).toBe("node");
    expect(result!.weakestLink!.id).toBe("b");
  });
});
