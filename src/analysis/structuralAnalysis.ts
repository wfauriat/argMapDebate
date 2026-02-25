import type { ArgumentNode, ArgumentNodeData } from "@/types/nodes";
import { NodeType, NodeStatus } from "@/types/nodes";
import type { ArgumentEdge } from "@/types/edges";
import { EdgeType } from "@/types/edges";

/**
 * Returns nodes that are claims (Factual, Causal, or Policy) with no incoming Support edges.
 */
export function getUnsupportedClaims(
  nodes: ArgumentNode[],
  edges: ArgumentEdge[]
): ArgumentNode[] {
  const claimTypes = new Set([
    NodeType.FactualClaim,
    NodeType.CausalClaim,
    NodeType.Policy,
  ]);

  return nodes.filter((node) => {
    const data = node.data as ArgumentNodeData;
    if (!claimTypes.has(data.nodeType)) return false;
    const hasSupport = edges.some(
      (e) => e.target === node.id && e.data?.edgeType === EdgeType.Supports
    );
    return !hasSupport;
  });
}

/**
 * Returns nodes with no connected edges at all.
 */
export function getIsolatedNodes(
  nodes: ArgumentNode[],
  edges: ArgumentEdge[]
): ArgumentNode[] {
  const connectedIds = new Set<string>();
  for (const edge of edges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }
  return nodes.filter((n) => !connectedIds.has(n.id));
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  edgesByType: Record<string, number>;
  maxSupportChainDepth: number;
}

export function getGraphStats(
  nodes: ArgumentNode[],
  edges: ArgumentEdge[]
): GraphStats {
  const nodesByType: Record<string, number> = {};
  for (const node of nodes) {
    const type = (node.data as ArgumentNodeData).nodeType;
    nodesByType[type] = (nodesByType[type] ?? 0) + 1;
  }

  const edgesByType: Record<string, number> = {};
  for (const edge of edges) {
    const type = edge.data?.edgeType ?? "unknown";
    edgesByType[type] = (edgesByType[type] ?? 0) + 1;
  }

  // Compute max support chain depth via BFS from nodes with no outgoing support edges
  const supportEdges = edges.filter(
    (e) => e.data?.edgeType === EdgeType.Supports
  );

  // Build adjacency: source -> targets (support direction: source supports target)
  const supportTargets = new Map<string, string[]>();
  const hasIncomingSupport = new Set<string>();
  for (const e of supportEdges) {
    if (!supportTargets.has(e.source)) supportTargets.set(e.source, []);
    supportTargets.get(e.source)!.push(e.target);
    hasIncomingSupport.add(e.target);
  }

  // Find chain depth: longest path following support edges from source to target
  let maxDepth = 0;
  const depthCache = new Map<string, number>();

  function getDepth(nodeId: string, visited: Set<string>): number {
    if (depthCache.has(nodeId) && !visited.has(nodeId)) return depthCache.get(nodeId)!;
    if (visited.has(nodeId)) return 0; // cycle
    visited.add(nodeId);

    const targets = supportTargets.get(nodeId) ?? [];
    let max = 0;
    for (const t of targets) {
      max = Math.max(max, 1 + getDepth(t, visited));
    }
    visited.delete(nodeId);
    depthCache.set(nodeId, max);
    return max;
  }

  for (const node of nodes) {
    const d = getDepth(node.id, new Set());
    maxDepth = Math.max(maxDepth, d);
  }

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodesByType,
    edgesByType,
    maxSupportChainDepth: maxDepth,
  };
}
