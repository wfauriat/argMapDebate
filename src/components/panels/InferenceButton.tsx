"use client";

import { useState, useRef } from "react";
import { useArgumentStore } from "@/store/useArgumentStore";
import { useToastStore } from "@/store/useToastStore";
import { buildInferencePayload } from "@/lib/inferenceExport";
import {
  loadInferenceSettings,
  saveInferenceSettings,
  runInference,
  type InferenceSettings,
} from "@/lib/inferenceApi";

export default function InferenceButton() {
  const nodes = useArgumentStore((s) => s.nodes);
  const edges = useArgumentStore((s) => s.edges);
  const updateNodeData = useArgumentStore((s) => s.updateNodeData);
  const addToast = useToastStore((s) => s.addToast);

  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<InferenceSettings>(loadInferenceSettings);
  const abortRef = useRef<AbortController | null>(null);

  const handleRun = async () => {
    if (loading || nodes.length === 0) return;

    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const payload = buildInferencePayload(nodes, edges);
      const { result, warnings: w } = await runInference(payload, settings, controller.signal);

      for (const warn of w) {
        addToast("warning", warn);
      }

      for (const nodeResult of result.nodes) {
        updateNodeData(nodeResult.id, { posterior: nodeResult.posterior });
      }

      if (w.length === 0) {
        addToast("success", `Inference complete — ${result.nodes.length} posteriors updated.`);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      addToast("error", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = (newSettings: InferenceSettings) => {
    setSettings(newSettings);
    saveInferenceSettings(newSettings);
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={handleRun}
        disabled={loading || nodes.length === 0}
        className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-l hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {loading ? "Running…" : "Run Inference"}
      </button>

      {/* Settings gear */}
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="px-2 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-r border-l border-amber-700 hover:bg-amber-700"
        title="Inference settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Settings dropdown */}
      {settingsOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setSettingsOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-72 dark:bg-gray-800 dark:border-gray-600">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Backend URL
            </label>
            <input
              type="text"
              value={settings.backendUrl}
              onChange={(e) => handleSaveSettings({ ...settings, backendUrl: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Default: http://localhost:8000
            </p>
          </div>
        </>
      )}

    </div>
  );
}
