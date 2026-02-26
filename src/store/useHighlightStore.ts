import { create } from "zustand";

interface HighlightState {
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  weakestEdgeId: string | null;
  weakestNodeId: string | null;
  setHighlights: (nodeIds: string[], edgeIds: string[], weakestEdgeId: string | null, weakestNodeId?: string | null) => void;
  clearHighlights: () => void;
}

export const useHighlightStore = create<HighlightState>((set) => ({
  highlightedNodeIds: new Set<string>(),
  highlightedEdgeIds: new Set<string>(),
  weakestEdgeId: null,
  weakestNodeId: null,

  setHighlights: (nodeIds, edgeIds, weakestEdgeId, weakestNodeId = null) => {
    set({
      highlightedNodeIds: new Set(nodeIds),
      highlightedEdgeIds: new Set(edgeIds),
      weakestEdgeId,
      weakestNodeId,
    });
  },

  clearHighlights: () => {
    set({
      highlightedNodeIds: new Set<string>(),
      highlightedEdgeIds: new Set<string>(),
      weakestEdgeId: null,
      weakestNodeId: null,
    });
  },
}));
