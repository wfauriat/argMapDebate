import type { NodeType } from "./nodes";
import type { EdgeType } from "./edges";

export enum CredencePreset {
  VeryLow = "VeryLow",
  Low = "Low",
  Medium = "Medium",
  High = "High",
  VeryHigh = "VeryHigh",
}

export const CREDENCE_PRESET_VALUES: Record<CredencePreset, number> = {
  [CredencePreset.VeryLow]: 0.1,
  [CredencePreset.Low]: 0.3,
  [CredencePreset.Medium]: 0.5,
  [CredencePreset.High]: 0.7,
  [CredencePreset.VeryHigh]: 0.9,
};

export interface InferenceNode {
  id: string;
  nodeType: NodeType;
  label: string;
  credence: number | null;
}

export interface InferenceEdge {
  id: string;
  source: string;
  target: string;
  edgeType: EdgeType;
  strength: number | null;
}

export interface InferencePayload {
  nodes: InferenceNode[];
  edges: InferenceEdge[];
}

export interface InferenceNodeResult {
  id: string;
  posterior: number;
}

export interface InferenceResult {
  nodes: InferenceNodeResult[];
}
