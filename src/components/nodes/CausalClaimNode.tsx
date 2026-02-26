"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import { NodeType, type CausalClaimData } from "@/types/nodes";

function CausalClaimNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as CausalClaimData;
  return (
    <BaseNode nodeId={id} nodeType={NodeType.CausalClaim} label={d.label} status={d.status} credence={d.credence} posterior={d.posterior} selected={selected}>
      {d.mechanism && (
        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 italic">Mechanism: {d.mechanism}</p>
      )}
      {d.sources.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {d.sources.length} source{d.sources.length !== 1 ? "s" : ""}
        </p>
      )}
    </BaseNode>
  );
}

export default memo(CausalClaimNode);
