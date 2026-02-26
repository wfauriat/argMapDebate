import { describe, it, expect, beforeEach } from "vitest";
import { useArgumentStore } from "@/store/useArgumentStore";
import { useSelectionStore } from "@/store/useSelectionStore";
import { NodeType, NodeStatus } from "@/types/nodes";
import { EdgeType, EdgeWeight } from "@/types/edges";
import type { ArgumentGraph } from "@/types/graph";
import type { ArgumentNodeData } from "@/types/nodes";

function resetStores() {
  useArgumentStore.getState().clearGraph();
  useSelectionStore.setState({
    selectedNodeId: null,
    selectedEdgeId: null,
  });
}

// Helper to flush microtask queue so scheduleRecompute runs
async function flushMicrotasks() {
  await new Promise<void>((resolve) => queueMicrotask(resolve));
}

describe("useArgumentStore", () => {
  beforeEach(() => {
    resetStores();
  });

  // --- Node CRUD ---

  describe("addNode", () => {
    it("adds a node to the store", () => {
      useArgumentStore.getState().addNode(NodeType.FactualClaim, { x: 10, y: 20 });
      const { nodes } = useArgumentStore.getState();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe(NodeType.FactualClaim);
      expect(nodes[0].position).toEqual({ x: 10, y: 20 });
    });
  });

  describe("deleteNode", () => {
    it("removes the node and connected edges", async () => {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      store.addNode(NodeType.Evidence, { x: 100, y: 0 });

      const nodeIds = useArgumentStore.getState().nodes.map((n) => n.id);
      store.addEdge(nodeIds[1], nodeIds[0], EdgeType.Supports);
      expect(useArgumentStore.getState().edges).toHaveLength(1);

      useArgumentStore.getState().deleteNode(nodeIds[0]);
      await flushMicrotasks();

      const state = useArgumentStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.edges).toHaveLength(0);
    });
  });

  describe("updateNodeData", () => {
    it("updates data partially", () => {
      useArgumentStore.getState().addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      const id = useArgumentStore.getState().nodes[0].id;
      useArgumentStore.getState().updateNodeData(id, { label: "Updated" });
      const node = useArgumentStore.getState().nodes[0];
      expect((node.data as ArgumentNodeData).label).toBe("Updated");
    });
  });

  // --- Edge CRUD ---

  describe("addEdge", () => {
    it("adds an edge between two nodes", () => {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      store.addNode(NodeType.Evidence, { x: 100, y: 0 });
      const ids = useArgumentStore.getState().nodes.map((n) => n.id);
      useArgumentStore.getState().addEdge(ids[1], ids[0], EdgeType.Supports);
      expect(useArgumentStore.getState().edges).toHaveLength(1);
      expect(useArgumentStore.getState().edges[0].data?.edgeType).toBe(EdgeType.Supports);
    });
  });

  describe("deleteEdge", () => {
    it("removes the edge", async () => {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      store.addNode(NodeType.Evidence, { x: 100, y: 0 });
      const ids = useArgumentStore.getState().nodes.map((n) => n.id);
      useArgumentStore.getState().addEdge(ids[1], ids[0], EdgeType.Supports);

      const edgeId = useArgumentStore.getState().edges[0].id;
      useArgumentStore.getState().deleteEdge(edgeId);
      await flushMicrotasks();

      expect(useArgumentStore.getState().edges).toHaveLength(0);
    });
  });

  describe("updateEdgeType", () => {
    it("changes the edge type", () => {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      store.addNode(NodeType.FactualClaim, { x: 100, y: 0 });
      const ids = useArgumentStore.getState().nodes.map((n) => n.id);
      useArgumentStore.getState().addEdge(ids[0], ids[1], EdgeType.Supports);
      const edgeId = useArgumentStore.getState().edges[0].id;

      useArgumentStore.getState().updateEdgeType(edgeId, EdgeType.Undermines);
      const edge = useArgumentStore.getState().edges[0];
      expect(edge.data?.edgeType).toBe(EdgeType.Undermines);
      expect(edge.type).toBe(EdgeType.Undermines);
    });
  });

  describe("updateEdgeNotes", () => {
    it("updates notes on an edge", () => {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      store.addNode(NodeType.Evidence, { x: 100, y: 0 });
      const ids = useArgumentStore.getState().nodes.map((n) => n.id);
      useArgumentStore.getState().addEdge(ids[1], ids[0], EdgeType.Supports);
      const edgeId = useArgumentStore.getState().edges[0].id;

      useArgumentStore.getState().updateEdgeNotes(edgeId, "Some note");
      expect(useArgumentStore.getState().edges[0].data?.notes).toBe("Some note");
    });
  });

  describe("updateEdgeWeight", () => {
    it("sets weight on an edge", () => {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      store.addNode(NodeType.Evidence, { x: 100, y: 0 });
      const ids = useArgumentStore.getState().nodes.map((n) => n.id);
      useArgumentStore.getState().addEdge(ids[1], ids[0], EdgeType.Supports);
      const edgeId = useArgumentStore.getState().edges[0].id;

      useArgumentStore.getState().updateEdgeWeight(edgeId, EdgeWeight.Strong);
      expect(useArgumentStore.getState().edges[0].data?.weight).toBe(EdgeWeight.Strong);
    });
  });

  describe("updateEdgeStrength", () => {
    it("sets strength on an edge", () => {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      store.addNode(NodeType.Evidence, { x: 100, y: 0 });
      const ids = useArgumentStore.getState().nodes.map((n) => n.id);
      useArgumentStore.getState().addEdge(ids[1], ids[0], EdgeType.Supports);
      const edgeId = useArgumentStore.getState().edges[0].id;

      useArgumentStore.getState().updateEdgeStrength(edgeId, 0.8);
      expect(useArgumentStore.getState().edges[0].data?.strength).toBe(0.8);
    });

    it("clears strength by setting to null", () => {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      store.addNode(NodeType.Evidence, { x: 100, y: 0 });
      const ids = useArgumentStore.getState().nodes.map((n) => n.id);
      useArgumentStore.getState().addEdge(ids[1], ids[0], EdgeType.Supports);
      const edgeId = useArgumentStore.getState().edges[0].id;

      useArgumentStore.getState().updateEdgeStrength(edgeId, 0.5);
      useArgumentStore.getState().updateEdgeStrength(edgeId, null);
      expect(useArgumentStore.getState().edges[0].data?.strength).toBeNull();
    });
  });

  // --- Graph-level ---

  describe("loadGraph", () => {
    it("replaces state with loaded graph", () => {
      // Add initial data
      useArgumentStore.getState().addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      expect(useArgumentStore.getState().nodes).toHaveLength(1);

      const graph: ArgumentGraph = {
        title: "Loaded",
        description: "Loaded desc",
        nodes: [
          {
            id: "loaded-n1",
            type: NodeType.Policy,
            position: { x: 50, y: 50 },
            data: {
              nodeType: NodeType.Policy,
              label: "Policy",
              notes: "",
              status: NodeStatus.Unsupported,
              scope: "",
            },
          },
        ],
        edges: [],
      };

      useArgumentStore.getState().loadGraph(graph);
      const state = useArgumentStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0].id).toBe("loaded-n1");
      expect(state.graphTitle).toBe("Loaded");
      expect(state.graphDescription).toBe("Loaded desc");
    });
  });

  describe("clearGraph", () => {
    it("resets all state", () => {
      useArgumentStore.getState().addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      useArgumentStore.getState().setGraphTitle("My Graph");
      useArgumentStore.getState().clearGraph();

      const state = useArgumentStore.getState();
      expect(state.nodes).toHaveLength(0);
      expect(state.edges).toHaveLength(0);
      expect(state.graphTitle).toBe("Untitled Argument Map");
      expect(state.graphDescription).toBe("");
    });
  });

  // --- Posterior auto-clearing ---

  describe("clearPosteriors", () => {
    /** Helper: set up two nodes with posteriors and a support edge. */
    function setupWithPosteriors() {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.Evidence, { x: 0, y: 0 });
      store.addNode(NodeType.FactualClaim, { x: 100, y: 0 });
      const ids = useArgumentStore.getState().nodes.map((n) => n.id);
      store.addEdge(ids[0], ids[1], EdgeType.Supports);
      // Simulate inference results
      store.updateNodeData(ids[0], { posterior: 0.85 });
      store.updateNodeData(ids[1], { posterior: 0.72 });
      return ids;
    }

    it("setting posterior does NOT clear other posteriors", () => {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.Evidence, { x: 0, y: 0 });
      store.addNode(NodeType.FactualClaim, { x: 100, y: 0 });
      const ids = useArgumentStore.getState().nodes.map((n) => n.id);
      store.updateNodeData(ids[0], { posterior: 0.85 });
      store.updateNodeData(ids[1], { posterior: 0.72 });
      const nodes = useArgumentStore.getState().nodes;
      expect(nodes[0].data.posterior).toBe(0.85);
      expect(nodes[1].data.posterior).toBe(0.72);
    });

    it("changing credence clears all posteriors", () => {
      const ids = setupWithPosteriors();
      useArgumentStore.getState().updateNodeData(ids[0], { credence: 0.6 });
      const nodes = useArgumentStore.getState().nodes;
      expect(nodes.every((n) => n.data.posterior == null)).toBe(true);
    });

    it("adding an edge clears all posteriors", async () => {
      const ids = setupWithPosteriors();
      // Add a third node and edge
      useArgumentStore.getState().addNode(NodeType.Evidence, { x: 200, y: 0 });
      const newId = useArgumentStore.getState().nodes[2].id;
      useArgumentStore.getState().addEdge(newId, ids[1], EdgeType.Supports);
      await flushMicrotasks();
      const nodes = useArgumentStore.getState().nodes;
      expect(nodes.every((n) => n.data.posterior == null)).toBe(true);
    });

    it("deleting an edge clears all posteriors", async () => {
      const ids = setupWithPosteriors();
      const edgeId = useArgumentStore.getState().edges[0].id;
      useArgumentStore.getState().deleteEdge(edgeId);
      await flushMicrotasks();
      const nodes = useArgumentStore.getState().nodes;
      expect(nodes.every((n) => n.data.posterior == null)).toBe(true);
    });

    it("deleting a node clears all posteriors", async () => {
      const ids = setupWithPosteriors();
      useArgumentStore.getState().deleteNode(ids[0]);
      await flushMicrotasks();
      const nodes = useArgumentStore.getState().nodes;
      expect(nodes.every((n) => n.data.posterior == null)).toBe(true);
    });

    it("changing edge type clears all posteriors", async () => {
      const ids = setupWithPosteriors();
      const edgeId = useArgumentStore.getState().edges[0].id;
      useArgumentStore.getState().updateEdgeType(edgeId, EdgeType.Undermines);
      await flushMicrotasks();
      const nodes = useArgumentStore.getState().nodes;
      expect(nodes.every((n) => n.data.posterior == null)).toBe(true);
    });

    it("changing edge strength clears all posteriors", () => {
      const ids = setupWithPosteriors();
      const edgeId = useArgumentStore.getState().edges[0].id;
      useArgumentStore.getState().updateEdgeStrength(edgeId, 0.3);
      const nodes = useArgumentStore.getState().nodes;
      expect(nodes.every((n) => n.data.posterior == null)).toBe(true);
    });

    it("loadGraph does NOT clear posteriors from loaded data", () => {
      const graph: ArgumentGraph = {
        title: "Test",
        description: "",
        nodes: [
          {
            id: "n1",
            type: NodeType.Evidence,
            position: { x: 0, y: 0 },
            data: {
              nodeType: NodeType.Evidence,
              label: "E",
              notes: "",
              status: NodeStatus.Unsupported,
              sourceType: "study",
              citation: "",
              url: "",
              posterior: 0.9,
            },
          },
        ],
        edges: [],
      };
      useArgumentStore.getState().loadGraph(graph);
      expect(useArgumentStore.getState().nodes[0].data.posterior).toBe(0.9);
    });

    it("updating notes does NOT clear posteriors", () => {
      const ids = setupWithPosteriors();
      useArgumentStore.getState().updateNodeData(ids[0], { notes: "updated" });
      const nodes = useArgumentStore.getState().nodes;
      expect(nodes[0].data.posterior).toBe(0.85);
      expect(nodes[1].data.posterior).toBe(0.72);
    });
  });

  // --- Status recomputation ---

  describe("recomputeStatuses", () => {
    it("Supports edge → Supported status", async () => {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      store.addNode(NodeType.Evidence, { x: 100, y: 0 });
      const ids = useArgumentStore.getState().nodes.map((n) => n.id);
      useArgumentStore.getState().addEdge(ids[1], ids[0], EdgeType.Supports);
      await flushMicrotasks();

      const node = useArgumentStore.getState().nodes.find((n) => n.id === ids[0]);
      expect(node!.data.status).toBe(NodeStatus.Supported);
    });

    it("Supports + Undermines → Contested status", async () => {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.Policy, { x: 0, y: 0 });
      store.addNode(NodeType.FactualClaim, { x: 100, y: 0 });
      store.addNode(NodeType.FactualClaim, { x: 200, y: 0 });
      const ids = useArgumentStore.getState().nodes.map((n) => n.id);

      useArgumentStore.getState().addEdge(ids[1], ids[0], EdgeType.Supports);
      useArgumentStore.getState().addEdge(ids[2], ids[0], EdgeType.Undermines);
      await flushMicrotasks();

      const node = useArgumentStore.getState().nodes.find((n) => n.id === ids[0]);
      expect(node!.data.status).toBe(NodeStatus.Contested);
    });

    it("no incoming edges → Unsupported status", async () => {
      const store = useArgumentStore.getState();
      store.addNode(NodeType.FactualClaim, { x: 0, y: 0 });
      store.addNode(NodeType.Evidence, { x: 100, y: 0 });
      const ids = useArgumentStore.getState().nodes.map((n) => n.id);

      // Add and then delete the support edge
      useArgumentStore.getState().addEdge(ids[1], ids[0], EdgeType.Supports);
      await flushMicrotasks();
      expect(useArgumentStore.getState().nodes.find((n) => n.id === ids[0])!.data.status).toBe(
        NodeStatus.Supported
      );

      const edgeId = useArgumentStore.getState().edges[0].id;
      useArgumentStore.getState().deleteEdge(edgeId);
      await flushMicrotasks();

      const node = useArgumentStore.getState().nodes.find((n) => n.id === ids[0]);
      expect(node!.data.status).toBe(NodeStatus.Unsupported);
    });
  });
});
