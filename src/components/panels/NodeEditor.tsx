"use client";

import { useArgumentStore } from "@/store/useArgumentStore";
import { NODE_TYPE_CONFIG } from "@/constants/nodeConfig";
import { NodeType, type ArgumentNodeData } from "@/types/nodes";
import { createNodeData } from "@/lib/nodeDefaults";

export default function NodeEditor() {
  const selectedNodeId = useArgumentStore((s) => s.selectedNodeId);
  const nodes = useArgumentStore((s) => s.nodes);
  const updateNodeData = useArgumentStore((s) => s.updateNodeData);
  const deleteNode = useArgumentStore((s) => s.deleteNode);
  const selectNode = useArgumentStore((s) => s.selectNode);

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node || !selectedNodeId) return null;

  const data = node.data as ArgumentNodeData;
  const config = NODE_TYPE_CONFIG[data.nodeType];

  const update = (partial: Partial<ArgumentNodeData>) => {
    updateNodeData(selectedNodeId, partial);
  };

  const handleDelete = () => {
    deleteNode(selectedNodeId);
    selectNode(null);
  };

  const handleTypeChange = (newType: NodeType) => {
    if (newType === data.nodeType) return;
    const newData = createNodeData(newType);
    newData.label = data.label;
    newData.notes = data.notes;
    newData.status = data.status;
    updateNodeData(selectedNodeId, newData);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{config.icon}</span>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{config.label}</h2>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
        >
          ✕
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Node Type</label>
        <select
          value={data.nodeType}
          onChange={(e) => handleTypeChange(e.target.value as NodeType)}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
        >
          {Object.values(NodeType).map((type) => (
            <option key={type} value={type}>
              {NODE_TYPE_CONFIG[type].icon} {NODE_TYPE_CONFIG[type].label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Label</label>
        <input
          type="text"
          value={data.label}
          onChange={(e) => update({ label: e.target.value })}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</label>
        <textarea
          value={data.notes}
          onChange={(e) => update({ notes: e.target.value })}
          rows={3}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
        <span className="text-sm text-gray-700 dark:text-gray-300">{data.status}</span>
        <p className="text-xs text-gray-400 mt-0.5">Auto-computed from edges</p>
      </div>

      {/* Type-specific fields */}
      {data.nodeType === NodeType.FactualClaim && (
        <SourcesEditor
          sources={data.sources}
          onChange={(sources) => update({ sources } as Partial<ArgumentNodeData>)}
        />
      )}

      {data.nodeType === NodeType.CausalClaim && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mechanism</label>
            <input
              type="text"
              value={data.mechanism}
              onChange={(e) => update({ mechanism: e.target.value } as Partial<ArgumentNodeData>)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              placeholder="How does the cause produce the effect?"
            />
          </div>
          <SourcesEditor
            sources={data.sources}
            onChange={(sources) => update({ sources } as Partial<ArgumentNodeData>)}
          />
        </>
      )}

      {data.nodeType === NodeType.Value && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Domain</label>
          <select
            value={data.domain}
            onChange={(e) => update({ domain: e.target.value } as Partial<ArgumentNodeData>)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          >
            <option value="">Select domain...</option>
            <option value="Economic">Economic</option>
            <option value="Environmental">Environmental</option>
            <option value="Social">Social</option>
            <option value="Ethical">Ethical</option>
            <option value="Political">Political</option>
            <option value="Health">Health</option>
            <option value="Other">Other</option>
          </select>
        </div>
      )}

      {data.nodeType === NodeType.Assumption && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isExplicit"
            checked={data.isExplicit}
            onChange={(e) =>
              update({ isExplicit: e.target.checked } as Partial<ArgumentNodeData>)
            }
          />
          <label htmlFor="isExplicit" className="text-sm text-gray-700 dark:text-gray-300">
            Explicit assumption
          </label>
        </div>
      )}

      {data.nodeType === NodeType.Evidence && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Source Type</label>
            <select
              value={data.sourceType}
              onChange={(e) =>
                update({ sourceType: e.target.value } as Partial<ArgumentNodeData>)
              }
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="study">Study</option>
              <option value="statistic">Statistic</option>
              <option value="testimony">Testimony</option>
              <option value="observation">Observation</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Citation</label>
            <input
              type="text"
              value={data.citation}
              onChange={(e) => update({ citation: e.target.value } as Partial<ArgumentNodeData>)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              placeholder="Author (Year). Title..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">URL</label>
            <input
              type="url"
              value={data.url}
              onChange={(e) => update({ url: e.target.value } as Partial<ArgumentNodeData>)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              placeholder="https://..."
            />
          </div>
        </>
      )}

      {data.nodeType === NodeType.Policy && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Scope</label>
          <select
            value={data.scope}
            onChange={(e) => update({ scope: e.target.value } as Partial<ArgumentNodeData>)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          >
            <option value="">Select scope...</option>
            <option value="Local">Local</option>
            <option value="State">State</option>
            <option value="National">National</option>
            <option value="International">International</option>
          </select>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleDelete}
          className="w-full px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}

function SourcesEditor({
  sources,
  onChange,
}: {
  sources: string[];
  onChange: (sources: string[]) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        Sources ({sources.length})
      </label>
      {sources.map((source, i) => (
        <div key={i} className="flex gap-1 mb-1">
          <input
            type="text"
            value={source}
            onChange={(e) => {
              const updated = [...sources];
              updated[i] = e.target.value;
              onChange(updated);
            }}
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          />
          <button
            onClick={() => onChange(sources.filter((_, j) => j !== i))}
            className="text-red-400 hover:text-red-600 px-1"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...sources, ""])}
        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
      >
        + Add source
      </button>
    </div>
  );
}
