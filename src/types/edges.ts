import type { Edge } from "@xyflow/react";

export enum EdgeType {
  Supports = "Supports",
  Undermines = "Undermines",
  DependsOn = "DependsOn",
  Contradicts = "Contradicts",
}

export interface ArgumentEdgeData {
  [key: string]: unknown;
  edgeType: EdgeType;
  notes: string;
}

export type ArgumentEdge = Edge<ArgumentEdgeData, string>;
