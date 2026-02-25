import { describe, it, expect } from "vitest";
import { exportGraph, importGraph } from "@/lib/serialization";
import type { ArgumentGraph } from "@/types/graph";
import { NodeType, NodeStatus } from "@/types/nodes";
import { EdgeType } from "@/types/edges";

function makeTestGraph(): ArgumentGraph {
  return {
    title: "Test Graph",
    description: "A test",
    nodes: [
      {
        id: "n1",
        type: NodeType.FactualClaim,
        position: { x: 10, y: 20 },
        data: {
          nodeType: NodeType.FactualClaim,
          label: "Claim 1",
          notes: "",
          status: NodeStatus.Unsupported,
          sources: [],
        },
      },
      {
        id: "n2",
        type: NodeType.Evidence,
        position: { x: 100, y: 200 },
        data: {
          nodeType: NodeType.Evidence,
          label: "Evidence 1",
          notes: "",
          status: NodeStatus.Unsupported,
          sourceType: "other",
          citation: "",
          url: "",
        },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "n2",
        target: "n1",
        type: EdgeType.Supports,
        data: { edgeType: EdgeType.Supports, notes: "" },
      },
    ],
  };
}

describe("exportGraph", () => {
  it("returns valid JSON", () => {
    const graph = makeTestGraph();
    const json = exportGraph(graph);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("round-trips correctly", () => {
    const graph = makeTestGraph();
    const json = exportGraph(graph);
    const imported = importGraph(json);
    expect(imported.title).toBe(graph.title);
    expect(imported.description).toBe(graph.description);
    expect(imported.nodes).toHaveLength(graph.nodes.length);
    expect(imported.edges).toHaveLength(graph.edges.length);
    expect(imported.nodes[0].id).toBe(graph.nodes[0].id);
    expect(imported.edges[0].id).toBe(graph.edges[0].id);
  });
});

describe("importGraph", () => {
  it("imports valid JSON graph", () => {
    const json = exportGraph(makeTestGraph());
    const graph = importGraph(json);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
  });

  it("throws on missing nodes array", () => {
    const json = JSON.stringify({ edges: [] });
    expect(() => importGraph(json)).toThrow("missing nodes array");
  });

  it("throws on missing edges array", () => {
    const json = JSON.stringify({ nodes: [] });
    expect(() => importGraph(json)).toThrow("missing edges array");
  });

  it("throws on invalid JSON", () => {
    expect(() => importGraph("not json")).toThrow();
  });

  it("throws on node missing id", () => {
    const json = JSON.stringify({
      nodes: [{ data: { nodeType: "FactualClaim" }, position: { x: 0, y: 0 } }],
      edges: [],
    });
    expect(() => importGraph(json)).toThrow("missing id");
  });

  it("throws on node missing position", () => {
    const json = JSON.stringify({
      nodes: [{ id: "n1", data: { nodeType: "FactualClaim" } }],
      edges: [],
    });
    expect(() => importGraph(json)).toThrow("missing position");
  });

  it("throws on edge missing required fields", () => {
    const json = JSON.stringify({
      nodes: [],
      edges: [{ id: "e1", source: "n1" }], // missing target
    });
    expect(() => importGraph(json)).toThrow("missing id, source, or target");
  });

  it("defaults title and description when missing", () => {
    const json = JSON.stringify({
      nodes: [],
      edges: [],
    });
    const graph = importGraph(json);
    expect(graph.title).toBe("Imported Map");
    expect(graph.description).toBe("");
  });

  it("imports graph without credence/posterior/strength (backward compat)", () => {
    const json = exportGraph(makeTestGraph());
    const graph = importGraph(json);
    // Fields are normalized to null when absent
    expect(graph.nodes[0].data.credence).toBeNull();
    expect(graph.nodes[0].data.posterior).toBeNull();
  });

  it("imports graph with credence and posterior values", () => {
    const g = makeTestGraph();
    (g.nodes[0].data as Record<string, unknown>).credence = 0.7;
    (g.nodes[0].data as Record<string, unknown>).posterior = 0.85;
    const json = exportGraph(g);
    const graph = importGraph(json);
    expect(graph.nodes[0].data.credence).toBe(0.7);
    expect(graph.nodes[0].data.posterior).toBe(0.85);
  });

  it("clamps out-of-range credence/strength to [0,1]", () => {
    const g = makeTestGraph();
    (g.nodes[0].data as Record<string, unknown>).credence = 1.5;
    (g.nodes[1].data as Record<string, unknown>).credence = -0.3;
    (g.edges[0].data as Record<string, unknown>).strength = 2.0;
    const json = exportGraph(g);
    const graph = importGraph(json);
    expect(graph.nodes[0].data.credence).toBe(1);
    expect(graph.nodes[1].data.credence).toBe(0);
    expect(graph.edges[0].data!.strength).toBe(1);
  });

  it("nullifies non-numeric credence", () => {
    const g = makeTestGraph();
    (g.nodes[0].data as Record<string, unknown>).credence = "not a number";
    const json = exportGraph(g);
    const graph = importGraph(json);
    expect(graph.nodes[0].data.credence).toBeNull();
  });

  it("imports edge with strength", () => {
    const g = makeTestGraph();
    (g.edges[0].data as Record<string, unknown>).strength = 0.6;
    const json = exportGraph(g);
    const graph = importGraph(json);
    expect(graph.edges[0].data!.strength).toBe(0.6);
  });
});
