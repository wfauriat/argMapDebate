import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  type Viewport,
} from "@xyflow/react";
import type { ArgumentNode, ArgumentNodeData } from "@/types/nodes";
import { NodeType, NodeStatus } from "@/types/nodes";
import type { ArgumentEdge, ArgumentEdgeData } from "@/types/edges";
import { EdgeType, EdgeWeight } from "@/types/edges";
import type { ArgumentGraph } from "@/types/graph";
import { createNodeData } from "@/lib/nodeDefaults";
import { layoutGraph } from "@/lib/layoutEngine";
import { getLoadBearingAssumptions } from "@/analysis/structuralAnalysis";

interface ArgumentState {
  nodes: ArgumentNode[];
  edges: ArgumentEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  graphTitle: string;
  graphDescription: string;
  viewport: Viewport;
  layoutTrigger: number;

  // Highlights (sensitivity analysis)
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  weakestEdgeId: string | null;
  setHighlights: (nodeIds: string[], edgeIds: string[], weakestEdgeId: string | null) => void;
  clearHighlights: () => void;

  // React Flow integration
  onNodesChange: OnNodesChange<ArgumentNode>;
  onEdgesChange: OnEdgesChange<ArgumentEdge>;
  onConnect: (connection: Connection) => void;

  // Node CRUD
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNodeData: (id: string, partial: Partial<ArgumentNodeData>) => void;
  deleteNode: (id: string) => void;

  // Edge CRUD
  addEdge: (source: string, target: string, edgeType: EdgeType) => void;
  updateEdgeType: (id: string, edgeType: EdgeType) => void;
  updateEdgeNotes: (id: string, notes: string) => void;
  updateEdgeWeight: (id: string, weight: EdgeWeight | undefined) => void;
  deleteEdge: (id: string) => void;

  // Selection
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;

  // Graph-level
  loadGraph: (graph: ArgumentGraph) => void;
  clearGraph: () => void;
  setGraphTitle: (title: string) => void;
  setGraphDescription: (description: string) => void;
  setViewport: (viewport: Viewport) => void;

  // Layout
  autoLayout: (direction?: "TB" | "LR") => void;

  // Derived
  recomputeStatuses: () => void;
}

let nextId = 1;
function generateId(): string {
  return `node_${Date.now()}_${nextId++}`;
}

function generateEdgeId(): string {
  return `edge_${Date.now()}_${nextId++}`;
}

