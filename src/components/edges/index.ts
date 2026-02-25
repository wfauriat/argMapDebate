import type { EdgeTypes } from "@xyflow/react";
import { EdgeType } from "@/types/edges";
import SupportsEdge from "./SupportsEdge";
import UnderminesEdge from "./UnderminesEdge";
import DependsOnEdge from "./DependsOnEdge";
import ContradictEdge from "./ContradictEdge";

export const edgeTypes: EdgeTypes = {
  [EdgeType.Supports]: SupportsEdge,
  [EdgeType.Undermines]: UnderminesEdge,
  [EdgeType.DependsOn]: DependsOnEdge,
  [EdgeType.Contradicts]: ContradictEdge,
};
