"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import { NodeType, type AssumptionData } from "@/types/nodes";

function AssumptionNode({ data, selected }: NodeProps) {
  const d = data as unknown as AssumptionData;
  return (
    <BaseNode nodeType={NodeType.Assumption} label={d.label} status={d.status} selected={selected}>
      <span
        className={`inline-block text-xs px-1.5 py-0.5 rounded mt-1 ${
          d.isExplicit
            ? "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
        }`}
      >
        {d.isExplicit ? "Explicit" : "Implicit"}
      </span>
    </BaseNode>
  );
}

export default memo(AssumptionNode);
