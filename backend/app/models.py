from enum import Enum

from pydantic import BaseModel, ConfigDict


class NodeType(str, Enum):
    FactualClaim = "FactualClaim"
    CausalClaim = "CausalClaim"
    Value = "Value"
    Assumption = "Assumption"
    Evidence = "Evidence"
    Policy = "Policy"


class EdgeType(str, Enum):
    Supports = "Supports"
    Undermines = "Undermines"
    DependsOn = "DependsOn"
    Contradicts = "Contradicts"


class InferenceNode(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    node_type: NodeType
    label: str
    credence: float | None = None

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=lambda field_name: {
            "node_type": "nodeType",
        }.get(field_name, field_name),
    )


class InferenceEdge(BaseModel):
    id: str
    source: str
    target: str
    edge_type: EdgeType
    strength: float | None = None

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=lambda field_name: {
            "edge_type": "edgeType",
        }.get(field_name, field_name),
    )


class InferencePayload(BaseModel):
    nodes: list[InferenceNode]
    edges: list[InferenceEdge]


class InferenceNodeResult(BaseModel):
    id: str
    posterior: float


class InferenceResult(BaseModel):
    nodes: list[InferenceNodeResult]


class InferenceResponse(BaseModel):
    result: InferenceResult
    warnings: list[str] = []
