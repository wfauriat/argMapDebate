# Strategic Plan: Argument Mapping Tool for Policy and Political Debate

## 1. Project Vision

An interactive web application that allows users to map the structure of complex arguments — claims, evidence, assumptions, objections, value judgments — as a visual graph, making explicit what is usually implicit in debate. The tool helps users see *where* disagreements actually live: is it a factual dispute, a causal claim, a value difference, or a framing choice?

**Key distinction from the Bayesian engine project**: The primary value here is *structural clarity*, not numerical inference. The tool's purpose is to make reasoning visible, not to compute "correct" conclusions.

**Portfolio thesis**: "Complex decisions fail not because people lack information, but because the structure of the argument — what depends on what, where the real disagreements are — is invisible. This tool makes it visible."

---

## 2. Theoretical Foundations

### 2.1 Argument mapping traditions

Several intellectual traditions have addressed the problem of structuring arguments. Understanding them helps scope the tool and avoid reinventing existing work.

**Toulmin model (1958)**

Stephen Toulmin proposed that arguments have six components:

- **Claim**: The conclusion being argued for
- **Data/Grounds**: The evidence or facts supporting it
- **Warrant**: The reasoning principle connecting data to claim ("because...")
- **Backing**: Support for the warrant itself
- **Qualifier**: The degree of certainty ("probably," "unless...")
- **Rebuttal**: Conditions under which the claim doesn't hold

This model is influential because it distinguishes the *logical role* of each element. A claim is not just "a node" — it's a node with a specific function in the argument. The warrant (the reasoning step) is often the most vulnerable part and the most invisible.

**Relevance to the tool**: Toulmin gives you a node ontology — not just "claim" and "evidence" but distinct roles. The qualifier is where uncertainty lives. The rebuttal is where the frame problem manifests.

**Walton's argumentation schemes (1996, 2008)**

Douglas Walton cataloged recurring patterns of argument — "argumentation schemes" — each with associated *critical questions*. Examples:

- **Argument from expert opinion**: X is an expert in domain D; X says P; therefore P. Critical questions: Is X really an expert? Is D the relevant domain? Do other experts agree?
- **Argument from analogy**: Case A is like case B; in case A, X holds; therefore X holds in B. Critical questions: Are A and B relevantly similar? What are the differences?
- **Argument from consequences**: Action A leads to consequence C; C is bad/good; therefore don't/do A. Critical questions: Will A really lead to C? Are there other consequences? How certain is the causal link?

Walton identified ~60 schemes. Each one is essentially a template with built-in vulnerabilities.

**Relevance to the tool**: Schemes could serve as *templates* — the user selects "argument from expert opinion" and the tool generates the structure with pre-loaded critical questions. This dramatically reduces the blank-page problem.

**IBIS — Issue-Based Information System (Rittel & Webber, 1970)**

Developed for "wicked problems" — problems where the formulation is itself contested. IBIS has three node types:

- **Issue**: A question to be resolved
- **Position**: A possible answer to the issue
- **Argument**: A reason for or against a position

Simple, but powerful for deliberation. The tool Compendium (Open University, now discontinued) was built on IBIS. The modern tool **Deliberatorium** (MIT) extends it.

**Relevance to the tool**: IBIS is the simplest viable model. If you want to ship something fast, IBIS + a few extensions might be the right starting point rather than full Toulmin.

**Wigmore charts (1913, revived by Anderson & Twining, 1991)**

Originally developed for legal evidence analysis. Wigmore charts map the chain from individual pieces of evidence up to ultimate conclusions (e.g., guilty/not guilty), with explicit notation for corroborative, contradictory, and explanatory relationships.

Modern work by Fenton, Neil, and Lagnado has connected Wigmore-style charts to Bayesian networks — essentially asking: can we put probabilities on the arrows in a legal evidence map?

**Relevance to the tool**: Wigmore is the tradition closest to bridging argument mapping and Bayesian inference. If you ever want to add a probabilistic layer to the argument mapper, this is the theoretical bridge. See: Fenton, Neil & Lagnado, "A General Structure for Legal Arguments About Evidence Using Bayesian Networks" (2013).

