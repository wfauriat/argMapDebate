import type { ArgumentGraph } from "@/types/graph";
import type { ArgumentNode } from "@/types/nodes";
import type { ArgumentEdge } from "@/types/edges";
import { NodeType } from "@/types/nodes";
import { EdgeType } from "@/types/edges";
import { createNodeData } from "@/lib/nodeDefaults";

export interface WizardData {
  claim: string;
  supports: string[];
  oppositions: string[];
  assumptions: string[];
  evidence: string[];
}

let nextId = 1;

function genId(prefix: string): string {
  return `wiz_${prefix}_${Date.now()}_${nextId++}`;
}

export function buildGraphFromWizard(data: WizardData): ArgumentGraph {
  const nodes: ArgumentNode[] = [];
  const edges: ArgumentEdge[] = [];

  // Main claim as Policy node
  const claimId = genId("claim");
  const claimData = createNodeData(NodeType.Policy);
  claimData.label = data.claim;
  nodes.push({ id: claimId, type: NodeType.Policy, position: { x: 0, y: 0 }, data: claimData });

  // Supporting arguments as FactualClaim nodes
  const supportIds: string[] = [];
  for (const text of data.supports) {
    if (!text.trim()) continue;
    const id = genId("sup");
    const d = createNodeData(NodeType.FactualClaim);
    d.label = text.trim();
    nodes.push({ id, type: NodeType.FactualClaim, position: { x: 0, y: 0 }, data: d });
    edges.push({
      id: genId("e"),
      source: id,
      target: claimId,
      type: EdgeType.Supports,
      data: { edgeType: EdgeType.Supports, notes: "" },
    });
    supportIds.push(id);
  }

  // Opposing arguments as FactualClaim nodes with Undermines edges
  for (const text of data.oppositions) {
    if (!text.trim()) continue;
    const id = genId("opp");
    const d = createNodeData(NodeType.FactualClaim);
    d.label = text.trim();
    nodes.push({ id, type: NodeType.FactualClaim, position: { x: 0, y: 0 }, data: d });
    edges.push({
      id: genId("e"),
      source: id,
      target: claimId,
      type: EdgeType.Undermines,
      data: { edgeType: EdgeType.Undermines, notes: "" },
    });
  }

  // Assumptions as Assumption nodes with DependsOn edges to claim
  for (const text of data.assumptions) {
    if (!text.trim()) continue;
    const id = genId("asm");
    const d = createNodeData(NodeType.Assumption);
    d.label = text.trim();
    nodes.push({ id, type: NodeType.Assumption, position: { x: 0, y: 0 }, data: d });
    edges.push({
      id: genId("e"),
      source: claimId,
      target: id,
      type: EdgeType.DependsOn,
      data: { edgeType: EdgeType.DependsOn, notes: "" },
    });
  }

  // Evidence as Evidence nodes, supporting the first supporting claim (or the main claim if no supports)
  const evidenceTarget = supportIds.length > 0 ? supportIds[0] : claimId;
  for (const text of data.evidence) {
    if (!text.trim()) continue;
    const id = genId("evi");
    const d = createNodeData(NodeType.Evidence);
    d.label = text.trim();
    nodes.push({ id, type: NodeType.Evidence, position: { x: 0, y: 0 }, data: d });
    edges.push({
      id: genId("e"),
      source: id,
      target: evidenceTarget,
      type: EdgeType.Supports,
      data: { edgeType: EdgeType.Supports, notes: "" },
    });
  }

  return {
    title: data.claim,
    description: "Generated with Guided Build wizard",
    nodes,
    edges,
  };
}
