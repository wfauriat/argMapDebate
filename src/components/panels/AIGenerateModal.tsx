"use client";

import { useState, useEffect, useRef } from "react";
import { useArgumentStore } from "@/store/useArgumentStore";
import {
  loadSettings,
  saveSettings,
  generateArgumentMap,
  type AIProviderSettings,
} from "@/lib/aiGenerate";

interface AIGenerateModalProps {
  onClose: () => void;
}

export default function AIGenerateModal({ onClose }: AIGenerateModalProps) {
  const loadGraph = useArgumentStore((s) => s.loadGraph);
  const autoLayout = useArgumentStore((s) => s.autoLayout);
  const nodes = useArgumentStore((s) => s.nodes);

  const [topic, setTopic] = useState("");
  const [settings, setSettings] = useState<AIProviderSettings>(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(() => !loadSettings().apiKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  const handleGenerate = async () => {
    if (!topic.trim() || loading) return;

    setError(null);
    saveSettings(settings);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const graph = await generateArgumentMap(topic.trim(), settings, controller.signal);

      if (nodes.length > 0) {
        if (!confirm("This will replace the current argument map. Continue?")) {
          setLoading(false);
          return;
        }
      }

      loadGraph(graph);
      autoLayout();
      onClose();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI Generate Argument Map
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Topic */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Debate Topic
            </label>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Should governments implement a universal basic income?"
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          {/* Provider Settings */}
          <div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
            >
              <span className={`inline-block transition-transform ${settingsOpen ? "rotate-90" : ""}`}>
                ▶
              </span>
              Provider Settings
            </button>

            {settingsOpen && (
              <div className="mt-2 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={settings.baseUrl}
                    onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={settings.model}
                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Settings are saved to localStorage.
                </p>
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded dark:text-red-400 dark:bg-red-950 dark:border-red-800">
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300 shrink-0"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
