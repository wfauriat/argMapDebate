import type { ArgumentGraph } from "@/types/graph";

/** Clamp a value to [0,1], returning null for missing/non-numeric values. */
function normalizeZeroOne(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || isNaN(value)) return null;
  return Math.max(0, Math.min(1, value));
}

export function exportGraph(graph: ArgumentGraph): string {
  return JSON.stringify(graph, null, 2);
}

export function importGraph(json: string): ArgumentGraph {
  const parsed = JSON.parse(json);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid JSON: expected an object");
  }

  if (!Array.isArray(parsed.nodes)) {
    throw new Error("Invalid graph: missing nodes array");
  }

  if (!Array.isArray(parsed.edges)) {
    throw new Error("Invalid graph: missing edges array");
  }

  // Basic structure validation
  for (const node of parsed.nodes) {
    if (!node.id || !node.data || !node.data.nodeType) {
      throw new Error(`Invalid node: missing id, data, or data.nodeType`);
    }
    if (!node.position || typeof node.position.x !== "number") {
      throw new Error(`Invalid node ${node.id}: missing position`);
    }
  }

  for (const edge of parsed.edges) {
    if (!edge.id || !edge.source || !edge.target) {
      throw new Error(`Invalid edge: missing id, source, or target`);
    }
  }

  // Normalize Bayesian inference fields
  for (const node of parsed.nodes) {
    node.data.credence = normalizeZeroOne(node.data.credence);
    node.data.posterior = normalizeZeroOne(node.data.posterior);
  }

  for (const edge of parsed.edges) {
    if (edge.data) {
      edge.data.strength = normalizeZeroOne(edge.data.strength);
    }
  }

  return {
    title: parsed.title ?? "Imported Map",
    description: parsed.description ?? "",
    nodes: parsed.nodes,
    edges: parsed.edges,
  };
}