export const useArgumentStore = create<ArgumentState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  graphTitle: "Untitled Argument Map",
  graphDescription: "",
  viewport: { x: 0, y: 0, zoom: 1 },
  layoutTrigger: 0,

  highlightedNodeIds: new Set<string>(),
  highlightedEdgeIds: new Set<string>(),
  weakestEdgeId: null,

  setHighlights: (nodeIds, edgeIds, weakestEdgeId) => {
    set({
      highlightedNodeIds: new Set(nodeIds),
      highlightedEdgeIds: new Set(edgeIds),
      weakestEdgeId,
    });
  },

  clearHighlights: () => {
    set({
      highlightedNodeIds: new Set<string>(),
      highlightedEdgeIds: new Set<string>(),
      weakestEdgeId: null,
    });
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    const id = generateEdgeId();
    const newEdge: ArgumentEdge = {
      id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      type: EdgeType.Supports,
      data: {
        edgeType: EdgeType.Supports,
        notes: "",
      },
    };
    set({ edges: [...get().edges, newEdge] });
    get().recomputeStatuses();
  },

  addNode: (type, position) => {
    const id = generateId();
    const data = createNodeData(type);
    const newNode: ArgumentNode = {
      id,
      type: type,
      position,
      data,
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeData: (id, partial) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...partial } as ArgumentNodeData }
          : node
      ),
    });
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
    get().recomputeStatuses();
  },

  addEdge: (source, target, edgeType) => {
    const id = generateEdgeId();
    const newEdge: ArgumentEdge = {
      id,
      source,
      target,
      type: edgeType,
      data: {
        edgeType,
        notes: "",
      },
    };
    set({ edges: [...get().edges, newEdge] });
    get().recomputeStatuses();
  },

  updateEdgeType: (id, edgeType) => {
    set({
      edges: get().edges.map((edge) =>
        edge.id === id
          ? {
              ...edge,
              type: edgeType,
              data: { ...edge.data!, edgeType },
            }
          : edge
      ),
    });
    get().recomputeStatuses();
  },

  updateEdgeNotes: (id, notes) => {
    set({
      edges: get().edges.map((edge) =>
        edge.id === id
          ? { ...edge, data: { ...edge.data!, notes } }
          : edge
      ),
    });
  },

  updateEdgeWeight: (id, weight) => {
    set({
      edges: get().edges.map((edge) =>
        edge.id === id
          ? { ...edge, data: { ...edge.data!, weight } }
          : edge
      ),
    });
  },

  deleteEdge: (id) => {
    set({
      edges: get().edges.filter((e) => e.id !== id),
      selectedEdgeId: get().selectedEdgeId === id ? null : get().selectedEdgeId,
    });
    get().recomputeStatuses();
  },

  selectNode: (id) => {
    set({ selectedNodeId: id, selectedEdgeId: id ? null : get().selectedEdgeId });
  },

  selectEdge: (id) => {
    set({ selectedEdgeId: id, selectedNodeId: id ? null : get().selectedNodeId });
  },

  loadGraph: (graph) => {
    set({
      nodes: graph.nodes,
      edges: graph.edges,
      graphTitle: graph.title,
      graphDescription: graph.description,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    get().recomputeStatuses();
  },

  clearGraph: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      graphTitle: "Untitled Argument Map",
      graphDescription: "",
    });
  },

  setGraphTitle: (title) => set({ graphTitle: title }),
  setGraphDescription: (description) => set({ graphDescription: description }),
  setViewport: (viewport) => set({ viewport }),

  autoLayout: (direction = "TB") => {
    const { nodes, edges, layoutTrigger } = get();
    const layoutedNodes = layoutGraph(nodes, edges, direction);
    set({ nodes: layoutedNodes, layoutTrigger: layoutTrigger + 1 });
  },

  recomputeStatuses: () => {
    const { nodes, edges } = get();

    // Compute load-bearing assumptions
    const loadBearing = getLoadBearingAssumptions(nodes, edges);
    const loadBearingThreshold = Math.max(1, Math.ceil(nodes.length * 0.2));
    const loadBearingIds = new Set(
      loadBearing
        .filter((lb) => lb.downstreamCount >= loadBearingThreshold)
        .map((lb) => lb.nodeId)
    );

    const updatedNodes = nodes.map((node) => {
      const incomingEdges = edges.filter((e) => e.target === node.id);
      const hasSupport = incomingEdges.some(
        (e) => e.data?.edgeType === EdgeType.Supports
      );
      const hasUndermining = incomingEdges.some(
        (e) => e.data?.edgeType === EdgeType.Undermines
      );

      let status: NodeStatus;
      if (hasSupport && hasUndermining) {
        status = NodeStatus.Contested;
      } else if (hasSupport) {
        status = NodeStatus.Supported;
      } else {
        status = NodeStatus.Unsupported;
      }

      let updated = node;
      if (node.data.status !== status) {
        updated = { ...updated, data: { ...updated.data, status } };
      }

      // Set isLoadBearing for Assumption nodes
      if (node.data.nodeType === NodeType.Assumption) {
        const isLB = loadBearingIds.has(node.id);
        if ((node.data as import("@/types/nodes").AssumptionData).isLoadBearing !== isLB) {
          updated = { ...updated, data: { ...updated.data, isLoadBearing: isLB } };
        }
      }

      return updated;
    });
    set({ nodes: updatedNodes });
  },
}));
