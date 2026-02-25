import { describe, it, expect } from "vitest";
import {
  buildInferencePayload,
  applyInferenceResult,
} from "@/lib/inferenceExport";
import { NodeType, NodeStatus } from "@/types/nodes";
import { EdgeType } from "@/types/edges";
import type { ArgumentNode } from "@/types/nodes";
import type { ArgumentEdge } from "@/types/edges";
import type { InferenceResult } from "@/types/inference";

function makeNode(overrides: Partial<ArgumentNode> & { id: string }): ArgumentNode {
  return {
    position: { x: 0, y: 0 },
    data: {
      nodeType: NodeType.FactualClaim,
      label: "Test",
      notes: "some notes",
      status: NodeStatus.Unsupported,
      sources: [],
      credence: null,
      posterior: null,
    },
    ...overrides,
  } as ArgumentNode;
}

function makeEdge(overrides: Partial<ArgumentEdge> & { id: string }): ArgumentEdge {
  return {
    source: "n1",
    target: "n2",
    data: {
      edgeType: EdgeType.Supports,
      notes: "edge notes",
    },
    ...overrides,
  } as ArgumentEdge;
}

describe("buildInferencePayload", () => {
  it("strips UI fields from nodes and edges", () => {
    const nodes = [makeNode({ id: "n1" })];
    const edges = [makeEdge({ id: "e1" })];

    const payload = buildInferencePayload(nodes, edges);

    // Node should only have inference fields
    expect(payload.nodes[0]).toEqual({
      id: "n1",
      nodeType: NodeType.FactualClaim,
      label: "Test",
      credence: null,
    });
    // Should not contain UI fields
    expect(payload.nodes[0]).not.toHaveProperty("notes");
    expect(payload.nodes[0]).not.toHaveProperty("status");
    expect(payload.nodes[0]).not.toHaveProperty("position");
    expect(payload.nodes[0]).not.toHaveProperty("sources");

    // Edge should only have inference fields
    expect(payload.edges[0]).toEqual({
      id: "e1",
      source: "n1",
      target: "n2",
      edgeType: EdgeType.Supports,
      strength: null,
    });
    expect(payload.edges[0]).not.toHaveProperty("notes");
  });

  it("maps undefined credence to null", () => {
    const node = makeNode({ id: "n1" });
    // Simulate an old node without credence field
    delete (node.data as Record<string, unknown>).credence;

    const payload = buildInferencePayload([node], []);
    expect(payload.nodes[0].credence).toBeNull();
  });

  it("preserves 0.0 credence (not treated as null)", () => {
    const node = makeNode({ id: "n1" });
    node.data = { ...node.data, credence: 0.0 };

    const payload = buildInferencePayload([node], []);
    expect(payload.nodes[0].credence).toBe(0.0);
  });

  it("returns empty payload for empty graph", () => {
    const payload = buildInferencePayload([], []);
    expect(payload.nodes).toEqual([]);
    expect(payload.edges).toEqual([]);
  });
});

describe("applyInferenceResult", () => {
  it("sets posteriors on matching nodes", () => {
    const nodes = [
      makeNode({ id: "n1" }),
      makeNode({ id: "n2" }),
    ];

    const result: InferenceResult = {
      nodes: [
        { id: "n1", posterior: 0.85 },
        { id: "n2", posterior: 0.42 },
      ],
    };

    const updated = applyInferenceResult(nodes, result);
    expect(updated[0].data.posterior).toBe(0.85);
    expect(updated[1].data.posterior).toBe(0.42);
  });

  it("leaves unmatched nodes unchanged", () => {
    const nodes = [
      makeNode({ id: "n1" }),
      makeNode({ id: "n2" }),
    ];

    const result: InferenceResult = {
      nodes: [{ id: "n1", posterior: 0.75 }],
    };

    const updated = applyInferenceResult(nodes, result);
    expect(updated[0].data.posterior).toBe(0.75);
    expect(updated[1].data.posterior).toBeNull(); // unchanged from default
  });

  it("does not mutate original array", () => {
    const nodes = [makeNode({ id: "n1" })];
    const result: InferenceResult = {
      nodes: [{ id: "n1", posterior: 0.9 }],
    };

    const updated = applyInferenceResult(nodes, result);
    expect(updated).not.toBe(nodes);
    expect(updated[0]).not.toBe(nodes[0]);
    expect(nodes[0].data.posterior).toBeNull(); // original untouched
  });
});
