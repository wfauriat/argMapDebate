import type { ArgumentationScheme } from "./argumentSchemes";
import type { ArgumentGraph } from "@/types/graph";
import type { ArgumentNode } from "@/types/nodes";
import type { ArgumentEdge } from "@/types/edges";
import { createNodeData } from "@/lib/nodeDefaults";

let nextId = 1;

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${nextId++}`;
}

export function instantiateScheme(scheme: ArgumentationScheme): ArgumentGraph {
  const localIdToRealId = new Map<string, string>();

  // Create nodes
  const nodes: ArgumentNode[] = scheme.nodes.map((template) => {
    const realId = generateId("node");
    localIdToRealId.set(template.localId, realId);

    const data = createNodeData(template.nodeType);
    data.label = template.label;
    data.notes = template.notes;

    return {
      id: realId,
      type: template.nodeType,
      position: { x: 0, y: 0 },
      data,
    };
  });

  // Create edges
  const edges: ArgumentEdge[] = scheme.edges.map((template) => {
    const sourceId = localIdToRealId.get(template.sourceLocalId)!;
    const targetId = localIdToRealId.get(template.targetLocalId)!;
    const edgeId = generateId("edge");

    return {
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: template.edgeType,
      data: {
        edgeType: template.edgeType,
        notes: template.notes,
      },
    };
  });

  return {
    title: scheme.name,
    description: `${scheme.description}\n\nCritical questions:\n${scheme.criticalQuestions.map((q) => `- ${q}`).join("\n")}`,
    nodes,
    edges,
  };
}
