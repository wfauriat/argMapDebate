"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { EDGE_TYPE_CONFIG, EDGE_WEIGHT_CONFIG } from "@/constants/edgeConfig";
import { EdgeType, type ArgumentEdgeData, type EdgeWeight } from "@/types/edges";
import { useArgumentStore } from "@/store/useArgumentStore";

const config = EDGE_TYPE_CONFIG[EdgeType.Supports];

export default function SupportsEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, id, data } = props;
  const edgeData = data as ArgumentEdgeData | undefined;
  const weight = edgeData?.weight as EdgeWeight | undefined;
  const baseStrokeWidth = weight ? EDGE_WEIGHT_CONFIG[weight].strokeWidth : 2;
  const weightLabel = weight ? ` (${EDGE_WEIGHT_CONFIG[weight].label})` : "";

  const highlightedEdgeIds = useArgumentStore((s) => s.highlightedEdgeIds);
  const weakestEdgeId = useArgumentStore((s) => s.weakestEdgeId);
  const isHighlighted = highlightedEdgeIds.has(id);
  const isWeakest = weakestEdgeId === id;

  const strokeWidth = isHighlighted ? baseStrokeWidth + 1.5 : baseStrokeWidth;
  const strokeColor = isWeakest ? "#f59e0b" : config.color;

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
      {isHighlighted && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{ stroke: isWeakest ? "#f59e0b" : config.color, strokeWidth: strokeWidth + 4, opacity: 0.25 }}
        />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: strokeColor, strokeWidth }}
        markerEnd="url(#supports-arrow)"
      />
      <EdgeLabelRenderer>
        <div
          className={`absolute text-[10px] font-medium bg-white/80 dark:bg-gray-800/80 px-1 rounded pointer-events-none nodrag nopan ${isWeakest ? "text-amber-600" : "text-green-600"}`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          Supports{weightLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
