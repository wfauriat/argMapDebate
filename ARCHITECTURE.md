# argMapDebate — Architecture & Codebase Guide

A reference for understanding the project structure, how the pieces connect,
and what TypeScript patterns to recognize when reading the code.

---

## Table of Contents

1. [30-Second Overview](#1-30-second-overview)
2. [Repo Layout](#2-repo-layout)
3. [TypeScript Primer for JS Developers](#3-typescript-primer-for-js-developers)
4. [Domain Types — The Data Model](#4-domain-types--the-data-model)
5. [State Management — Zustand Stores](#5-state-management--zustand-stores)
6. [Frontend Component Tree](#6-frontend-component-tree)
7. [React Flow Integration](#7-react-flow-integration)
8. [The Inference Pipeline](#8-the-inference-pipeline)
9. [Structural Analysis Library](#9-structural-analysis-library)
10. [Backend (FastAPI + Python)](#10-backend-fastapi--python)
11. [Utilities & Library Layer](#11-utilities--library-layer)
12. [Testing Strategy](#12-testing-strategy)
13. [Data Flow Diagrams](#13-data-flow-diagrams)

---

## 1. 30-Second Overview

This is an **argument mapping tool** — you draw argument structures as graphs
(nodes are claims/evidence/values, edges are logical relations like "supports"
or "undermines"). Once built, you can run Bayesian inference to propagate
credence values through the graph and see how confident you should be in each
claim given the evidence.

```
Browser (Next.js/React)          Python backend
─────────────────────────        ─────────────────
  Argument graph (canvas)   →    FastAPI POST /infer
  Credence values           →    pgmpy Bayesian Network
  Structural analysis            ← Posteriors returned
  Toast notifications       ←
```

Tech stack:
- **Frontend**: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Zustand, React Flow
- **Backend**: Python 3.12, FastAPI, pgmpy (Bayesian networks), Pydantic v2

---

## 2. Repo Layout

```
argMapDebate/
├── src/                          # All frontend code
│   ├── app/                      # Next.js app router (layout + page)
│   ├── components/               # React UI components
│   │   ├── ArgumentMapper.tsx    # Root app component
│   │   ├── ToastContainer.tsx    # Global notification overlay
│   │   ├── canvas/               # The React Flow canvas
│   │   ├── nodes/                # 6 custom node renderers
│   │   ├── edges/                # Custom edge renderer
│   │   ├── panels/               # Sidebar panels and toolbar
│   │   └── controls/             # Reusable form controls
│   ├── store/                    # Zustand state stores (5 total)
│   ├── types/                    # TypeScript type definitions
│   ├── lib/                      # Pure utility functions
│   ├── analysis/                 # Graph analysis algorithms
│   ├── templates/                # Argumentation scheme templates
│   └── constants/                # Static config objects
├── backend/                      # Python FastAPI service
│   ├── app/
│   │   ├── main.py               # FastAPI app + CORS
│   │   ├── models.py             # Pydantic request/response models
│   │   ├── inference.py          # POST /infer endpoint
│   │   └── bn_builder.py         # Bayesian Network construction
│   └── tests/                    # pytest test suite
├── public/example-maps/          # 4 pre-built JSON argument maps
├── package.json                  # npm scripts (dev, dev:full, test, test:all)
└── pyproject.toml                # Python deps + pytest config
```

**Key npm scripts:**
```bash
npm run dev          # Next.js only (port 3000)
npm run dev:full     # Next.js + FastAPI backend together
npm run test         # Vitest (frontend tests only)
npm run test:all     # Vitest + pytest in parallel
```

---

## 3. TypeScript Primer for JS Developers

TypeScript is JS with type annotations. Here's what you'll encounter:

### Interfaces — named shapes for objects
```ts
// Vanilla JS: just an object, no guarantee of shape
const edge = { id: "e1", source: "a", target: "b" };

// TS: describe the shape explicitly
interface ArgumentEdgeData {
  edgeType: EdgeType;     // must be one of the enum values
  notes: string;
  weight?: EdgeWeight;    // ? means optional (may be undefined)
  strength?: number | null;  // number OR null
}
```

### Enums — named constants
```ts
// Instead of magic strings:
enum EdgeType {
  Supports = "Supports",   // EdgeType.Supports === "Supports"
  Undermines = "Undermines",
  DependsOn = "DependsOn",
  Contradicts = "Contradicts",
}
```
You'll see `EdgeType.Supports` throughout — it's just the string `"Supports"`.

### Union types — "one of these"
```ts
// ArgumentNodeData can be any of these 6 shapes
type ArgumentNodeData =
  | FactualClaimData
  | CausalClaimData
  | ValueData
  | AssumptionData
  | EvidenceData
  | PolicyData;
```
The `|` operator means OR. When you see `node.data as ArgumentNodeData`, TypeScript
is reminding you the data field holds one of those types.

### Generics — parameterised types
```ts
// Node<T> from React Flow means "a node whose .data is of type T"
type ArgumentNode = Node<ArgumentNodeData, string>;
//                       ^^^^^^^^^^^^^^^^  ^^^^^^
//                       data type         node type tag
```
Generics are like function parameters but for types.

### `type` vs `interface`
Both describe object shapes. `interface` is slightly more common for objects
you'll `extend`; `type` is used for unions and aliases. For reading purposes
they behave the same.

### `import type`
```ts
import type { ArgumentNode } from "@/types/nodes";
```
The `type` keyword tells TS this import is erased at runtime — it's compile-time
only. You can't call `import type`-ed values at runtime.

### `@/` path alias
```ts
import { useArgumentStore } from "@/store/useArgumentStore";
```
`@/` is an alias for `./src/`. Configured in `tsconfig.json`. Avoids
`../../../../` relative paths.

### Non-null assertion `!`
```ts
edge.data!.edgeType   // "I know edge.data is not null, trust me"
```
The `!` tells TypeScript to stop warning about potential null. Look for these
when reading — they're promises the developer made.

### `as` casting
```ts
const d = data as unknown as EvidenceData;
```
"Treat this value as type EvidenceData." Used in node components because React
Flow's generic typing doesn't flow all the way through. Safe here because we
control what data we put in.

---

## 4. Domain Types — The Data Model

All domain types live in `src/types/`. These are the core "nouns" of the app.

### Nodes (`src/types/nodes.ts`)

Each node has a **type** (what kind of claim it is) and **data** (the payload).

```
ArgumentNode  (from React Flow's Node<T>)
  .id         string
  .type       NodeType  (FactualClaim | CausalClaim | Value | Assumption | Evidence | Policy)
  .position   { x, y }  (canvas position in pixels)
  .data       ArgumentNodeData  (union of 6 specific shapes — see below)
```

Every node data shape shares a **BaseNodeData** base:
```
BaseNodeData
  .label      string         — the text shown on the card
  .notes      string         — free-text notes
  .status     NodeStatus     — Supported | Contested | Unsupported (auto-computed)
  .credence   number | null  — user-set prior belief (0–1), null = not set
  .posterior  number | null  — computed by inference, null = not run yet
```

Then each type adds its own fields:
```
EvidenceData  extends BaseNodeData
  .sourceType   "study" | "statistic" | "testimony" | "observation" | "other"
  .citation     string
  .url          string

AssumptionData  extends BaseNodeData
  .isExplicit   boolean
  .isLoadBearing  boolean   — set by recomputeStatuses()

PolicyData  extends BaseNodeData
  .scope        string

FactualClaimData  extends BaseNodeData
  .sources      string[]

CausalClaimData  extends BaseNodeData
  .mechanism    string
  .sources      string[]
```

### Edges (`src/types/edges.ts`)

```
ArgumentEdge  (from React Flow's Edge<T>)
  .id         string
  .source     string   — source node id
  .target     string   — target node id
  .data       ArgumentEdgeData
    .edgeType   EdgeType   (Supports | Undermines | DependsOn | Contradicts)
    .notes      string
    .weight     EdgeWeight?  (Strong | Moderate | Weak) — categorical
    .strength   number | null  — numeric influence (0–1), used by inference
```

**Semantic meaning of edge types:**
- `Supports`: source claim provides positive evidence for target claim
- `Undermines`: source weakens or questions target claim
- `DependsOn`: target claim logically requires source to hold
- `Contradicts`: source and target are in direct logical conflict (bidirectional)

### Graph (`src/types/graph.ts`)

The serialisable top-level container:
```
ArgumentGraph
  .title        string
  .description  string
  .nodes        ArgumentNode[]
  .edges        ArgumentEdge[]
```
This is exactly what gets written to JSON on export and read on import.

### Inference types (`src/types/inference.ts`)

A **stripped-down** version of the graph for sending to the backend
(only inference-relevant fields, no UI state):
```
InferencePayload
  .nodes  InferenceNode[]   { id, nodeType, label, credence }
  .edges  InferenceEdge[]   { id, source, target, edgeType, strength }

InferenceResult
  .nodes  InferenceNodeResult[]   { id, posterior }
```

---

## 5. State Management — Zustand Stores

Zustand is a minimal state library. The pattern throughout:

```ts
// Define state shape + actions in one object
export const useFooStore = create<FooState>((set, get) => ({
  // state
  value: 0,
  // action
  increment: () => set({ value: get().value + 1 }),
}));

// In a component, subscribe to a slice
const value = useFooStore((s) => s.value);  // re-renders only when value changes
```

There are **5 stores**:

### `useArgumentStore` (`src/store/useArgumentStore.ts`) — the main store

Owns the graph data. Everything else reads from here.

```
State:
  nodes         ArgumentNode[]
  edges         ArgumentEdge[]
  graphTitle    string
  graphDescription  string
  viewport      { x, y, zoom }
  layoutTrigger number  (incremented to signal "run fitView")

Key actions:
  addNode(type, position)     — create a new node
  updateNodeData(id, partial) — patch a node's data fields
  deleteNode(id)              — remove node + its edges
  addEdge(src, tgt, type)     — create a new edge
  updateEdgeType/Notes/Weight/Strength(id, value)
  deleteEdge(id)
  loadGraph(graph)            — replace entire state
  clearGraph()                — reset to blank
  autoLayout(direction)       — run Dagre layout
  scheduleRecompute()         — debounced via queueMicrotask
  recomputeStatuses()         — update NodeStatus for all nodes
```

**Auto-clearing posteriors:** whenever the graph structure or inference inputs
change (credence, edge strength, add/delete edges, delete node), all `posterior`
values are nulled out via the `clearPosteriors()` helper. This prevents stale
inference results from being shown.

**Status recomputation** runs after every structural change (debounced):
- node has incoming Supports edges only → `Supported`
- node has both Supports and Undermines → `Contested`
- node has neither → `Unsupported`

**React Flow integration:** The store exposes `onNodesChange`, `onEdgesChange`,
and `onConnect` — callbacks React Flow calls when the user drags, resizes, or
connects nodes on the canvas. They call React Flow's `applyNodeChanges` /
`applyEdgeChanges` helpers, which know how to merge drag-position updates etc.

### `useSelectionStore` (`src/store/useSelectionStore.ts`)

Single selected node or edge. Selecting a node clears any selected edge and vice versa.

```
State:
  selectedNodeId  string | null
  selectedEdgeId  string | null

Actions:
  selectNode(id)
  selectEdge(id)
```

### `useHighlightStore` (`src/store/useHighlightStore.ts`)

Used by the Analysis panel's "Show weakest link" feature to highlight a
set of nodes and edges on the canvas.

```
State:
  highlightedNodeIds  Set<string>
  highlightedEdgeIds  Set<string>
  weakestEdgeId       string | null  — shown in amber
  weakestNodeId       string | null  — shown in red

Actions:
  setHighlights(nodeIds, edgeIds, weakestEdgeId?, weakestNodeId?)
  clearHighlights()
```

### `useThemeStore` (`src/store/useThemeStore.ts`)

Light/dark mode toggle. Persists to `localStorage` and applies a `dark` CSS
class to `<html>` (Tailwind dark mode convention).

```
State:
  theme   "light" | "dark"

Actions:
  toggleTheme()
  hydrate()     — called on mount to load saved preference
```

### `useToastStore` (`src/store/useToastStore.ts`)

Global notification queue with auto-dismiss timers.

```
State:
  toasts  Toast[]   { id, level, message }
  // level: "error" | "warning" | "success" | "info"

Actions:
  addToast(level, message)   — adds toast, schedules auto-dismiss
    // error 8s, warning 5s, success 3s, info 4s
  removeToast(id)            — manual dismiss
```

---

## 6. Frontend Component Tree

```
app/layout.tsx           — HTML shell, fonts
app/page.tsx             — renders <ArgumentMapper />

ArgumentMapper.tsx       — root component; sets up layout + theme hydration
  ├── Toolbar.tsx         — top bar; node creation, file I/O, templates, buttons
  │   ├── AIGenerateButton.tsx   — opens AI generation modal
  │   │   └── AIGenerateModal.tsx
  │   ├── InferenceButton.tsx    — run Bayesian inference
  │   └── WizardButton.tsx       — opens guided build modal
  │       └── WizardModal.tsx
  ├── ArgumentCanvas.tsx  — the React Flow canvas (see §7)
  │   ├── [node types]    — rendered by React Flow based on node.type
  │   └── [edge types]    — rendered by React Flow based on edge.type
  ├── Sidebar             — (inline in ArgumentMapper.tsx)
  │   ├── NodeEditor.tsx  — inspector for selected node
  │   ├── EdgeEditor.tsx  — inspector for selected edge
  │   └── AnalysisPanel.tsx  — graph statistics and analysis
  └── ToastContainer.tsx  — fixed overlay, renders useToastStore.toasts
```

### Node components (`src/components/nodes/`)

There are 6 node type components:
`FactualClaimNode`, `CausalClaimNode`, `ValueNode`, `AssumptionNode`,
`EvidenceNode`, `PolicyNode`.

They all follow the same thin pattern:
```tsx
function EvidenceNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as EvidenceData;  // cast React Flow's generic data
  return (
    <BaseNode nodeId={id} nodeType={NodeType.Evidence} label={d.label}
              status={d.status} credence={d.credence} posterior={d.posterior}
              selected={selected}>
      {/* type-specific content, e.g. sourceType badge */}
    </BaseNode>
  );
}
export default memo(EvidenceNode);  // memo = skip re-render if props unchanged
```

`BaseNode` renders the common card shell:
- **Header**: colored bar with icon, type label, status badge
- **Body**: label text + `{children}` (the type-specific content above)
- **Footer** (when credence/posterior set): "Prior: 0.70 → Post: 0.42" + progress bar
- **Highlight rings**: blue (selected), amber (chain highlight), red (weakest node)
- **Handles**: React Flow connection points at top and bottom

### `ArgumentCanvas.tsx`

Thin wrapper around `<ReactFlow>`. Responsibilities:
1. Feeds `nodes` and `edges` from `useArgumentStore`
2. Forwards React Flow change callbacks (`onNodesChange`, `onEdgesChange`, `onConnect`)
   back into the store
3. Maps click events to `useSelectionStore.selectNode/Edge`
4. Defines SVG `<marker>` elements for custom arrowheads per edge type
5. Triggers `fitView` when `layoutTrigger` increments (after auto-layout)

---

## 7. React Flow Integration

React Flow is the graph visualisation library (`@xyflow/react`).

**Key concepts:**
- React Flow owns the render loop; you supply `nodes` and `edges` arrays
- It calls `onNodesChange` with *change descriptors* (not the full new array)
  when nodes are dragged, selected, or deleted. The store's `applyNodeChanges`
  merges these deltas into the existing array.
- Custom node/edge types are registered in `src/components/nodes/index.ts`
  and `src/components/edges/index.ts` as plain objects:
  ```ts
  export const nodeTypes = {
    FactualClaim: FactualClaimNode,
    Evidence: EvidenceNode,
    // ...
  };
  ```
  React Flow looks up the right component via `node.type`.

**The "two sources of truth" tension:**
React Flow maintains its own internal state for things like position and
selection. The store mirrors this via the change callback pattern. In practice:
- Node positions from dragging flow: React Flow → `onNodesChange` → store
- Content changes flow: user edits in NodeEditor → `updateNodeData` → store → React Flow re-renders

---

## 8. The Inference Pipeline

The full inference flow touches several files. Here's the journey:

```
User clicks "Run Inference"
        │
        ▼
InferenceButton.tsx
  buildInferencePayload(nodes, edges)
        │   strips UI-only fields (status, notes, position…)
        │   keeps: id, nodeType, label, credence, strength
        ▼
runInference(payload, settings, signal)   ← inferenceApi.ts
  POST /infer  (JSON body)
        │
        │  HTTP
        ▼
backend/app/inference.py
  run_inference(payload)                  ← bn_builder.py
    1. Map argument edges → BN directed edges
       Supports/Undermines/Contradicts: source → target
       DependsOn: reversed (target → source)
    2. Detect cycles → remove weakest edge, add warning
    3. Build pgmpy BayesianNetwork + CPDs (log-odds model)
    4. Run VariableElimination
    5. Return { result: { nodes: [{id, posterior}...] }, warnings: [...] }
        │
        │  HTTP response
        ▼
InferenceButton.tsx
  for each nodeResult: updateNodeData(id, { posterior })
        │
        ▼
useArgumentStore → nodes updated with new posteriors
        │
        ▼
React re-renders node cards with "Post: X.XX" footer
```

### The CPD log-odds model (key backend algorithm)

Each node is a binary variable (True/False). The probability it is True
given its parents is computed as:

```
base = logit(credence ?? 0.5)   ← convert probability to log-odds

for each parent:
  if Supports and parent=True:    base += strength × 1.2
  if Supports and parent=False:   base -= strength × 0.3   (mild absence penalty)
  if Undermines and parent=True:  base -= strength × 1.2
  if Undermines and parent=False: base += strength × 0.3
  if DependsOn and parent=False:  base -= strength × 2.0   (hard dependency)
  if Contradicts and parent=True: base -= strength × 1.2

posterior = sigmoid(base)        ← convert log-odds back to probability
```

Scale factors were empirically tuned: `SUPPORT/UNDERMINE/CONTRADICT_SCALE=1.2`,
`DEPENDS_SCALE=2.0`, `ABSENCE_PENALTY_FACTOR=0.25`.

### Auto-clearing

After inference runs, posteriors are stored on nodes. If **anything
structurally relevant changes** (add/delete nodes, add/delete edges, change
edge type or strength, change a node's credence), all posteriors are
immediately nulled out. This is enforced in `useArgumentStore` by the
`clearPosteriors()` helper called from each mutation.

---

## 9. Structural Analysis Library

`src/analysis/structuralAnalysis.ts` — pure functions, no React, no stores.
All take `(nodes, edges)` and return results. Called via `useMemo` in
`AnalysisPanel.tsx`.

### `getUnsupportedClaims(nodes, edges)`
Returns claim nodes (FactualClaim, CausalClaim, Policy) that have no incoming
Supports edges. These are claims with no evidential backing.

### `getIsolatedNodes(nodes, edges)`
Returns nodes connected to no edges at all.

### `getGraphStats(nodes, edges)`
Returns counts by type, total nodes/edges, and maximum support chain depth
(the longest path following only Supports edges).

### `getLoadBearingAssumptions(nodes, edges)`
BFS from each Assumption node, following:
- Supports edges forward (source to target)
- DependsOn edges backward (target to source)

Counts how many nodes downstream would be affected if this assumption failed.
Returned sorted by `downstreamCount` descending.

Also used inside `useArgumentStore.recomputeStatuses()` to set the
`isLoadBearing` flag on Assumption nodes.

### `getSensitivityAnalysis(nodes, edges)`
Finds the longest support chain (DFS over Supports edges) then identifies the
weakest link within it. The weakest link is whichever element — a node (by
credence) or an edge (by `strength` number, or categorical `weight` mapped to
0–1) — has the lowest effective confidence. Returns:

```ts
{
  chainNodeIds: string[]       // the full chain
  chainEdgeIds: string[]
  weakestLink: {
    kind: "node" | "edge"
    id: string
    effectiveStrength: number  // 0–1
    reason: string             // e.g. "credence 0.10" or "strength 0.30 (Weak)"
  }
  chainLength: number
}
```

---

## 10. Backend (FastAPI + Python)

The backend is a **stateless microservice** — it receives a graph, runs
inference, returns posteriors. No database, no session.

### `backend/app/models.py`

Pydantic v2 models. They mirror the TypeScript `InferencePayload` types with
camelCase ↔ snake_case field aliases (so `nodeType` in JSON becomes
`node_type` in Python).

```python
class InferenceNode(BaseModel):
    id: str
    node_type: NodeType     # field; JSON alias is "nodeType"
    label: str
    credence: float | None = None
```

### `backend/app/bn_builder.py` — the core algorithm

Key steps in `run_inference(payload)`:

1. **Filter edges** to those connecting existing nodes
2. **Map to BN edges** — reverse DependsOn direction
3. **Break cycles** — DFS, remove weakest edge repeatedly until DAG
4. **Build CPDs** — for each node, compute the conditional probability table
   using the log-odds model described in §8
5. **Run VariableElimination** (pgmpy) to propagate beliefs
6. Return posteriors rounded to 6 decimal places

Constants to be aware of:
```python
SUPPORT_SCALE = 1.2
UNDERMINE_SCALE = 1.2
DEPENDS_SCALE = 2.0
CONTRADICT_SCALE = 1.2
ABSENCE_PENALTY_FACTOR = 0.25  # how much a False parent nudges in reverse
MAX_PARENTS = 15               # CPD has 2^k columns — hard limit
```

### `backend/app/inference.py`

Single endpoint:
```
POST /infer
  Body:  InferencePayload  (JSON)
  Returns: InferenceResponse  { result: {nodes: [{id, posterior}...]}, warnings: [...] }
  Errors:  422 ValueError, 500 runtime
```

### `backend/app/main.py`

FastAPI app with CORS configured to allow `http://localhost:3000`.
Also has `GET /health` → `{"status": "ok"}`.

---

## 11. Utilities & Library Layer

### `src/lib/serialization.ts`
`exportGraph(graph)` → JSON string.
`importGraph(json)` → validates structure, normalises `credence`/`posterior`/
`strength` to `[0,1]` (clamps out-of-range values, converts null/undefined
consistently).

### `src/lib/inferenceExport.ts`
Two pure functions:
- `buildInferencePayload(nodes, edges)` — strips UI fields, builds lean payload
- `applyInferenceResult(nodes, result)` — returns new nodes array with posteriors
  set (does not mutate). Not actually used by InferenceButton (which calls
  `updateNodeData` per-node instead) but tested independently.

### `src/lib/inferenceApi.ts`
HTTP client for the backend. Handles:
- Trailing-slash normalisation on backend URL
- Network errors → human-readable "make sure backend is running" message
- AbortError → rethrown as-is (caller checks `err.name === "AbortError"`)
- Non-OK responses → extracts `detail` from JSON body if available
- `loadInferenceSettings() / saveInferenceSettings()` → `localStorage`

### `src/lib/nodeDefaults.ts`
Factory function `createNodeData(type)` → returns the default data object
for each node type. Called by `useArgumentStore.addNode`.

### `src/lib/layoutEngine.ts`
`layoutGraph(nodes, edges, direction)` — wraps the Dagre library to compute
hierarchical node positions. Direction is `"TB"` (top-to-bottom) or `"LR"`.
Returns a new nodes array with updated positions.

### `src/lib/wizardBuilder.ts`
Converts the 5-step wizard form data into an `ArgumentGraph`. Handles
positioning of nodes in a sensible layout.

### `src/lib/exampleMaps.ts`
`loadExampleMap(name)` → fetches from `/public/example-maps/{name}.json`.
`EXAMPLE_MAPS` is the list of available maps.

### `src/templates/`
- `argumentSchemes.ts` — 3 templates: From Consequences, From Expert Opinion,
  From Analogy. Each defines a pattern of nodes and edges with placeholder labels.
- `instantiateScheme.ts` — converts a scheme template into a positioned
  `ArgumentGraph` ready to load.

### `src/constants/`
- `nodeConfig.ts` — visual config per NodeType: icon, label, border/bg/text colours
- `edgeConfig.ts` — visual config per EdgeType (stroke colour, animated, arrow id)
  and per EdgeWeight (label, numeric value 1–3, stroke width)

---

## 12. Testing Strategy

### Frontend — Vitest

Run with `npm test`. 146 tests across 12 files.

Tests live next to the code in `__tests__/` subdirectories.
No React component rendering tests — all tests cover **pure logic**:
store mutations, utility functions, analysis algorithms.

Pattern:
```ts
describe("getLoadBearingAssumptions", () => {
  it("returns empty when no assumptions", () => {
    expect(getLoadBearingAssumptions([], [])).toEqual([]);
  });
});
```

Files:
```
src/store/__tests__/useArgumentStore.test.ts   — CRUD, posteriors, status recompute
src/store/__tests__/useSelectionStore.test.ts
src/store/__tests__/useHighlightStore.test.ts
src/store/__tests__/useToastStore.test.ts      — auto-dismiss timers (fake timers)
src/analysis/__tests__/structuralAnalysis.test.ts
src/lib/__tests__/inferenceApi.test.ts         — mock fetch, error handling
src/lib/__tests__/inferenceExport.test.ts
src/lib/__tests__/serialization.test.ts
src/lib/__tests__/nodeDefaults.test.ts
src/lib/__tests__/wizardBuilder.test.ts
src/templates/__tests__/instantiateScheme.test.ts
src/types/__tests__/inference.test.ts
```

### Backend — pytest

Run with `cd backend && .venv/bin/pytest`. 65 tests across 4 files.

```
tests/test_models.py              — Pydantic parsing, camelCase aliases
tests/test_bn_builder.py          — logit/sigmoid, CPD construction, inference
tests/test_inference.py           — FastAPI TestClient endpoint tests
tests/test_integration_carbon_tax.py  — end-to-end with real carbon-tax.json
```

---

## 13. Data Flow Diagrams

### User edits a node label

```
NodeEditor input onChange
  → useArgumentStore.updateNodeData(id, { label: "new text" })
    → set({ nodes: nodes.map(n => n.id === id ? {...n, data: {...n.data, label}} : n) })
      → React re-renders ArgumentCanvas with new nodes prop
        → React Flow re-renders that node component
          → BaseNode renders the new label
```

### User connects two nodes on canvas

```
User drags from node A's bottom handle to node B's top handle
  → React Flow fires onConnect({ source: "A", target: "B", ... })
    → useArgumentStore.onConnect(connection)
      → clearPosteriors(nodes)       // stale posteriors nulled
      → new edge added to edges[]
      → scheduleRecompute()
        → queueMicrotask(() => recomputeStatuses())
          → edges.filter(e => e.target === nodeB.id)
          → nodeB gains Supports edge → status becomes "Supported"
          → set({ nodes: updatedNodes })
```

### Running inference

```
Click "Run Inference"
  → InferenceButton.handleRun()
    → buildInferencePayload(nodes, edges)  // strip UI fields
    → fetch POST http://localhost:8000/infer
        → bn_builder.run_inference(payload)
            → acyclic BN constructed
            → VariableElimination run
            → posteriors returned
    → for each {id, posterior}: updateNodeData(id, { posterior })
        → clearPosteriors NOT triggered (posterior key in partial, not credence)
    → addToast("success", "Inference complete — 16 posteriors updated.")
```

### Analysis panel weakest link

```
AnalysisPanel useMemo → getSensitivityAnalysis(nodes, edges)
  → DFS finds longest Supports chain
  → compares all edges (by strength/weight) and nodes (by credence) in chain
  → returns weakestLink { kind, id, effectiveStrength, reason }

Click "Show weakest link"
  → setHighlights(chainNodeIds, chainEdgeIds, weakestEdgeId, weakestNodeId)
    → useHighlightStore state updated

React re-renders affected nodes/edges:
  BaseNode: isWeakest = weakestNodeId === this.id  → red ring
  ArgumentEdge: isWeakest = weakestEdgeId === this.id → amber stroke
```

---

*Document generated alongside the codebase at commit `6c9483a` and onwards.*
