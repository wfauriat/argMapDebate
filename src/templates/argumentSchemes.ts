import { NodeType } from "@/types/nodes";
import { EdgeType } from "@/types/edges";

export interface SchemeNodeTemplate {
  localId: string;
  nodeType: NodeType;
  label: string;
  notes: string;
}

export interface SchemeEdgeTemplate {
  sourceLocalId: string;
  targetLocalId: string;
  edgeType: EdgeType;
  notes: string;
}

export interface ArgumentationScheme {
  id: string;
  name: string;
  description: string;
  criticalQuestions: string[];
  nodes: SchemeNodeTemplate[];
  edges: SchemeEdgeTemplate[];
}

export const ARGUMENTATION_SCHEMES: ArgumentationScheme[] = [
  {
    id: "from-consequences",
    name: "From Consequences",
    description: "Argues for or against a policy based on its expected consequences",
    criticalQuestions: [
      "Will the action actually lead to these consequences?",
      "Are there other consequences that should be considered?",
      "Are the stated values actually promoted by these consequences?",
    ],
    nodes: [
      { localId: "policy", nodeType: NodeType.Policy, label: "Proposed policy or action", notes: "The action being argued for" },
      { localId: "causal", nodeType: NodeType.CausalClaim, label: "This policy leads to outcome X", notes: "The causal mechanism connecting policy to outcome" },
      { localId: "value", nodeType: NodeType.Value, label: "Outcome X promotes value Y", notes: "The value judgment about the outcome" },
      { localId: "evidence", nodeType: NodeType.Evidence, label: "Evidence for the causal link", notes: "Data or examples supporting the causal claim" },
      { localId: "assumption", nodeType: NodeType.Assumption, label: "No significant negative side effects", notes: "Assumes the policy doesn't cause worse problems" },
    ],
    edges: [
      { sourceLocalId: "causal", targetLocalId: "policy", edgeType: EdgeType.Supports, notes: "Consequence justifies the policy" },
      { sourceLocalId: "value", targetLocalId: "causal", edgeType: EdgeType.Supports, notes: "Value makes the consequence desirable" },
      { sourceLocalId: "evidence", targetLocalId: "causal", edgeType: EdgeType.Supports, notes: "Evidence backs the causal link" },
      { sourceLocalId: "policy", targetLocalId: "assumption", edgeType: EdgeType.DependsOn, notes: "Policy viability depends on this assumption" },
    ],
  },
  {
    id: "from-expert-opinion",
    name: "From Expert Opinion",
    description: "Supports a claim by appealing to expert authority",
    criticalQuestions: [
      "Is the expert a genuine authority in this domain?",
      "Do other experts in the field agree?",
      "Is the expert biased or conflicted?",
    ],
    nodes: [
      { localId: "claim", nodeType: NodeType.FactualClaim, label: "Claim supported by expert opinion", notes: "The factual claim being argued" },
      { localId: "expert", nodeType: NodeType.Evidence, label: "Expert E says this is true", notes: "The expert testimony or publication" },
      { localId: "domain", nodeType: NodeType.Assumption, label: "Expert E is authoritative in this domain", notes: "The expert has relevant credentials and experience" },
      { localId: "consensus", nodeType: NodeType.Assumption, label: "Other experts generally agree", notes: "This is not a fringe or minority position" },
    ],
    edges: [
      { sourceLocalId: "expert", targetLocalId: "claim", edgeType: EdgeType.Supports, notes: "Expert testimony supports the claim" },
      { sourceLocalId: "claim", targetLocalId: "domain", edgeType: EdgeType.DependsOn, notes: "Claim relies on expert's domain authority" },
      { sourceLocalId: "claim", targetLocalId: "consensus", edgeType: EdgeType.DependsOn, notes: "Claim is stronger with expert consensus" },
    ],
  },
  {
    id: "from-analogy",
    name: "From Analogy",
    description: "Argues that what is true in one case should be true in a similar case",
    criticalQuestions: [
      "Are the two cases truly similar in relevant respects?",
      "Are there important differences between the cases?",
      "Is there a better analogy that leads to a different conclusion?",
    ],
    nodes: [
      { localId: "source", nodeType: NodeType.FactualClaim, label: "In case A, X is true", notes: "The known source case" },
      { localId: "similarity", nodeType: NodeType.Assumption, label: "Case A and case B are relevantly similar", notes: "The key assumption that the analogy holds" },
      { localId: "conclusion", nodeType: NodeType.FactualClaim, label: "Therefore, in case B, X is also true", notes: "The conclusion drawn by analogy" },
    ],
    edges: [
      { sourceLocalId: "source", targetLocalId: "conclusion", edgeType: EdgeType.Supports, notes: "Source case supports the analogical conclusion" },
      { sourceLocalId: "conclusion", targetLocalId: "similarity", edgeType: EdgeType.DependsOn, notes: "Conclusion depends on the similarity holding" },
    ],
  },
  {
    id: "from-precedent",
    name: "From Precedent",
    description: "Argues that a policy should apply based on a similar past case or ruling",
    criticalQuestions: [
      "Is the precedent case truly analogous?",
      "Have circumstances changed since the precedent was established?",
      "Was the precedent itself justified?",
    ],
    nodes: [
      { localId: "precedent", nodeType: NodeType.FactualClaim, label: "In past case, policy P was applied", notes: "The established precedent" },
      { localId: "similarity", nodeType: NodeType.Assumption, label: "Current situation is relevantly similar", notes: "The cases share key features" },
      { localId: "policy", nodeType: NodeType.Policy, label: "Policy P should apply in current case", notes: "The policy conclusion from precedent" },
      { localId: "evidence", nodeType: NodeType.Evidence, label: "Documentation of the precedent case", notes: "Legal ruling, historical record, or policy document" },
    ],
    edges: [
      { sourceLocalId: "precedent", targetLocalId: "policy", edgeType: EdgeType.Supports, notes: "Precedent supports applying the same policy" },
      { sourceLocalId: "evidence", targetLocalId: "precedent", edgeType: EdgeType.Supports, notes: "Evidence documents the precedent" },
      { sourceLocalId: "policy", targetLocalId: "similarity", edgeType: EdgeType.DependsOn, notes: "Policy application depends on similarity" },
    ],
  },
  {
    id: "from-cause-to-effect",
    name: "From Cause to Effect",
    description: "Argues that a cause will produce a specific effect through a known mechanism",
    criticalQuestions: [
      "Is there sufficient evidence for the causal mechanism?",
      "Are there confounding factors?",
      "Could the effect occur without this cause?",
    ],
    nodes: [
      { localId: "cause", nodeType: NodeType.FactualClaim, label: "Cause C is present", notes: "The causal factor being identified" },
      { localId: "mechanism", nodeType: NodeType.CausalClaim, label: "C produces E through mechanism M", notes: "The causal mechanism linking cause to effect" },
      { localId: "effect", nodeType: NodeType.FactualClaim, label: "Effect E will occur", notes: "The predicted effect" },
      { localId: "evidence", nodeType: NodeType.Evidence, label: "Evidence for the causal mechanism", notes: "Studies, data, or observations supporting the mechanism" },
      { localId: "confounders", nodeType: NodeType.Assumption, label: "No confounding factors block the mechanism", notes: "Assumes no interfering variables" },
    ],
    edges: [
      { sourceLocalId: "cause", targetLocalId: "mechanism", edgeType: EdgeType.Supports, notes: "Cause activates the mechanism" },
      { sourceLocalId: "mechanism", targetLocalId: "effect", edgeType: EdgeType.Supports, notes: "Mechanism produces the effect" },
      { sourceLocalId: "evidence", targetLocalId: "mechanism", edgeType: EdgeType.Supports, notes: "Evidence backs the mechanism" },
      { sourceLocalId: "mechanism", targetLocalId: "confounders", edgeType: EdgeType.DependsOn, notes: "Mechanism depends on no confounders" },
    ],
  },
];
