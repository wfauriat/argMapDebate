"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import { NodeType, type ValueData } from "@/types/nodes";

function ValueNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as ValueData;
  return (
    <BaseNode nodeId={id} nodeType={NodeType.Value} label={d.label} status={d.status} credence={d.credence} posterior={d.posterior} selected={selected}>
      {d.domain && (
        <span className="inline-block text-xs bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300 px-1.5 py-0.5 rounded mt-1">
          {d.domain}
        </span>
      )}
    </BaseNode>
  );
}

export default memo(ValueNode);
