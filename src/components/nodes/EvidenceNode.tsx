"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import { NodeType, type EvidenceData } from "@/types/nodes";

function EvidenceNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as EvidenceData;
  return (
    <BaseNode nodeId={id} nodeType={NodeType.Evidence} label={d.label} status={d.status} selected={selected}>
      <span className="inline-block text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 px-1.5 py-0.5 rounded mt-1 capitalize">
        {d.sourceType}
      </span>
      {d.citation && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{d.citation}</p>
      )}
    </BaseNode>
  );
}

export default memo(EvidenceNode);
