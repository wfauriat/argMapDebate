import type { Edge } from "@xyflow/react";

export enum EdgeType {
  Supports = "Supports",
  Undermines = "Undermines",
  DependsOn = "DependsOn",
  Contradicts = "Contradicts",
}

export enum EdgeWeight {
  Strong = "Strong",
  Moderate = "Moderate",
  Weak = "Weak",
}

export interface ArgumentEdgeData {
  [key: string]: unknown;
  edgeType: EdgeType;
  notes: string;
  weight?: EdgeWeight;
  strength?: number | null; // Numeric influence magnitude (0–1), null = unset
}

export type ArgumentEdge = Edge<ArgumentEdgeData, string>;
