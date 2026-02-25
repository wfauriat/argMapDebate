import { create } from "zustand";

interface SelectionState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedNodeId: null,
  selectedEdgeId: null,

  selectNode: (id) => {
    set({ selectedNodeId: id, selectedEdgeId: id ? null : get().selectedEdgeId });
  },

  selectEdge: (id) => {
    set({ selectedEdgeId: id, selectedNodeId: id ? null : get().selectedNodeId });
  },
}));
