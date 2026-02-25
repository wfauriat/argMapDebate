import type { NodeTypes } from "@xyflow/react";
import { NodeType } from "@/types/nodes";
import FactualClaimNode from "./FactualClaimNode";
import CausalClaimNode from "./CausalClaimNode";
import ValueNode from "./ValueNode";
import AssumptionNode from "./AssumptionNode";
import EvidenceNode from "./EvidenceNode";
import PolicyNode from "./PolicyNode";

export const nodeTypes: NodeTypes = {
  [NodeType.FactualClaim]: FactualClaimNode,
  [NodeType.CausalClaim]: CausalClaimNode,
  [NodeType.Value]: ValueNode,
  [NodeType.Assumption]: AssumptionNode,
  [NodeType.Evidence]: EvidenceNode,
  [NodeType.Policy]: PolicyNode,
};
