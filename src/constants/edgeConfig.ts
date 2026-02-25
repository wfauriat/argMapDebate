import { EdgeType, EdgeWeight } from "@/types/edges";

export interface EdgeTypeConfig {
  label: string;
  color: string;         // Hex color for stroke
  strokeDasharray?: string;
  animated: boolean;
  markerEndId: string;
  markerStartId?: string;
  labelColorClass: string;
}

export interface EdgeWeightConfig {
  label: string;
  numericValue: number;
  strokeWidth: number;
}

export const EDGE_WEIGHT_CONFIG: Record<EdgeWeight, EdgeWeightConfig> = {
  [EdgeWeight.Strong]: { label: "Strong", numericValue: 3, strokeWidth: 3 },
  [EdgeWeight.Moderate]: { label: "Moderate", numericValue: 2, strokeWidth: 2 },
  [EdgeWeight.Weak]: { label: "Weak", numericValue: 1, strokeWidth: 1.5 },
};

export const EDGE_TYPE_CONFIG: Record<EdgeType, EdgeTypeConfig> = {
  [EdgeType.Supports]: {
    label: "Supports",
    color: "#22c55e",      // green-500
    animated: false,
    markerEndId: "supports-arrow",
    labelColorClass: "text-green-600",
  },
  [EdgeType.Undermines]: {
    label: "Undermines",
    color: "#ef4444",      // red-500
    animated: false,
    markerEndId: "undermines-arrow",
    labelColorClass: "text-red-500",
  },
  [EdgeType.DependsOn]: {
    label: "Depends On",
    color: "#6b7280",      // gray-500
    strokeDasharray: "5 5",
    animated: false,
    markerEndId: "dependson-arrow",
    labelColorClass: "text-gray-500 dark:text-gray-400",
  },
  [EdgeType.Contradicts]: {
    label: "Contradicts",
    color: "#dc2626",      // red-600
    animated: false,
    markerEndId: "contradicts-arrow-end",
    markerStartId: "contradicts-arrow-start",
    labelColorClass: "text-red-600",
  },
};
