"use client";

import { useState, useEffect } from "react";
import { useArgumentStore } from "@/store/useArgumentStore";
import { buildGraphFromWizard, type WizardData } from "@/lib/wizardBuilder";

interface WizardModalProps {
  onClose: () => void;
}

const STEPS = [
  { title: "Main Claim", description: "What is the central claim or policy you want to argue?" },
  { title: "Supporting Arguments", description: "What arguments support your claim? (one per line)" },
  { title: "Opposing Arguments", description: "What arguments oppose your claim? (one per line)" },
  { title: "Key Assumptions", description: "What assumptions underlie your argument? (one per line)" },
  { title: "Evidence", description: "What evidence or sources support your case? (one per line, optional)" },
];

export default function WizardModal({ onClose }: WizardModalProps) {
  const loadGraph = useArgumentStore((s) => s.loadGraph);
  const autoLayout = useArgumentStore((s) => s.autoLayout);
  const nodes = useArgumentStore((s) => s.nodes);

  const [step, setStep] = useState(0);
  const [claim, setClaim] = useState("");
  const [supports, setSupports] = useState("");
  const [oppositions, setOppositions] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [evidence, setEvidence] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const parseLines = (text: string) =>
    text.split("\n").map((l) => l.trim()).filter(Boolean);

  const handleGenerate = () => {
    if (!claim.trim()) return;

    if (nodes.length > 0) {
      if (!confirm("This will replace the current argument map. Continue?")) {
        return;
      }
    }

    const data: WizardData = {
      claim: claim.trim(),
      supports: parseLines(supports),
      oppositions: parseLines(oppositions),
      assumptions: parseLines(assumptions),
      evidence: parseLines(evidence),
    };

    const graph = buildGraphFromWizard(data);
    loadGraph(graph);
    autoLayout();
    onClose();
  };

  const canProceed = step === 0 ? claim.trim().length > 0 : true;
  const isLastStep = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Guided Build
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === step
                    ? "bg-green-500"
                    : i < step
                    ? "bg-green-300 dark:bg-green-700"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Step {step + 1}: {STEPS[step].title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {STEPS[step].description}
            </p>

            {step === 0 && (
              <input
                type="text"
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="e.g. Governments should implement a carbon tax"
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                autoFocus
              />
            )}
            {step === 1 && (
              <textarea
                value={supports}
                onChange={(e) => setSupports(e.target.value)}
                rows={4}
                placeholder={"Reduces greenhouse gas emissions\nCreates economic incentives for clean energy\nSuccessful in other countries"}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                autoFocus
              />
            )}
            {step === 2 && (
              <textarea
                value={oppositions}
                onChange={(e) => setOppositions(e.target.value)}
                rows={4}
                placeholder={"Increases energy costs for consumers\nMay hurt economic competitiveness\nDifficult to implement fairly"}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                autoFocus
              />
            )}
            {step === 3 && (
              <textarea
                value={assumptions}
                onChange={(e) => setAssumptions(e.target.value)}
                rows={4}
                placeholder={"Market mechanisms can reduce emissions\nGovernments will enforce the tax consistently\nClean alternatives are available"}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                autoFocus
              />
            )}
            {step === 4 && (
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                rows={4}
                placeholder={"British Columbia carbon tax study (2008-2015)\nEU Emissions Trading System data\nIPCC AR6 report recommendations"}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            {isLastStep ? (
              <button
                onClick={handleGenerate}
                disabled={!canProceed}
                className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed}
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
