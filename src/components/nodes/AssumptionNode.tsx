"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import { NodeType, type AssumptionData } from "@/types/nodes";

function AssumptionNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as AssumptionData;
  return (
    <BaseNode nodeId={id} nodeType={NodeType.Assumption} label={d.label} status={d.status} credence={d.credence} posterior={d.posterior} selected={selected}>
      <div className="flex items-center gap-1 mt-1 flex-wrap">
        <span
          className={`inline-block text-xs px-1.5 py-0.5 rounded ${
            d.isExplicit
              ? "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
          }`}
        >
          {d.isExplicit ? "Explicit" : "Implicit"}
        </span>
        {d.isLoadBearing && (
          <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 font-medium">
            Load-bearing
          </span>
        )}
      </div>
    </BaseNode>
  );
}

export default memo(AssumptionNode);
