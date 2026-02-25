"use client";

import { useArgumentStore } from "@/store/useArgumentStore";
import { useSelectionStore } from "@/store/useSelectionStore";
import { EdgeType, EdgeWeight } from "@/types/edges";
import { EDGE_TYPE_CONFIG, EDGE_WEIGHT_CONFIG } from "@/constants/edgeConfig";

export default function EdgeEditor() {
  const selectedEdgeId = useSelectionStore((s) => s.selectedEdgeId);
  const edges = useArgumentStore((s) => s.edges);
  const nodes = useArgumentStore((s) => s.nodes);
  const updateEdgeType = useArgumentStore((s) => s.updateEdgeType);
  const updateEdgeNotes = useArgumentStore((s) => s.updateEdgeNotes);
  const updateEdgeWeight = useArgumentStore((s) => s.updateEdgeWeight);
  const deleteEdge = useArgumentStore((s) => s.deleteEdge);
  const selectEdge = useSelectionStore((s) => s.selectEdge);

  const edge = edges.find((e) => e.id === selectedEdgeId);
  if (!edge || !selectedEdgeId) return null;

  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  const handleDelete = () => {
    deleteEdge(selectedEdgeId);
    selectEdge(null);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Edge</h2>
        <button
          onClick={() => selectEdge(null)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
        >
          ✕
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Edge Type</label>
        <div className="space-y-1">
          {Object.values(EdgeType).map((type) => {
            const config = EDGE_TYPE_CONFIG[type];
            return (
              <label
                key={type}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${
                  edge.data?.edgeType === type
                    ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <input
                  type="radio"
                  name="edgeType"
                  value={type}
                  checked={edge.data?.edgeType === type}
                  onChange={() => updateEdgeType(selectedEdgeId, type)}
                  className="sr-only"
                />
                <span
                  className="w-4 h-1 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-sm">{config.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Weight</label>
        <div className="space-y-1">
          {[...Object.values(EdgeWeight), undefined].map((w) => {
            const label = w ? EDGE_WEIGHT_CONFIG[w].label : "Not set";
            const isSelected = edge.data?.weight === w;
            return (
              <label
                key={label}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${
                  isSelected
                    ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <input
                  type="radio"
                  name="edgeWeight"
                  checked={isSelected}
                  onChange={() => updateEdgeWeight(selectedEdgeId, w)}
                  className="sr-only"
                />
                <span className="text-sm">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>
          <span className="font-medium">From:</span>{" "}
          {sourceNode?.data?.label ?? edge.source}
        </p>
        <p>
          <span className="font-medium">To:</span>{" "}
          {targetNode?.data?.label ?? edge.target}
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</label>
        <textarea
          value={edge.data?.notes ?? ""}
          onChange={(e) => updateEdgeNotes(selectedEdgeId, e.target.value)}
          rows={3}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          placeholder="Why does this relationship hold?"
        />
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleDelete}
          className="w-full px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
        >
          Delete Edge
        </button>
      </div>
    </div>
  );
}
