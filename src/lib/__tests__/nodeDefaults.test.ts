import { describe, it, expect } from "vitest";
import { createNodeData } from "@/lib/nodeDefaults";
import { NodeType, NodeStatus } from "@/types/nodes";
import type {
  FactualClaimData,
  CausalClaimData,
  ValueData,
  AssumptionData,
  EvidenceData,
  PolicyData,
} from "@/types/nodes";

describe("createNodeData", () => {
  const allTypes = Object.values(NodeType);

  it("returns an object with label, notes, and status for every NodeType", () => {
    for (const type of allTypes) {
      const data = createNodeData(type);
      expect(data).toHaveProperty("label");
      expect(data).toHaveProperty("notes");
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("nodeType", type);
    }
  });

  it("all default statuses are Unsupported", () => {
    for (const type of allTypes) {
      const data = createNodeData(type);
      expect(data.status).toBe(NodeStatus.Unsupported);
    }
  });

  it("FactualClaim has sources array", () => {
    const data = createNodeData(NodeType.FactualClaim) as FactualClaimData;
    expect(data.nodeType).toBe(NodeType.FactualClaim);
    expect(data.label).toBe("New Factual Claim");
    expect(data.sources).toEqual([]);
  });

  it("CausalClaim has mechanism and sources", () => {
    const data = createNodeData(NodeType.CausalClaim) as CausalClaimData;
    expect(data.nodeType).toBe(NodeType.CausalClaim);
    expect(data.label).toBe("New Causal Claim");
    expect(data.mechanism).toBe("");
    expect(data.sources).toEqual([]);
  });

  it("Value has domain field", () => {
    const data = createNodeData(NodeType.Value) as ValueData;
    expect(data.nodeType).toBe(NodeType.Value);
    expect(data.label).toBe("New Value");
    expect(data.domain).toBe("");
  });

  it("Assumption defaults include isLoadBearing: false", () => {
    const data = createNodeData(NodeType.Assumption) as AssumptionData;
    expect(data.nodeType).toBe(NodeType.Assumption);
    expect(data.label).toBe("New Assumption");
    expect(data.isExplicit).toBe(true);
    expect(data.isLoadBearing).toBe(false);
  });

  it("Evidence defaults include sourceType: 'other'", () => {
    const data = createNodeData(NodeType.Evidence) as EvidenceData;
    expect(data.nodeType).toBe(NodeType.Evidence);
    expect(data.label).toBe("New Evidence");
    expect(data.sourceType).toBe("other");
    expect(data.citation).toBe("");
    expect(data.url).toBe("");
  });

  it("Policy has scope field", () => {
    const data = createNodeData(NodeType.Policy) as PolicyData;
    expect(data.nodeType).toBe(NodeType.Policy);
    expect(data.label).toBe("New Policy");
    expect(data.scope).toBe("");
  });
});
