"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import { NodeType, type FactualClaimData } from "@/types/nodes";

function FactualClaimNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as FactualClaimData;
  return (
    <BaseNode nodeId={id} nodeType={NodeType.FactualClaim} label={d.label} status={d.status} credence={d.credence} posterior={d.posterior} selected={selected}>
      {d.sources.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {d.sources.length} source{d.sources.length !== 1 ? "s" : ""}
        </p>
      )}
    </BaseNode>
  );
}

export default memo(FactualClaimNode);
