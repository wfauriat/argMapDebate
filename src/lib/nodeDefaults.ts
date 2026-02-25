import {
  NodeType,
  NodeStatus,
  type ArgumentNodeData,
  type FactualClaimData,
  type CausalClaimData,
  type ValueData,
  type AssumptionData,
  type EvidenceData,
  type PolicyData,
} from "@/types/nodes";

const baseDefaults = {
  label: "",
  notes: "",
  status: NodeStatus.Unsupported,
  credence: null,
  posterior: null,
};

export function createNodeData(nodeType: NodeType): ArgumentNodeData {
  switch (nodeType) {
    case NodeType.FactualClaim:
      return {
        ...baseDefaults,
        nodeType: NodeType.FactualClaim,
        label: "New Factual Claim",
        sources: [],
      } satisfies FactualClaimData;
    case NodeType.CausalClaim:
      return {
        ...baseDefaults,
        nodeType: NodeType.CausalClaim,
        label: "New Causal Claim",
        mechanism: "",
        sources: [],
      } satisfies CausalClaimData;
    case NodeType.Value:
      return {
        ...baseDefaults,
        nodeType: NodeType.Value,
        label: "New Value",
        domain: "",
      } satisfies ValueData;
    case NodeType.Assumption:
      return {
        ...baseDefaults,
        nodeType: NodeType.Assumption,
        label: "New Assumption",
        isExplicit: true,
        isLoadBearing: false,
      } satisfies AssumptionData;
    case NodeType.Evidence:
      return {
        ...baseDefaults,
        nodeType: NodeType.Evidence,
        label: "New Evidence",
        sourceType: "other",
        citation: "",
        url: "",
      } satisfies EvidenceData;
    case NodeType.Policy:
      return {
        ...baseDefaults,
        nodeType: NodeType.Policy,
        label: "New Policy",
        scope: "",
      } satisfies PolicyData;
  }
}
