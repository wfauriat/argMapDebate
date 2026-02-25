"use client";

import { useCallback, useMemo, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { useArgumentStore } from "@/store/useArgumentStore";
import { useSelectionStore } from "@/store/useSelectionStore";
import { useHighlightStore } from "@/store/useHighlightStore";
import {
  getUnsupportedClaims,
  getIsolatedNodes,
  getGraphStats,
  getLoadBearingAssumptions,
  getSensitivityAnalysis,
} from "@/analysis/structuralAnalysis";
import { NODE_TYPE_CONFIG } from "@/constants/nodeConfig";
import { EDGE_WEIGHT_CONFIG } from "@/constants/edgeConfig";
import type { ArgumentNodeData } from "@/types/nodes";

const NODE_WIDTH = 256;
const NODE_HEIGHT = 120;

export default function AnalysisPanel() {
  const nodes = useArgumentStore((s) => s.nodes);
  const edges = useArgumentStore((s) => s.edges);
  const selectNode = useSelectionStore((s) => s.selectNode);
  const setHighlights = useHighlightStore((s) => s.setHighlights);
  const clearHighlights = useHighlightStore((s) => s.clearHighlights);
  const hasHighlightsRaw = useHighlightStore((s) => s.highlightedNodeIds.size > 0);
  const reactFlow = useReactFlow();
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unsupported = useMemo(() => getUnsupportedClaims(nodes, edges), [nodes, edges]);
  const isolated = useMemo(() => getIsolatedNodes(nodes, edges), [nodes, edges]);
  const stats = useMemo(() => getGraphStats(nodes, edges), [nodes, edges]);
  const loadBearing = useMemo(() => getLoadBearingAssumptions(nodes, edges), [nodes, edges]);
  const sensitivity = useMemo(() => getSensitivityAnalysis(nodes, edges), [nodes, edges]);
  const hasHighlights = hasHighlightsRaw;

  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Select the node (opens inspector)
    selectNode(nodeId);

    // Center canvas on the node
    reactFlow.setCenter(
      node.position.x + NODE_WIDTH / 2,
      node.position.y + NODE_HEIGHT / 2,
      { zoom: 1, duration: 400 },
    );

    // Briefly highlight the node
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlights([nodeId], [], null);
    highlightTimerRef.current = setTimeout(() => {
      clearHighlights();
      highlightTimerRef.current = null;
    }, 2000);
  }, [nodes, selectNode, reactFlow, setHighlights, clearHighlights]);

  if (nodes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p className="text-4xl mb-3">🗺️</p>
        <p className="font-medium text-gray-600 dark:text-gray-300">Argument Mapper</p>
        <p className="text-sm mt-2">
          Get started by building an argument map:
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Use the toolbar above to:
          </p>
          <ul className="text-xs text-gray-500 dark:text-gray-400 text-left space-y-1.5 px-2">
            <li>&#8226; Click <span className="font-medium">Template</span> to start with a pre-built argument scheme</li>
            <li>&#8226; Click <span className="font-medium">Guided Build</span> for a step-by-step wizard</li>
            <li>&#8226; Click <span className="font-medium">Add Node</span> to add your first node manually</li>
            <li>&#8226; Click <span className="font-medium">Load Example</span> to explore a sample map</li>
          </ul>
        </div>
      </div>
    );
  }

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
                onClick={() => focusNode(node.id)}
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
                onClick={() => focusNode(node.id)}
                className="w-full text-left text-xs p-2 rounded hover:bg-orange-50 border border-orange-100 text-gray-700 dark:text-gray-300 dark:border-orange-900 dark:hover:bg-orange-950"
              >
                {(node.data as ArgumentNodeData).label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Load-Bearing Assumptions */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Load-Bearing Assumptions ({loadBearing.length})
        </h3>
        {loadBearing.length === 0 ? (
          <p className="text-xs text-green-600">No load-bearing assumptions detected.</p>
        ) : (
          <div className="space-y-1">
            {loadBearing.map((lb) => (
              <button
                key={lb.nodeId}
                onClick={() => focusNode(lb.nodeId)}
                className="w-full text-left text-xs p-2 rounded hover:bg-red-50 border border-red-100 text-gray-700 dark:text-gray-300 dark:border-red-900 dark:hover:bg-red-950"
              >
                <span className="font-medium">{lb.label}</span>
                <span className="text-gray-400 ml-1">({lb.downstreamCount} downstream)</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sensitivity: Weakest Link */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Sensitivity: Weakest Link
        </h3>
        {sensitivity ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Longest support chain: {sensitivity.chainLength} nodes
              {sensitivity.weakestEdgeWeight && (
                <>, weakest edge: <span className="font-medium text-amber-600">{EDGE_WEIGHT_CONFIG[sensitivity.weakestEdgeWeight].label}</span></>
              )}
            </p>
            <div className="flex gap-2">
              {!hasHighlights ? (
                <button
                  onClick={() => setHighlights(sensitivity.chainNodeIds, sensitivity.chainEdgeIds, sensitivity.weakestEdgeId)}
                  className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:hover:bg-amber-800"
                >
                  Show weakest link
                </button>
              ) : (
                <button
                  onClick={() => clearHighlights()}
                  className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Clear highlights
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">No support chains found.</p>
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
