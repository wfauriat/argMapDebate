"use client";

import { useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useArgumentStore } from "@/store/useArgumentStore";
import { useThemeStore } from "@/store/useThemeStore";
import { nodeTypes } from "@/components/nodes";
import { edgeTypes } from "@/components/edges";

export default function ArgumentCanvas() {
  const nodes = useArgumentStore((s) => s.nodes);
  const edges = useArgumentStore((s) => s.edges);
  const onNodesChange = useArgumentStore((s) => s.onNodesChange);
  const onEdgesChange = useArgumentStore((s) => s.onEdgesChange);
  const onConnect = useArgumentStore((s) => s.onConnect);
  const selectNode = useArgumentStore((s) => s.selectNode);
  const selectEdge = useArgumentStore((s) => s.selectEdge);
  const setViewport = useArgumentStore((s) => s.setViewport);
  const layoutTrigger = useArgumentStore((s) => s.layoutTrigger);
  const theme = useThemeStore((s) => s.theme);
  const reactFlow = useReactFlow();
  const prevLayoutTrigger = useRef(layoutTrigger);

  useEffect(() => {
    if (layoutTrigger !== prevLayoutTrigger.current) {
      prevLayoutTrigger.current = layoutTrigger;
      window.requestAnimationFrame(() => {
        reactFlow.fitView({ padding: 0.1, duration: 300 });
      });
    }
  }, [layoutTrigger, reactFlow]);

  const onNodeClick: NodeMouseHandler = (_event, node) => {
    selectNode(node.id);
  };

  const onEdgeClick: EdgeMouseHandler = (_event, edge) => {
    selectEdge(edge.id);
  };

  const onPaneClick = () => {
    selectNode(null);
    selectEdge(null);
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      onMoveEnd={(_event, viewport) => setViewport(viewport)}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      deleteKeyCode={["Backspace", "Delete"]}
      className={`bg-gray-50 dark:bg-gray-900 ${theme === "dark" ? "dark" : ""}`}
    >
      {/* Custom SVG markers for edge arrows */}
      <svg>
        <defs>
          <marker id="supports-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
          </marker>
          <marker id="undermines-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
          </marker>
          <marker id="dependson-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
          </marker>
          <marker id="contradicts-arrow-end" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
          </marker>
          <marker id="contradicts-arrow-start" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 10 0 L 0 5 L 10 10 z" fill="#dc2626" />
          </marker>
        </defs>
      </svg>
      <Background gap={20} size={1} color={theme === "dark" ? "#374151" : "#d1d5db"} />
      <Controls />
      <MiniMap
        nodeStrokeWidth={3}
        className="!bg-white !border-gray-200 dark:!bg-gray-800 dark:!border-gray-700"
      />
    </ReactFlow>
  );
}
