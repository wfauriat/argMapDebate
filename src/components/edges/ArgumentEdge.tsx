"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { EDGE_TYPE_CONFIG, EDGE_WEIGHT_CONFIG } from "@/constants/edgeConfig";
import { EdgeType, type ArgumentEdgeData, type EdgeWeight } from "@/types/edges";
import { useHighlightStore } from "@/store/useHighlightStore";

function createArgumentEdge(edgeType: EdgeType) {
  const config = EDGE_TYPE_CONFIG[edgeType];

  return function ArgumentEdgeComponent(props: EdgeProps) {
    const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, id, data } = props;
    const edgeData = data as ArgumentEdgeData | undefined;
    const weight = edgeData?.weight as EdgeWeight | undefined;
    const baseStrokeWidth = weight ? EDGE_WEIGHT_CONFIG[weight].strokeWidth : 2;
    const weightLabel = weight ? ` (${EDGE_WEIGHT_CONFIG[weight].label})` : "";

    // Primitive selectors — only re-render when this edge's highlight status changes
    const isHighlighted = useHighlightStore((s) => s.highlightedEdgeIds.has(id));
    const isWeakest = useHighlightStore((s) => s.weakestEdgeId === id);

    const strokeWidth = isHighlighted ? baseStrokeWidth + 1.5 : baseStrokeWidth;
    const strokeColor = isWeakest ? "#f59e0b" : config.color;

    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
    });

    return (
      <>
        {isHighlighted && (
          <BaseEdge
            id={`${id}-glow`}
            path={edgePath}
            style={{
              stroke: isWeakest ? "#f59e0b" : config.color,
              strokeWidth: strokeWidth + 4,
              opacity: 0.25,
            }}
          />
        )}
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: strokeColor,
            strokeWidth,
            strokeDasharray: config.strokeDasharray,
          }}
          markerEnd={`url(#${config.markerEndId})`}
          markerStart={config.markerStartId ? `url(#${config.markerStartId})` : undefined}
        />
        <EdgeLabelRenderer>
          <div
            className={`absolute text-[10px] font-medium bg-white/80 dark:bg-gray-800/80 px-1 rounded pointer-events-none nodrag nopan ${
              isWeakest ? "text-amber-600" : config.labelColorClass
            }`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {config.label}{weightLabel}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  };
}

export const SupportsEdge = createArgumentEdge(EdgeType.Supports);
export const UnderminesEdge = createArgumentEdge(EdgeType.Undermines);
export const DependsOnEdge = createArgumentEdge(EdgeType.DependsOn);
export const ContradictEdge = createArgumentEdge(EdgeType.Contradicts);
