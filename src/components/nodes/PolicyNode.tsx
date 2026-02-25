"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import { NodeType, type PolicyData } from "@/types/nodes";

function PolicyNode({ data, selected }: NodeProps) {
  const d = data as unknown as PolicyData;
  return (
    <BaseNode nodeType={NodeType.Policy} label={d.label} status={d.status} selected={selected}>
      {d.scope && (
        <span className="inline-block text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded mt-1">
          {d.scope}
        </span>
      )}
    </BaseNode>
  );
}

export default memo(PolicyNode);
