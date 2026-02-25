import { create } from "zustand";

interface HighlightState {
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  weakestEdgeId: string | null;
  setHighlights: (nodeIds: string[], edgeIds: string[], weakestEdgeId: string | null) => void;
  clearHighlights: () => void;
}

export const useHighlightStore = create<HighlightState>((set) => ({
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
}));
