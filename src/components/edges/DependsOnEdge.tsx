"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { EDGE_TYPE_CONFIG } from "@/constants/edgeConfig";
import { EdgeType } from "@/types/edges";

const config = EDGE_TYPE_CONFIG[EdgeType.DependsOn];

export default function DependsOnEdge(props: EdgeProps) {
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
        style={{
          stroke: config.color,
          strokeWidth: 2,
          strokeDasharray: config.strokeDasharray,
        }}
        markerEnd="url(#dependson-arrow)"
      />
      <EdgeLabelRenderer>
        <div
          className="absolute text-[10px] font-medium text-gray-500 bg-white/80 dark:bg-gray-800/80 dark:text-gray-400 px-1 rounded pointer-events-none nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          Depends On
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
