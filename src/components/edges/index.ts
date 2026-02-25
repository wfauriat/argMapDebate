import type { EdgeTypes } from "@xyflow/react";
import { EdgeType } from "@/types/edges";
import { SupportsEdge, UnderminesEdge, DependsOnEdge, ContradictEdge } from "./ArgumentEdge";

export const edgeTypes: EdgeTypes = {
  [EdgeType.Supports]: SupportsEdge,
  [EdgeType.Undermines]: UnderminesEdge,
  [EdgeType.DependsOn]: DependsOnEdge,
  [EdgeType.Contradicts]: ContradictEdge,
};
