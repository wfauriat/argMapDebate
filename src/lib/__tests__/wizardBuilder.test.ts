import { describe, it, expect } from "vitest";
import { buildGraphFromWizard } from "@/lib/wizardBuilder";
import { NodeType } from "@/types/nodes";
import { EdgeType } from "@/types/edges";
import type { ArgumentNodeData } from "@/types/nodes";

describe("buildGraphFromWizard", () => {
  it("creates a Policy node from the claim", () => {
    const graph = buildGraphFromWizard({
      claim: "Test claim",
      supports: [],
      oppositions: [],
      assumptions: [],
      evidence: [],
    });
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].type).toBe(NodeType.Policy);
    expect((graph.nodes[0].data as ArgumentNodeData).label).toBe("Test claim");
  });

  it("creates FactualClaim + Supports edge for supports", () => {
    const graph = buildGraphFromWizard({
      claim: "Main",
      supports: ["Support 1", "Support 2"],
      oppositions: [],
      assumptions: [],
      evidence: [],
    });
    // 1 policy + 2 supports
    expect(graph.nodes).toHaveLength(3);
    const supportNodes = graph.nodes.filter(
      (n) => n.type === NodeType.FactualClaim
    );
    expect(supportNodes).toHaveLength(2);

    const supportEdges = graph.edges.filter(
      (e) => e.data?.edgeType === EdgeType.Supports
    );
    expect(supportEdges).toHaveLength(2);
    // Each support edge targets the claim
    const claimId = graph.nodes[0].id;
    for (const edge of supportEdges) {
      expect(edge.target).toBe(claimId);
    }
  });

  it("creates FactualClaim + Undermines edge for oppositions", () => {
    const graph = buildGraphFromWizard({
      claim: "Main",
      supports: [],
      oppositions: ["Opposition 1"],
      assumptions: [],
      evidence: [],
    });
    expect(graph.nodes).toHaveLength(2);
    const underminesEdges = graph.edges.filter(
      (e) => e.data?.edgeType === EdgeType.Undermines
    );
    expect(underminesEdges).toHaveLength(1);
    expect(underminesEdges[0].target).toBe(graph.nodes[0].id);
  });

  it("creates Assumption + DependsOn edge for assumptions", () => {
    const graph = buildGraphFromWizard({
      claim: "Main",
      supports: [],
      oppositions: [],
      assumptions: ["Assumption 1"],
      evidence: [],
    });
    expect(graph.nodes).toHaveLength(2);
    const assumptionNode = graph.nodes.find(
      (n) => n.type === NodeType.Assumption
    );
    expect(assumptionNode).toBeDefined();

    const dependsOnEdges = graph.edges.filter(
      (e) => e.data?.edgeType === EdgeType.DependsOn
    );
    expect(dependsOnEdges).toHaveLength(1);
    // DependsOn: source=claim, target=assumption
    expect(dependsOnEdges[0].source).toBe(graph.nodes[0].id);
    expect(dependsOnEdges[0].target).toBe(assumptionNode!.id);
  });

  it("evidence supports first support node (or policy if no supports)", () => {
    // With supports: evidence targets first support
    const withSupports = buildGraphFromWizard({
      claim: "Main",
      supports: ["S1"],
      oppositions: [],
      assumptions: [],
      evidence: ["E1"],
    });
    const supportNode = withSupports.nodes.find(
      (n) => n.type === NodeType.FactualClaim
    );
    const evidenceEdge = withSupports.edges.find(
      (e) =>
        withSupports.nodes.find(
          (n) => n.id === e.source && n.type === NodeType.Evidence
        ) !== undefined
    );
    expect(evidenceEdge!.target).toBe(supportNode!.id);

    // Without supports: evidence targets policy
    const withoutSupports = buildGraphFromWizard({
      claim: "Main",
      supports: [],
      oppositions: [],
      assumptions: [],
      evidence: ["E1"],
    });
    const policyId = withoutSupports.nodes[0].id;
    const evEdge2 = withoutSupports.edges[0];
    expect(evEdge2.target).toBe(policyId);
  });

  it("empty arrays produce no extra nodes", () => {
    const graph = buildGraphFromWizard({
      claim: "Only claim",
      supports: [],
      oppositions: [],
      assumptions: [],
      evidence: [],
    });
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(0);
  });

  it("skips empty/whitespace-only strings", () => {
    const graph = buildGraphFromWizard({
      claim: "Main",
      supports: ["", "  ", "Valid"],
      oppositions: [],
      assumptions: [],
      evidence: [],
    });
    // 1 policy + 1 valid support
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
  });

  it("all IDs are unique", () => {
    const graph = buildGraphFromWizard({
      claim: "Main",
      supports: ["S1", "S2"],
      oppositions: ["O1"],
      assumptions: ["A1"],
      evidence: ["E1"],
    });
    const nodeIds = graph.nodes.map((n) => n.id);
    const edgeIds = graph.edges.map((e) => e.id);
    const allIds = [...nodeIds, ...edgeIds];
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