**Bayesian argumentation (Hahn & Oaksford, 2007)**

Ulrike Hahn and Mike Oaksford argued that many informal logical "fallacies" (argument from ignorance, circular argument, slippery slope) are actually *probabilistically reasonable* depending on prior probabilities. They proposed evaluating argument strength using Bayesian updating.

**Relevance to the tool**: This is the most rigorous attempt to quantify argument strength. But it requires probability assignments, which brings back all the difficulties discussed in Section 4.

### 2.2 Existing tools and what they do

| Tool | Model | Probabilistic? | Status | Notes |
|------|-------|----------------|--------|-------|
| **Kialo** | Pro/con tree | No | Active, commercial | Popular for education and debate. Clean UI. No formal argument structure. |
| **Rationale** | Toulmin-inspired | No | Active, commercial | Developed by Tim van Gelder (U Melbourne). Reasoning mapping for education. |
| **Compendium** | IBIS | No | Discontinued | Open University. Desktop Java app. Influential but dead. |
| **Argdown** | Argument map (text-based) | No | Active, open source | Markdown-like syntax for argument maps. Renders to SVG. Developer-oriented. |
| **Deliberatorium** | Extended IBIS | No | Research prototype (MIT) | Adds metrics for argument quality. |
| **Carneades** | Argumentation framework | Partial (proof standards) | Research prototype | Implements "proof standards" (preponderance, clear and convincing, beyond reasonable doubt) — a lightweight alternative to full Bayesian. |
| **GeNIe / SMILE** | Bayesian network | Yes | Active, academic license | Full BN editor and inference engine. Not designed for argument mapping. |
| **Norsys Netica** | Bayesian network | Yes | Active, commercial | Similar to GeNIe. Engineering/medical focus. |

**Key observation**: There is a clear gap. Argument mapping tools have no probabilistic layer. Bayesian network tools have no argument structure. The theoretical work bridging them (Fenton, Hahn) has not produced widely-used interactive tools.

**Whether to fill that gap**: This is a genuine opportunity, but also a warning — the gap may exist because the bridge is harder than it looks. Existing tools chose one side for good reasons.

---

## 3. Key Difficulties

### 3.1 Node ontology: What is a node?

In a Bayesian network, a node is a random variable with a defined state space. In an argument map, a "node" can be:

- A factual claim ("unemployment is at 4%")
- A causal claim ("minimum wage increases cause unemployment")
- A value judgment ("individual liberty outweighs collective welfare")
- A definition ("by 'poverty' we mean living below $X/day")
- A policy proposal ("we should raise the minimum wage")
- An observation ("in country X, policy Y led to outcome Z")
- A methodological assumption ("we trust this study's methodology")

These are categorically different. Factual claims can (in principle) be verified. Causal claims can be tested but require assumptions. Value judgments cannot be true or false — they reflect priorities. Definitions are stipulative.

**Design decision**: The tool needs a *typed* node system. Users must classify what kind of node they're creating. The types determine what operations make sense (you can assign probability to a factual claim; you can assign importance or weight to a value; you cannot meaningfully assign probability to a definition).

**Suggested minimal node types for v1**:

