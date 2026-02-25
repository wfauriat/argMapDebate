"use client";

import { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import ArgumentCanvas from "@/components/canvas/ArgumentCanvas";
import Toolbar from "@/components/panels/Toolbar";
import NodeEditor from "@/components/panels/NodeEditor";
import EdgeEditor from "@/components/panels/EdgeEditor";
import AnalysisPanel from "@/components/panels/AnalysisPanel";
import { useSelectionStore } from "@/store/useSelectionStore";
import { useThemeStore } from "@/store/useThemeStore";

type SidebarTab = "inspector" | "analysis";

function Sidebar() {
  const selectedNodeId = useSelectionStore((s) => s.selectedNodeId);
  const selectedEdgeId = useSelectionStore((s) => s.selectedEdgeId);
  const [activeTab, setActiveTab] = useState<SidebarTab>("analysis");

  // Auto-switch to inspector when something is selected
  useEffect(() => {
    if (selectedNodeId || selectedEdgeId) {
      setActiveTab("inspector");
    }
  }, [selectedNodeId, selectedEdgeId]);

  return (
    <div className="w-80 border-l border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
        <button
          onClick={() => setActiveTab("inspector")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === "inspector"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Inspector
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === "analysis"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Analysis
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "inspector" ? (
          selectedNodeId ? (
            <NodeEditor />
          ) : selectedEdgeId ? (
            <EdgeEditor />
          ) : (
            <div className="p-4 text-center text-sm text-gray-400 dark:text-gray-500">
              <p className="mb-1">No selection</p>
              <p className="text-xs">Click a node or edge on the canvas to inspect it.</p>
            </div>
          )
        ) : (
          <AnalysisPanel />
        )}
      </div>
    </div>
  );
}

export default function ArgumentMapper() {
  const hydrate = useThemeStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col">
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1">
            <ArgumentCanvas />
          </div>
          <Sidebar />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
