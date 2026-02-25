"use client";

import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import ArgumentCanvas from "@/components/canvas/ArgumentCanvas";
import Toolbar from "@/components/panels/Toolbar";
import NodeEditor from "@/components/panels/NodeEditor";
import EdgeEditor from "@/components/panels/EdgeEditor";
import AnalysisPanel from "@/components/panels/AnalysisPanel";
import { useArgumentStore } from "@/store/useArgumentStore";
import { useThemeStore } from "@/store/useThemeStore";

function Sidebar() {
  const selectedNodeId = useArgumentStore((s) => s.selectedNodeId);
  const selectedEdgeId = useArgumentStore((s) => s.selectedEdgeId);

  return (
    <div className="w-80 border-l border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 overflow-y-auto">
      {selectedNodeId ? (
        <NodeEditor />
      ) : selectedEdgeId ? (
        <EdgeEditor />
      ) : (
        <AnalysisPanel />
      )}
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
