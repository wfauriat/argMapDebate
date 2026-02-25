import { describe, it, expect, beforeEach } from "vitest";
import { useSelectionStore } from "@/store/useSelectionStore";

describe("useSelectionStore", () => {
  beforeEach(() => {
    useSelectionStore.setState({
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  });

  it("selectNode sets node and clears edge", () => {
    // Pre-set an edge
    useSelectionStore.setState({ selectedEdgeId: "edge1" });
    useSelectionStore.getState().selectNode("node1");
    const state = useSelectionStore.getState();
    expect(state.selectedNodeId).toBe("node1");
    expect(state.selectedEdgeId).toBeNull();
  });

  it("selectEdge sets edge and clears node", () => {
    // Pre-set a node
    useSelectionStore.setState({ selectedNodeId: "node1" });
    useSelectionStore.getState().selectEdge("edge1");
    const state = useSelectionStore.getState();
    expect(state.selectedEdgeId).toBe("edge1");
    expect(state.selectedNodeId).toBeNull();
  });

  it("selectNode(null) keeps edge selection", () => {
    useSelectionStore.setState({ selectedEdgeId: "edge1" });
    useSelectionStore.getState().selectNode(null);
    const state = useSelectionStore.getState();
    expect(state.selectedNodeId).toBeNull();
    expect(state.selectedEdgeId).toBe("edge1");
  });

  it("selectEdge(null) keeps node selection", () => {
    useSelectionStore.setState({ selectedNodeId: "node1" });
    useSelectionStore.getState().selectEdge(null);
    const state = useSelectionStore.getState();
    expect(state.selectedEdgeId).toBeNull();
    expect(state.selectedNodeId).toBe("node1");
  });
});
