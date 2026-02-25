import { describe, it, expect, beforeEach } from "vitest";
import { useHighlightStore } from "@/store/useHighlightStore";

describe("useHighlightStore", () => {
  beforeEach(() => {
    useHighlightStore.getState().clearHighlights();
  });

  it("setHighlights populates node and edge Sets", () => {
    useHighlightStore
      .getState()
      .setHighlights(["n1", "n2"], ["e1", "e2", "e3"], "e2");

    const state = useHighlightStore.getState();
    expect(state.highlightedNodeIds.size).toBe(2);
    expect(state.highlightedNodeIds.has("n1")).toBe(true);
    expect(state.highlightedNodeIds.has("n2")).toBe(true);
    expect(state.highlightedEdgeIds.size).toBe(3);
    expect(state.highlightedEdgeIds.has("e1")).toBe(true);
    expect(state.weakestEdgeId).toBe("e2");
  });

  it("clearHighlights resets all", () => {
    useHighlightStore
      .getState()
      .setHighlights(["n1"], ["e1"], "e1");
    useHighlightStore.getState().clearHighlights();

    const state = useHighlightStore.getState();
    expect(state.highlightedNodeIds.size).toBe(0);
    expect(state.highlightedEdgeIds.size).toBe(0);
    expect(state.weakestEdgeId).toBeNull();
  });

  it("setHighlights replaces previous highlights", () => {
    useHighlightStore
      .getState()
      .setHighlights(["n1", "n2"], ["e1"], null);
    useHighlightStore.getState().setHighlights(["n3"], ["e2"], "e2");

    const state = useHighlightStore.getState();
    expect(state.highlightedNodeIds.size).toBe(1);
    expect(state.highlightedNodeIds.has("n3")).toBe(true);
    expect(state.highlightedNodeIds.has("n1")).toBe(false);
  });
});
