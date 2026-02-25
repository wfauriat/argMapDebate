"use client";

import { useArgumentStore } from "@/store/useArgumentStore";
import {
  getUnsupportedClaims,
  getIsolatedNodes,
  getGraphStats,
} from "@/analysis/structuralAnalysis";
import { NODE_TYPE_CONFIG } from "@/constants/nodeConfig";
import type { ArgumentNodeData } from "@/types/nodes";

export default function AnalysisPanel() {
  const nodes = useArgumentStore((s) => s.nodes);
  const edges = useArgumentStore((s) => s.edges);
  const selectNode = useArgumentStore((s) => s.selectNode);

  if (nodes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p className="text-4xl mb-3">🗺️</p>
        <p className="font-medium text-gray-600 dark:text-gray-300">Argument Mapper</p>
        <p className="text-sm mt-2">
          Add nodes using the toolbar above, then connect them by dragging from
          one handle to another.
        </p>
        <p className="text-xs mt-4 text-gray-400">
          Or click &quot;Load Example&quot; to see a carbon tax debate map.
        </p>
      </div>
    );
  }

  const unsupported = getUnsupportedClaims(nodes, edges);
  const isolated = getIsolatedNodes(nodes, edges);
  const stats = getGraphStats(nodes, edges);

  return (
    <div className="p-4 space-y-5">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Analysis</h2>

      {/* Statistics */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Statistics
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
            <p className="text-gray-500 dark:text-gray-400 text-xs">Nodes</p>
            <p className="font-semibold">{stats.totalNodes}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
            <p className="text-gray-500 dark:text-gray-400 text-xs">Edges</p>
            <p className="font-semibold">{stats.totalEdges}</p>
          </div>
        </div>
        {Object.entries(stats.nodesByType).length > 0 && (
          <div className="mt-2 space-y-1">
            {Object.entries(stats.nodesByType).map(([type, count]) => (
              <div key={type} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{NODE_TYPE_CONFIG[type as keyof typeof NODE_TYPE_CONFIG]?.label ?? type}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unsupported Claims */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Unsupported Claims ({unsupported.length})
        </h3>
        {unsupported.length === 0 ? (
          <p className="text-xs text-green-600">All claims have support!</p>
        ) : (
          <div className="space-y-1">
            {unsupported.map((node) => (
              <button
                key={node.id}
                onClick={() => selectNode(node.id)}
                className="w-full text-left text-xs p-2 rounded hover:bg-yellow-50 border border-yellow-100 text-gray-700 dark:text-gray-300 dark:border-yellow-900 dark:hover:bg-yellow-950"
              >
                {(node.data as ArgumentNodeData).label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Isolated Nodes */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Isolated Nodes ({isolated.length})
        </h3>
        {isolated.length === 0 ? (
          <p className="text-xs text-green-600">No isolated nodes!</p>
        ) : (
          <div className="space-y-1">
            {isolated.map((node) => (
              <button
                key={node.id}
                onClick={() => selectNode(node.id)}
                className="w-full text-left text-xs p-2 rounded hover:bg-orange-50 border border-orange-100 text-gray-700 dark:text-gray-300 dark:border-orange-900 dark:hover:bg-orange-950"
              >
                {(node.data as ArgumentNodeData).label}
              </button>
            ))}
          </div>
        )}
      </div>

      {stats.maxSupportChainDepth > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Max support chain depth: {stats.maxSupportChainDepth}
        </div>
      )}
    </div>
  );
}
