import type { ArgumentNode, ArgumentNodeData } from "@/types/nodes";
import { NodeType, NodeStatus } from "@/types/nodes";
import type { ArgumentEdge } from "@/types/edges";
import { EdgeType, EdgeWeight } from "@/types/edges";
import { EDGE_WEIGHT_CONFIG } from "@/constants/edgeConfig";

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

// --- Load-Bearing Assumption Detection ---

export interface LoadBearingResult {
  nodeId: string;
  label: string;
  downstreamCount: number;
  downstreamNodeIds: string[];
}

/**
 * Identifies Assumption nodes that, if invalidated, would affect the most downstream claims.
 * Propagation follows: Supports edges (source→target), DependsOn edges (target→source).
 */
export function getLoadBearingAssumptions(
  nodes: ArgumentNode[],
  edges: ArgumentEdge[]
): LoadBearingResult[] {
  // Build invalidation propagation adjacency
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.data?.edgeType === EdgeType.Supports) {
      // source supports target: invalidating source affects target
      if (!adj.has(edge.source)) adj.set(edge.source, []);
      adj.get(edge.source)!.push(edge.target);
    } else if (edge.data?.edgeType === EdgeType.DependsOn) {
      // source depends on target: invalidating target affects source
      if (!adj.has(edge.target)) adj.set(edge.target, []);
      adj.get(edge.target)!.push(edge.source);
    }
  }

  const assumptions = nodes.filter(
    (n) => (n.data as ArgumentNodeData).nodeType === NodeType.Assumption
  );

  const results: LoadBearingResult[] = [];

  for (const assumption of assumptions) {
    // BFS from this assumption
    const visited = new Set<string>();
    const queue = [assumption.id];
    visited.add(assumption.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = adj.get(current) ?? [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    // Downstream = visited nodes minus the assumption itself
    visited.delete(assumption.id);
    if (visited.size > 0) {
      results.push({
        nodeId: assumption.id,
        label: (assumption.data as ArgumentNodeData).label,
        downstreamCount: visited.size,
        downstreamNodeIds: Array.from(visited),
      });
    }
  }

  return results.sort((a, b) => b.downstreamCount - a.downstreamCount);
}

// --- Sensitivity Analysis (Weakest Link) ---

export interface WeakestLink {
  /** "node" if a low-credence node is the weakest, "edge" if an edge is. */
  kind: "node" | "edge";
  id: string;
  /** Effective strength (0–1) used for comparison. */
  effectiveStrength: number;
  /** Human-readable reason, e.g. "credence 0.15" or "strength 0.2 (Weak)". */
  reason: string;
}

export interface SensitivityResult {
  chainNodeIds: string[];
  chainEdgeIds: string[];
  weakestLink: WeakestLink | null;
  /** @deprecated Use weakestLink instead. Kept for backward compat. */
  weakestEdgeId: string | null;
  /** @deprecated Use weakestLink instead. */
  weakestEdgeWeight: EdgeWeight | undefined;
  chainLength: number;
}

/**
 * Compute effective strength for an edge (0–1 scale).
 * Prefers numerical `strength` when set; falls back to categorical `weight`
 * mapped to 0–1, then defaults to 0.5.
 */
function edgeEffectiveStrength(edge: ArgumentEdge): number {
  // Numerical strength takes priority
  if (edge.data?.strength != null) return edge.data.strength;
  // Fall back to categorical weight
  const w = edge.data?.weight as EdgeWeight | undefined;
  if (w) {
    // Strong=1.0, Moderate=0.5, Weak=0.25
    return EDGE_WEIGHT_CONFIG[w].numericValue / EDGE_WEIGHT_CONFIG[EdgeWeight.Strong].numericValue;
  }
  return 0.5; // default: moderate
}

/**
 * Finds the longest support chain and highlights the weakest link — either
 * a low-credence node or a weak edge.
 */
export function getSensitivityAnalysis(
  nodes: ArgumentNode[],
  edges: ArgumentEdge[]
): SensitivityResult | null {
  if (nodes.length === 0 || edges.length === 0) return null;

  const nodeMap = new Map<string, ArgumentNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Build adjacency following only Supports edges
  const supportAdj = new Map<string, { target: string; edgeId: string }[]>();
  const edgeMap = new Map<string, ArgumentEdge>();

  for (const edge of edges) {
    if (edge.data?.edgeType === EdgeType.Supports) {
      if (!supportAdj.has(edge.source)) supportAdj.set(edge.source, []);
      supportAdj.get(edge.source)!.push({ target: edge.target, edgeId: edge.id });
      edgeMap.set(edge.id, edge);
    }
  }

  // DFS from every node to find the longest path
  let bestPath: string[] = [];
  let bestEdges: string[] = [];

  function dfs(
    nodeId: string,
    visited: Set<string>,
    pathNodes: string[],
    pathEdges: string[]
  ) {
    if (pathNodes.length > bestPath.length) {
      bestPath = [...pathNodes];
      bestEdges = [...pathEdges];
    }

    const neighbors = supportAdj.get(nodeId) ?? [];
    for (const { target, edgeId } of neighbors) {
      if (!visited.has(target)) {
        visited.add(target);
        pathNodes.push(target);
        pathEdges.push(edgeId);
        dfs(target, visited, pathNodes, pathEdges);
        pathNodes.pop();
        pathEdges.pop();
        visited.delete(target);
      }
    }
  }

  for (const node of nodes) {
    const visited = new Set<string>([node.id]);
    dfs(node.id, visited, [node.id], []);
  }

  if (bestPath.length <= 1) return null;

  // Find the weakest link — compare edges AND nodes on a 0–1 scale
  let weakest: WeakestLink | null = null;

  // Check edges
  for (const edgeId of bestEdges) {
    const edge = edgeMap.get(edgeId);
    if (!edge) continue;
    const eff = edgeEffectiveStrength(edge);
    if (!weakest || eff < weakest.effectiveStrength) {
      const w = edge.data?.weight as EdgeWeight | undefined;
      const label = w ? ` (${EDGE_WEIGHT_CONFIG[w].label})` : "";
      weakest = {
        kind: "edge",
        id: edgeId,
        effectiveStrength: eff,
        reason: `strength ${eff.toFixed(2)}${label}`,
      };
    }
  }

  // Check nodes — credence acts as a link strength
  for (const nodeId of bestPath) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    const cred = (node.data as ArgumentNodeData).credence;
    if (cred == null) continue; // no credence set → can't evaluate
    if (!weakest || cred < weakest.effectiveStrength) {
      weakest = {
        kind: "node",
        id: nodeId,
        effectiveStrength: cred,
        reason: `credence ${cred.toFixed(2)}`,
      };
    }
  }

  // Backward-compat: extract legacy fields from weakest link
  let weakestEdgeId: string | null = null;
  let weakestEdgeWeight: EdgeWeight | undefined = undefined;
  if (weakest?.kind === "edge") {
    weakestEdgeId = weakest.id;
    const edge = edgeMap.get(weakest.id);
    weakestEdgeWeight = edge?.data?.weight as EdgeWeight | undefined;
  }

  return {
    chainNodeIds: bestPath,
    chainEdgeIds: bestEdges,
    weakestLink: weakest,
    weakestEdgeId,
    weakestEdgeWeight,
    chainLength: bestPath.length,
  };
}
