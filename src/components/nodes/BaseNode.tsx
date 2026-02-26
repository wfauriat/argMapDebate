"use client";

import { Handle, Position } from "@xyflow/react";
import { NODE_TYPE_CONFIG } from "@/constants/nodeConfig";
import { NodeType, NodeStatus } from "@/types/nodes";
import { useHighlightStore } from "@/store/useHighlightStore";

const STATUS_BADGE: Record<NodeStatus, { label: string; className: string }> = {
  [NodeStatus.Supported]: {
    label: "Supported",
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  [NodeStatus.Contested]: {
    label: "Contested",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  [NodeStatus.Unsupported]: {
    label: "Unsupported",
    className: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  },
};

function posteriorColor(p: number): string {
  if (p >= 0.7) return "text-green-700 dark:text-green-400";
  if (p >= 0.4) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function posteriorBgColor(p: number): string {
  if (p >= 0.7) return "bg-green-500";
  if (p >= 0.4) return "bg-amber-500";
  return "bg-red-500";
}

interface BaseNodeProps {
  nodeId?: string;
  nodeType: NodeType;
  label: string;
  status: NodeStatus;
  credence?: number | null;
  posterior?: number | null;
  selected?: boolean;
  children?: React.ReactNode;
}

export default function BaseNode({
  nodeId,
  nodeType,
  label,
  status,
  credence,
  posterior,
  selected,
  children,
}: BaseNodeProps) {
  const config = NODE_TYPE_CONFIG[nodeType];
  const badge = STATUS_BADGE[status];
  // Primitive selector — only re-render when this node's highlight status changes
  const isHighlighted = useHighlightStore((s) => nodeId ? s.highlightedNodeIds.has(nodeId) : false);

  return (
    <div
      className={`w-64 rounded-lg border-2 bg-white shadow-md dark:bg-gray-800 dark:shadow-lg dark:shadow-black/30 ${config.color} ${
        selected ? "ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-gray-900" : ""
      } ${isHighlighted ? "ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-gray-900" : ""}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400 dark:!bg-gray-500 !w-3 !h-3" />

      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md ${config.bgColor}`}>
        <span className="text-sm">{config.icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-wide ${config.textColor}`}>
          {config.label}
        </span>
        <span
          className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="px-3 py-2">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{label}</p>
        {children}
      </div>

      {(credence != null || posterior != null) && (
        <div className="px-3 pb-2 pt-0.5">
          <div className="flex items-center gap-2 text-[11px]">
            {credence != null && (
              <span className="text-gray-400 dark:text-gray-500">
                Prior: {credence.toFixed(2)}
              </span>
            )}
            {posterior != null && (
              <>
                {credence != null && (
                  <span className="text-gray-300 dark:text-gray-600">→</span>
                )}
                <span className={`font-semibold ${posteriorColor(posterior)}`}>
                  Post: {posterior.toFixed(2)}
                </span>
              </>
            )}
          </div>
          {posterior != null && (
            <div className="mt-1 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${posteriorBgColor(posterior)}`}
                style={{ width: `${posterior * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 dark:!bg-gray-500 !w-3 !h-3" />
    </div>
  );
}
