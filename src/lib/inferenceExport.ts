import type { ArgumentNode } from "@/types/nodes";
import type { ArgumentEdge } from "@/types/edges";
import type {
  InferencePayload,
  InferenceResult,
} from "@/types/inference";

/**
 * Build a lean inference payload by stripping UI-only fields from nodes and edges.
 */
export function buildInferencePayload(
  nodes: ArgumentNode[],
  edges: ArgumentEdge[],
): InferencePayload {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      nodeType: node.data.nodeType,
      label: node.data.label,
      credence: node.data.credence ?? null,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      edgeType: edge.data!.edgeType,
      strength: edge.data!.strength ?? null,
    })),
  };
}

/**
 * Apply inference results back onto nodes (pure function, no mutation).
 * Returns a new array with posteriors set on matching nodes.
 */
export function applyInferenceResult(
  nodes: ArgumentNode[],
  result: InferenceResult,
): ArgumentNode[] {
  const posteriorMap = new Map(
    result.nodes.map((r) => [r.id, r.posterior]),
  );

  return nodes.map((node) => {
    const posterior = posteriorMap.get(node.id);
    if (posterior === undefined) return node;
    return {
      ...node,
      data: { ...node.data, posterior },
    };
  });
}
