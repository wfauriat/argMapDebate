import type { Node } from "@xyflow/react";

export enum NodeType {
  FactualClaim = "FactualClaim",
  CausalClaim = "CausalClaim",
  Value = "Value",
  Assumption = "Assumption",
  Evidence = "Evidence",
  Policy = "Policy",
}

export enum NodeStatus {
  Supported = "Supported",
  Contested = "Contested",
  Unsupported = "Unsupported",
}

// Common fields shared by all argument nodes
// Index signature required for React Flow v12 compatibility
interface BaseNodeData {
  [key: string]: unknown;
  label: string;
  notes: string;
  status: NodeStatus;
}

export interface FactualClaimData extends BaseNodeData {
  nodeType: NodeType.FactualClaim;
  sources: string[];
}

export interface CausalClaimData extends BaseNodeData {
  nodeType: NodeType.CausalClaim;
  mechanism: string;
  sources: string[];
}

export interface ValueData extends BaseNodeData {
  nodeType: NodeType.Value;
  domain: string;
}

export interface AssumptionData extends BaseNodeData {
  nodeType: NodeType.Assumption;
  isExplicit: boolean;
}

export type EvidenceSourceType =
  | "study"
  | "statistic"
  | "testimony"
  | "observation"
  | "other";

export interface EvidenceData extends BaseNodeData {
  nodeType: NodeType.Evidence;
  sourceType: EvidenceSourceType;
  citation: string;
  url: string;
}

export interface PolicyData extends BaseNodeData {
  nodeType: NodeType.Policy;
  scope: string;
}

export type ArgumentNodeData =
  | FactualClaimData
  | CausalClaimData
  | ValueData
  | AssumptionData
  | EvidenceData
  | PolicyData;

export type ArgumentNode = Node<ArgumentNodeData, string>;
