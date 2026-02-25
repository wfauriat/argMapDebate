"use client";

import { useState, useRef } from "react";
import { useArgumentStore } from "@/store/useArgumentStore";
import { useReactFlow } from "@xyflow/react";
import { NodeType } from "@/types/nodes";
import { NODE_TYPE_CONFIG } from "@/constants/nodeConfig";
import { exportGraph, importGraph } from "@/lib/serialization";
import { loadExampleMap, EXAMPLE_MAPS } from "@/lib/exampleMaps";
import { useThemeStore } from "@/store/useThemeStore";
import AIGenerateButton from "./AIGenerateButton";

export default function Toolbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [exampleDropdownOpen, setExampleDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addNode = useArgumentStore((s) => s.addNode);
  const clearGraph = useArgumentStore((s) => s.clearGraph);
  const loadGraph = useArgumentStore((s) => s.loadGraph);
  const graphTitle = useArgumentStore((s) => s.graphTitle);
  const setGraphTitle = useArgumentStore((s) => s.setGraphTitle);
  const autoLayout = useArgumentStore((s) => s.autoLayout);
  const nodes = useArgumentStore((s) => s.nodes);
  const edges = useArgumentStore((s) => s.edges);
  const graphDescription = useArgumentStore((s) => s.graphDescription);
  const reactFlow = useReactFlow();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const handleAddNode = (type: NodeType) => {
    const viewport = reactFlow.getViewport();
    const position = reactFlow.screenToFlowPosition({
      x: window.innerWidth / 2 - 128,
      y: window.innerHeight / 2,
    });
    addNode(type, position ?? { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 });
    setDropdownOpen(false);
  };

  const handleExport = () => {
    const json = exportGraph({ title: graphTitle, description: graphDescription, nodes, edges });
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${graphTitle.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const graph = importGraph(ev.target?.result as string);
        loadGraph(graph);
      } catch (err) {
        alert("Invalid argument map file: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleLoadExample = async (name: string) => {
    try {
      const graph = await loadExampleMap(name);
      loadGraph(graph);
      setExampleDropdownOpen(false);
    } catch (err) {
      alert("Failed to load example: " + (err as Error).message);
    }
  };

  const handleClear = () => {
    if (nodes.length === 0 || confirm("Clear the entire argument map?")) {
      clearGraph();
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700">
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Node ▾
        </button>
        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48 dark:bg-gray-800 dark:border-gray-600">
              {Object.values(NodeType).map((type) => {
                const config = NODE_TYPE_CONFIG[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleAddNode(type)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2"
                  >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

      <button
        onClick={handleExport}
        className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
      >
        Export
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
      >
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />

      <div className="relative">
        <button
          onClick={() => setExampleDropdownOpen(!exampleDropdownOpen)}
          className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Load Example ▾
        </button>
        {exampleDropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setExampleDropdownOpen(false)} />
            <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-56 dark:bg-gray-800 dark:border-gray-600">
              {EXAMPLE_MAPS.map((example) => (
                <button
                  key={example.id}
                  onClick={() => handleLoadExample(example.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => autoLayout()}
        className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
      >
        Auto Layout
      </button>

      <AIGenerateButton />

      <button
        onClick={handleClear}
        className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
      >
        Clear
      </button>

      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 ml-2" />

      <input
        type="text"
        value={graphTitle}
        onChange={(e) => setGraphTitle(e.target.value)}
        className="ml-2 text-lg font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 dark:text-gray-100 dark:hover:border-gray-600"
      />

      <div className="ml-auto">
        <button
          onClick={toggleTheme}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
