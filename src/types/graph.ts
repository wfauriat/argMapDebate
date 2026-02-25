import type { ArgumentNode } from "./nodes";
import type { ArgumentEdge } from "./edges";

export interface ArgumentGraph {
  title: string;
  description: string;
  nodes: ArgumentNode[];
  edges: ArgumentEdge[];
}