| Type | Example | Can have probability? | Can have importance/weight? |
|------|---------|----------------------|---------------------------|
| Claim (factual) | "Crime rates dropped after policy X" | Yes | No |
| Claim (causal) | "Policy X caused the drop in crime" | Yes (conditional) | No |
| Value | "Public safety matters more than privacy" | No | Yes (subjective weight) |
| Assumption | "The data from country Y is comparable" | Yes (confidence level) | No |
| Policy/Action | "We should implement policy X" | No (it's a choice, not a belief) | No |
| Evidence | "Study Z found effect size of 0.3" | Reliability assessment | No |

### 3.2 Edge semantics: What does a connection mean?

In a Bayesian network, edges mean probabilistic dependence. In argument mapping, connections are richer:

- **Supports**: A provides reason to believe B
- **Undermines**: A provides reason to doubt B
- **Rebuts**: A attacks the *connection* between C and B (not B itself)
- **Depends on**: B is only relevant if A holds
- **Refines**: A makes B more specific
- **Contradicts**: A and B cannot both hold

**Design decision**: Support a small, defined set of edge types with clear visual encoding (e.g., green = supports, red = undermines, dashed = depends-on). Resist the temptation to allow arbitrary edge labels — it destroys the ability to reason over the graph programmatically.

**Suggested minimal edge types for v1**:

| Edge type | Visual | Meaning |
|-----------|--------|---------|
| Supports | Green solid arrow | A gives reason to believe B |
| Undermines | Red solid arrow | A gives reason to doubt B |
| Depends on | Gray dashed arrow | B is only relevant if A holds |
| Contradicts | Red double-headed | A and B are mutually exclusive |

### 3.3 The quantification problem

The central tension: should the tool assign numbers to argument strength?

**Arguments for**:
- Forces precision in reasoning
- Enables computation (propagation, sensitivity analysis)
- Distinguishes "slightly supports" from "strongly supports"

**Arguments against**:
- Numbers imply false precision on inherently qualitative judgments
- People argue about the numbers instead of the structure
- Bayesian updating requires priors, which are subjective and contested
- The tool risks becoming a confirmation engine (garbage in, garbage out, but with a veneer of rigor)

**Proposed approach — tiered quantification**:

| Level | What the user specifies | What the tool computes |
|-------|------------------------|----------------------|
| **Qualitative only** | Node types + edge types | Structural analysis: which claims are unsupported? Which have strong opposition? Which assumptions are load-bearing? |
| **Ordinal weights** | "Strong / moderate / weak" support or undermining | Rough sensitivity: "this conclusion depends heavily on assumption X" |
| **Subjective probabilities** | User assigns credence (0-1) to factual/causal claims | Bayesian propagation (for the probabilistic sub-network only) |

Let the user choose their level. The qualitative level should be fully functional and useful on its own. Probabilities are an optional power-user feature, not a requirement.

### 3.4 Contested structure, not just contested priors

In policy debate, different people don't just disagree about numbers — they disagree about *what's connected to what*. One person's map includes "immigration → crime" as an edge. Another person omits it entirely.

**This is actually an opportunity, not just a problem.** The tool's most powerful use case might be: two people build their own maps of the same issue, and the tool highlights structural differences — "You think A causes B; they don't include that link at all. You both agree on C, but weight it differently."

**Feature idea (v2+)**: Side-by-side comparison of two argument maps on the same topic, with automated diff highlighting.

### 3.5 The boundary problem

Political issues connect to everything. "Should we build more nuclear power plants?" touches energy economics, climate science, nuclear safety, public perception, waste storage, geopolitics, opportunity costs, and ethics. Where does the map stop?

**Design decision**: The tool should support *scoping* — an explicit boundary node or frame declaration: "For this analysis, we are considering X, Y, Z as relevant factors. The following are explicitly out of scope: ..." Making the frame visible is itself a contribution, consistent with the speech's thesis.

### 3.6 The blank-page problem

A general-purpose argument mapper is intimidating. The user opens the tool and sees... an empty canvas. Now what?

**Solutions**:
- **Templates**: Pre-built argument structures for common debate patterns (based on Walton's schemes). "Start from: argument from consequences" → tool generates the skeleton.
- **Guided construction**: Wizard-style flow. "What is the main claim? What evidence supports it? What could undermine it?"
- **Example maps**: Pre-loaded examples the user can explore and modify.
- **LLM-assisted construction (stretch goal)**: Paste a policy text or article → LLM extracts claims, evidence, assumptions, and proposes a structure for the user to review and edit. This is where LLM capability becomes genuinely useful — not as a reasoner, but as a structurer.

---

## 4. Technical Architecture

### Overview

```
┌──────────────────────────────┐
│   Frontend (React)           │
│   React Flow (graph canvas)  │
│   Typed node components      │
│   Edge type selectors        │
│   Analysis panels            │
│          │  REST / WebSocket  │
│          ▼                    │
│   Backend (Python / FastAPI)  │
│   Graph analysis              │
│   Optional: probabilistic     │
│   inference (pgmpy) for       │
│   quantified sub-networks     │
│   Storage (SQLite / JSON)     │
└──────────────────────────────┘
```

### Why a backend at all?

For a purely qualitative argument mapper, you *could* build everything client-side. The graph is just data; structural analysis (find unsupported claims, find isolated nodes, etc.) can run in JS.

**Reasons to include a Python backend**:
- If you add the probabilistic layer, you want pgmpy
- Graph analysis libraries (NetworkX) are more mature in Python
- Persistence (save/load argument maps) benefits from a server
- Consistency with the Bayesian engine project — same stack, shared components
- Portfolio coherence: demonstrates full-stack capability

**Pragmatic option**: Start client-side (React only, JSON export/import for persistence). Add Python backend when you need inference or persistence. This lets you ship v1 faster.

### Frontend: React + React Flow

**Custom node components by type**:

```
┌─ Factual Claim ──────────────┐
│ "Crime rates dropped 15%     │
│  after policy X"             │
│                              │
│ Confidence: ████████░░ 80%   │
│ Sources: [2]                 │
│ Status: ● Supported          │
└──────────────────────────────┘

┌─ Value ──────────────────────┐
│ "Public safety outweighs     │
│  individual privacy"         │
│                              │
│ Weight: ●●●○○ Moderate       │
│ Status: ⚡ Contested          │
└──────────────────────────────┘

┌─ Assumption ─────────────────┐
│ "Country Y's experience is   │
│  transferable to our context"│
│                              │
│ Confidence: ████░░░░░░ 40%   │
│ Status: ⚠ Load-bearing       │
└──────────────────────────────┘
```

Visual encoding:
- Node border color by type (blue = factual, purple = causal, orange = value, gray = assumption, green = policy)
- Edge color by type (green = supports, red = undermines, dashed gray = depends-on)
- Node background saturation by confidence/support status
- "Load-bearing" indicator for assumptions that many downstream claims depend on

### Backend: Python + FastAPI (when added)

**Core capabilities**:
- **Graph analysis** (NetworkX):
  - Find unsupported claims (no incoming support edges)
  - Find isolated nodes (no connections)
  - Find "load-bearing" assumptions (high betweenness centrality or many downstream dependents)
  - Identify circular reasoning (cycles in support edges)
  - Compute "argument depth" (longest chain from evidence to final claim)
- **Optional Bayesian inference** (pgmpy):
  - Extract the probabilistic sub-network (factual + causal claims with assigned credences)
  - Run belief propagation
  - Return updated credences
- **Persistence**: Save/load argument maps as JSON or to SQLite
- **Diff/comparison**: Compare two maps, identify structural differences

### File structure

```
argument-mapper/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ArgumentGraph.tsx      # React Flow canvas
│   │   │   ├── nodes/
│   │   │   │   ├── ClaimNode.tsx
│   │   │   │   ├── ValueNode.tsx
│   │   │   │   ├── AssumptionNode.tsx
│   │   │   │   ├── EvidenceNode.tsx
│   │   │   │   └── PolicyNode.tsx
│   │   │   ├── edges/
│   │   │   │   ├── SupportEdge.tsx
│   │   │   │   ├── UndermineEdge.tsx
│   │   │   │   └── DependsOnEdge.tsx
│   │   │   ├── panels/
│   │   │   │   ├── NodeEditor.tsx     # Edit node content
│   │   │   │   ├── AnalysisPanel.tsx  # Structural analysis results
│   │   │   │   └── TemplatePanel.tsx  # Argumentation scheme templates
│   │   │   └── toolbar/
│   │   │       └── AddNodeToolbar.tsx
│   │   ├── hooks/
│   │   │   ├── useArgumentGraph.ts    # Graph state management
│   │   │   └── useAnalysis.ts         # Client-side analysis (or API calls)
│   │   ├── types.ts                   # Node types, edge types, graph schema
│   │   ├── templates/                 # Walton scheme templates
│   │   │   ├── fromConsequences.ts
│   │   │   ├── fromExpertOpinion.ts
│   │   │   └── fromAnalogy.ts
│   │   └── analysis/
│   │       └── structuralAnalysis.ts  # Client-side graph analysis
│   ├── package.json
│   └── tsconfig.json
├── backend/                           # Added in v2
│   ├── main.py
│   ├── analysis.py
│   ├── inference.py
│   ├── storage.py
│   └── requirements.txt
└── README.md
```

---

## 5. Development Phases

### Phase 1: Qualitative argument mapper (3-4 weeks side project)

**Goal**: A usable tool for building and exploring argument maps. No probabilities. Client-side only.

- [ ] Define data model: node types (claim, value, assumption, evidence, policy), edge types (supports, undermines, depends-on, contradicts)
- [ ] React Flow canvas with typed custom nodes
- [ ] Add/edit/delete nodes via a sidebar panel
- [ ] Add/edit/delete typed edges by dragging
- [ ] Color-coded visual encoding by node and edge type
- [ ] JSON export/import for saving maps
- [ ] One pre-loaded example map (a simple policy debate you find interesting)
- [ ] Basic structural analysis (client-side): unsupported claims, isolated nodes

**What's NOT in Phase 1**: No probabilities, no backend, no templates, no comparison mode.

### Phase 2: Analysis and templates (2-3 weeks)

**Goal**: The tool becomes analytically useful, not just a drawing tool.

- [ ] Argumentation scheme templates (3-5 Walton schemes: from consequences, from expert opinion, from analogy, from precedent, from cause to effect)
- [ ] "Load-bearing assumption" detection (which assumptions, if changed, would invalidate the most downstream claims?)
- [ ] Guided construction wizard ("What is your main claim?")
- [ ] Optional ordinal weights on edges (strong / moderate / weak)
- [ ] Sensitivity display: highlight the weakest link in the longest chain
- [ ] Improved layout and UX

### Phase 3: Probabilistic layer (2-3 weeks)

**Goal**: For users who want it, add optional Bayesian reasoning over the factual/causal sub-network.

- [ ] Add Python backend (FastAPI)
- [ ] Users can optionally assign credence (0-1) to factual and causal claim nodes
- [ ] Backend extracts probabilistic sub-graph and runs inference (pgmpy)
- [ ] Frontend shows updated credences propagated through the network
- [ ] Clear visual separation: "these are your subjective inputs, this is what follows from them"
- [ ] Disclaimer/framing: "This is not the 'correct' answer — it is the logical consequence of *your* stated beliefs"

### Phase 4: Comparison and social features (optional, stretch)

- [ ] Side-by-side comparison of two maps on the same topic
- [ ] Structural diff: "you include this link, they don't"
- [ ] "Debate mode": two users build competing maps, tool identifies where their structures diverge
- [ ] LLM-assisted construction: paste text → proposed structure for review
- [ ] Public gallery of example maps

---

## 6. The Probabilistic Layer: Where to Draw the Line

This is the core design question. How much Bayesian inference belongs in an argument mapping tool?

### Option A: No probabilities (pure argument map)

- **What it is**: Kialo / Argdown with better node typing and structural analysis
- **Strength**: Honest — doesn't pretend to quantify the unquantifiable
- **Weakness**: Misses the connection to your UQ thesis; just another argument mapper

### Option B: Optional subjective credences with propagation

- **What it is**: Users *can* assign credences to factual nodes. The tool propagates them. But the qualitative map is fully functional without them.
- **Strength**: Bridges argument mapping and Bayesian reasoning without forcing it. Users who care about quantification get it; others don't.
- **Weakness**: Requires careful UI design to prevent the numbers from dominating. Must constantly communicate: "these are YOUR beliefs, not objective facts."

### Option C: Full Bayesian argument evaluation (Hahn & Oaksford style)

- **What it is**: Every argument scheme gets a probabilistic model. Argument strength is computed from priors and likelihoods.
- **Strength**: Theoretically rigorous. Publishable.
- **Weakness**: Requires probability assignments that most users can't or won't make. Turns a reasoning tool into a statistics exercise. High research burden.

**Recommendation: Option B.** It's the sweet spot — it demonstrates your UQ thesis, it's technically tractable, and it's honest about its limitations.

---

## 7. Anticipated Criticisms and Responses

| Criticism | Response |
|-----------|----------|
| "You can't quantify political beliefs" | Correct. The quantitative layer is optional and explicitly subjective. The tool's primary value is structural clarity. |
| "This just confirms what you already believe" | Yes, if used alone. The tool's value is in making your reasoning transparent — so others can see and challenge it. Confirmation bias is a feature of the user, not the tool. The tool makes it *visible*. |
| "How is this different from Kialo?" | Typed nodes (distinguishing facts from values from assumptions), structural analysis (load-bearing assumptions, weakest links), and optional probabilistic reasoning. Kialo is a debate platform; this is a reasoning tool. |
| "Argument mapping doesn't change minds" | The goal isn't persuasion. It's diagnosis. Where exactly do two people disagree? Is it a factual dispute (resolvable with evidence), a causal dispute (resolvable with analysis), or a value dispute (not resolvable — but at least named)? |
| "This is too academic for real policy use" | Fair concern. The UX must be intuitive enough for non-academics. Templates and guided construction help. The blank-page problem is the real threat, not the theory. |

---

## 8. Research Budget

You said you don't want to over-invest in research. Here's a minimal reading list, ordered by priority:

**Must read (before building)**:
1. Toulmin, *The Uses of Argument* (1958) — Chapter 3 only (the layout of arguments). ~30 pages.
2. A survey of Walton's schemes — not the full book, just a summary table of the 10-15 most common schemes with their critical questions. Available in: Walton, Reed & Macagno, *Argumentation Schemes* (2008), Chapter 1.
3. Play with Kialo for 30 minutes. Note what works and what frustrates you.
4. Play with Argdown (argdown.org) for 30 minutes. Note the text-based approach.

**Useful but deferrable**:
5. Hahn & Oaksford, "The Rationality of Informal Argumentation" (2007) — the Bayesian argumentation paper. Gives the theoretical backbone for Option B.
6. Fenton, Neil & Lagnado, "A General Structure for Legal Arguments About Evidence Using Bayesian Networks" (2013) — the Wigmore-to-BN bridge.

**Skip unless you go deep**:
- Dung's abstract argumentation frameworks (1995) — formal but too abstract for a practical tool
- Prakken & Sartor on formal argumentation — legal AI, highly technical
- Full Walton corpus — 60+ schemes is too many; pick 5-10

**Total research time budget**: ~8-12 hours of reading before starting v1. The rest you learn by building.

---

## 9. Connection to the Bayesian Engine Project

The two projects share:
- React + React Flow frontend (same component patterns, same visual DAG paradigm)
- Python + FastAPI backend (same stack)
- pgmpy for inference (same engine, different network types)
- The same intellectual thesis (make uncertainty structure visible and interactive)

**Potential unification (v3+)**: A shared platform with two modes:
- "Scientific mode": Quantitative Bayesian network, fixed structure, real-time inference
- "Argument mode": Typed argument map, qualitative analysis, optional probabilistic sub-layer

This is the ambitious vision. But build them separately first and unify later, if at all.

---

## 10. Political Application: How to Start Without Getting Lost

If you want to test the tool on a policy topic, choose one that is:
- **Bounded**: A specific policy question, not "politics in general." Example: "Should [country] introduce a carbon tax?"
- **Has clear factual claims**: Some nodes can be grounded in data (emission levels, economic studies, international precedents)
- **Has explicit value tensions**: Economic growth vs. environmental protection, individual vs. collective
- **You understand well enough to build the map yourself**: Don't pick a topic where you'd need weeks of research just to identify the claims

**Good first test cases**:
- Carbon tax: yes or no?
- Nuclear energy expansion: yes or no?
- Universal basic income: should we pilot it?

Build the map yourself. Use it. See where it helps and where it breaks. That's your real feasibility study — not more reading.

---

*This document is a strategic plan, not a specification. The theoretical foundations section is a map of the territory; you don't need to master it all before building. Start with Toulmin + IBIS, build Phase 1, and learn the rest as you go.*
