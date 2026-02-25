import dagre from "@dagrejs/dagre";
import type { ArgumentNode } from "@/types/nodes";
import type { ArgumentEdge } from "@/types/edges";
import { EDGE_WEIGHT_CONFIG } from "@/constants/edgeConfig";
import { EdgeWeight } from "@/types/edges";

const NODE_WIDTH = 256;
const NODE_HEIGHT = 120;

export function layoutGraph(
  nodes: ArgumentNode[],
  edges: ArgumentEdge[],
  direction: "TB" | "LR" = "TB"
): ArgumentNode[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ranksep: 100, nodesep: 60 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    const weight = edge.data?.weight as EdgeWeight | undefined;
    const numericWeight = weight
      ? EDGE_WEIGHT_CONFIG[weight].numericValue
      : EDGE_WEIGHT_CONFIG[EdgeWeight.Moderate].numericValue;
    g.setEdge(edge.source, edge.target, { weight: numericWeight });
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}
