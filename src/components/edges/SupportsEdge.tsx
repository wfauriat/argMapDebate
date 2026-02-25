"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { EDGE_TYPE_CONFIG } from "@/constants/edgeConfig";
import { EdgeType } from "@/types/edges";

const config = EDGE_TYPE_CONFIG[EdgeType.Supports];

export default function SupportsEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, id } = props;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: config.color, strokeWidth: 2 }}
        markerEnd="url(#supports-arrow)"
      />
      <EdgeLabelRenderer>
        <div
          className="absolute text-[10px] font-medium text-green-600 bg-white/80 dark:bg-gray-800/80 px-1 rounded pointer-events-none nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          Supports
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
