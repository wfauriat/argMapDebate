# Argument Map — Feature Enrichment Perspectives

Ideas for extending the semantic depth, analytic power, and visualization of the tool,
grounded in argumentation theory literature and the current implementation.

---

## A. Richer Argument Semantics

### Completing the Toulmin Model

The current model covers *data* (Evidence), *claim* (FactualClaim/Policy), and an
implicit *warrant* (the Supports edge). Toulmin's full model has two missing elements:

- [ ] **Warrant node** — the rule or principle that licenses the inference from data
  to claim (e.g. "carbon taxes work in jurisdictions with elastic demand" as an
  explicit node between BC evidence and the policy conclusion). Currently warrants
  are implicit in the Supports edge, which loses their epistemic status.
- [ ] **Rebuttal conditions** — "unless the economy is in recession," "unless border
  leakage dominates." These are conditional defeaters, structurally different from a
  categorical Undermines edge, which loses the conditionality.
- [ ] **Qualifier** — modal strength of the conclusion: *necessarily*, *probably*,
  *presumably*, *possibly*. `NodeStatus` gestures at this but it is computed, not
  user-asserted. A qualifier is an epistemic stance, not an inference result.

### New Edge Types

- [ ] **Explains** — distinct from Supports; evidence *explains* a phenomenon rather
  than merely supporting a claim. Bayesian and inferentialist accounts treat these
  differently (an explanation may reduce surprise without increasing confirmation).
- [ ] **Analogizes** — "X works like Y, therefore..." Walton's argument from analogy.
  The structural relationship is different from a support edge and invites specific
  critical questions (is the analogy apt? are the relevant differences disqualifying?).
- [ ] **Instantiates** — a specific case node instantiates a general principle node.
  Useful for separating empirical examples from the general claims they illustrate.
- [ ] **Entails** (deductive) — vs. the current probabilistic Supports. A deductive
  entailment should set the posterior of the target equal to the product of the
  premises, not merely nudge it. Requires a distinct edge type and CPD treatment.

### New Node Types

- [ ] **Question / Issue node** — the IBIS tradition (Issue-Based Information System,
  Kunz & Rittel 1970) makes unanswered questions first-class citizens. "Is carbon
  leakage significant?" sits in the map as an open question; Evidence and Claims
  connect to it as Answers. Particularly powerful for deliberation and policy analysis.
- [ ] **Source / Actor node** — who asserts a claim? Linking Evidence to named sources
  enables source reliability modeling and flags when multiple nodes rely on the same
  actor (the correlated evidence problem).
- [ ] **Hypothesis node** — epistemically distinct from FactualClaim. A hypothesis is
  held tentatively pending confirmation. Different status logic from an established claim.

---

## B. Counterfactuals and What-If Reasoning

### Interventional Queries (do-calculus)

- [ ] **"What if X were false?"** — graph surgery that severs all incoming edges to an
  intervened node, forces its value, and re-runs inference. Answers the question
  "how much of my conclusion depends on this specific premise?" pgmpy supports
  interventional queries natively via `do(X=False)`.

### Minimal Repair / Abduction

- [ ] **Abductive suggestions** — "What is the minimum change (one new node, one
  credence shift) that would bring the target posterior above threshold T?" Works
  backward from a desired conclusion to identify what premises would be needed.
  Useful for debate prep: what would the opponent need to believe for their
  conclusion to be coherent?

### Sensitivity Tornado Chart

- [ ] **Per-node sensitivity** — for each node in the graph, compute the derivative
  of the target posterior with respect to that node's credence (perturb ±ε, re-run
  inference). Rank and display as a tornado diagram. Shows not just which node *is*
  weakest but which node, if strengthened, would most move the conclusion.
  Entirely achievable with the current pgmpy backend.

### Scenario Comparison

- [ ] **Side-by-side scenarios** — hold two versions of the same map simultaneously
  ("optimistic" vs "pessimistic" worldviews) with different credence assignments,
  and overlay the resulting posteriors. Shows how the conclusion changes across
  plausible epistemic states.

---

## C. Dialectical and Debate Structure

### Dung's Abstract Argumentation

- [ ] **Admissibility / extension computation** — Dung (1995) abstracts from content:
  arguments plus attack relations, compute sets of mutually acceptable arguments
  (admissible, preferred, grounded extensions). The existing Undermines/Contradicts
  edges already encode an attack relation. Highlighting which arguments survive in
  the grounded extension gives a formal notion of "who wins the debate."

### Burden of Proof and Presumptions

- [ ] **Presumption direction on claims** — annotate whether a claim defaults to true
  until disproven (presumptive) or false until proven (non-presumptive). Shifts how
  Undermines edges affect status. Relevant in legal, scientific, and policy contexts
  where the asymmetry matters (extraordinary claims require extraordinary evidence).

### Dialogue Types (Walton)

- [ ] **Declared dialogue type** — Walton distinguishes persuasion, inquiry,
  negotiation, deliberation, eristic. Each permits different moves. You could
  constrain which edge types are valid based on the declared dialogue context
  (e.g. in an Inquiry dialogue, bare Assertion without Evidence is disallowed).

### Critical Questions as Checklists

- [ ] **Per-scheme critical question prompts** — every argumentation scheme comes
  with associated critical questions (Walton 2008). "From Expert Opinion" raises:
  Is the expert in the right domain? Is there consensus? Could they be biased?
  Surfacing these as an interactive checklist in the inspector when a scheme is
  detected would prompt users to address gaps before treating the argument as complete.
  The scheme templates infrastructure already provides a natural hook for this.

---

## D. Visualization Paradigms

### Opposing Sides Layout

- [ ] **Pro / Con column view** — debate-specific layout: pro-arguments on the left,
  con-arguments on the right, contested claim in the center. Makes the dialectical
  structure immediately legible. Common in debate coaching tools (Rationale, MindMup).

### Credence Sensitivity Heatmap

- [ ] **Overlay sensitivity on the graph** — color nodes not just by their posterior
  but by their computed sensitivity to the target node (see tornado chart above).
  Immediately shows which nodes matter most without requiring a separate panel.

### Argument Compression / Zoom Levels

- [ ] **Collapsible sub-arguments** — long inference chains collapse into single
  "super-nodes" at low zoom, expandable on click. Lets users reason at the
  strategic level (does this argument work?) and drill into specific sub-chains.
  Standard in mind-mapping tools, rare in argument maps.

### Argument Comparison Mode

- [ ] **Structural diff between two maps** — load two maps on the same topic
  (e.g. two academic papers on carbon pricing) and compute a diff: shared nodes
  and edges, nodes unique to each, claims where the two maps assign conflicting
  credences. Useful for literature review and academic debate.

### Temporal / Evolution View

- [ ] **Time-sliced map** — show how the map changed as new evidence was added,
  animate the propagation of a new piece of evidence through the graph, or ask
  "at what point did this claim become Supported?"

---

## E. Epistemological Enrichment

### Correlated Evidence

- [ ] **Evidence correlation modeling** — the current Bayesian model treats all
  Evidence nodes as independent, which is often false (two studies from the same
  lab, same dataset, same funding source). Explicitly marking evidence dependencies
  would prevent double-counting. Implementable in pgmpy with correlation nodes.

### Second-Order Uncertainty

- [ ] **Credence distributions instead of point estimates** — rather than a single
  number (0.7), a Beta distribution encoding both the estimate and the uncertainty
  around it ("I believe this with moderate confidence, but my interval is wide").
  The inference engine would propagate distributions rather than point estimates.
  Computationally heavier but epistemically more honest; important for policy decisions.

### Expert Aggregation

- [ ] **Multi-user credence elicitation** — multiple users independently assign
  credences to the same nodes; the app computes a consensus posterior and
  visualizes where disagreement is highest. Surfaces that disagreements usually
  lie upstream in empirical or value claims, not in the conclusion. Based on the
  structured expert elicitation literature (IDEA protocol, Sheffield method).

---

## F. Thought Experiment and Generation Features

### Automated Critical Question Generation

- [ ] **LLM-assisted vulnerability prompts** — given the current map, generate
  questions that expose the most vulnerable assumptions: "What happens if
  [load-bearing assumption X] is false?" "Is [claim Y] really independent of
  [claim Z]?" Uses the existing AI generation infrastructure in a targeted,
  adversarial mode rather than generative.

### Steelman Generation

- [ ] **Strongest opposing argument** — ask an LLM to generate the best possible
  counter-argument to the current map's conclusion and insert it as a new branch.
  Distinct from map generation: adversarial and targeted at the current
  argument's weaknesses, not constructive from scratch.

### Analogy Mining

- [ ] **Structural analogy retrieval** — given a causal structure in the map
  (A supports B via mechanism M), surface structurally similar arguments from
  other domains ("this has the same structure as the argument for sugar taxes /
  alcohol regulation / leaded gasoline removal"). Helps evaluate whether the
  argument form has succeeded in analogous cases.

---

## Prioritization

### High value, low effort (current infrastructure supports it)

1. **Sensitivity tornado chart** — purely computational on existing pgmpy backend
2. **Critical question checklists** per scheme — hooks already exist in templates
3. **Interventional what-if** (`do(X=False)`, re-run inference) — pgmpy native
4. **Question/Issue as a 7th node type** — small addition, IBIS tradition, powerful
   for deliberation and policy maps
5. **Warrant as explicit node type** — completes Toulmin, improves map legibility

### Medium effort, high conceptual value

6. Scenario comparison (dual-map credence overlay)
7. Burden of proof / presumption direction on claims
8. Opposing sides layout
9. Abductive repair suggestions
10. Evidence correlation modeling

### Substantial effort, research-grade

11. Dung admissibility / extension computation
12. Second-order uncertainty (Beta distributions through inference)
13. Expert aggregation with disagreement visualization
14. Dialogue type constraints
15. Temporal / evolution view

---

## G. LLM-Assisted Features

The `aiGenerate.ts` / `AIGenerateModal` infrastructure already solves the core
design challenge: prompting the LLM to return structured JSON matching the graph
schema. All features below reuse that pattern — the work is prompt engineering
and UI entry points, not new infrastructure.

**Already built:**
- Full map generation from a topic/prompt

### Low effort (reuse existing infrastructure directly)

- [ ] **Steelman generator** — given the current map, ask the LLM to generate the
  strongest possible counter-argument branch and inject it as new nodes/edges.
  Adversarial and targeted at the current argument's weaknesses.
- [ ] **Gap filler** — select an Unsupported claim, ask the LLM to suggest Evidence
  or FactualClaim nodes that would support it, previewed before inserting.
- [ ] **Critical question prompts** — given a selected node or detected scheme, ask
  the LLM to list the 3–5 most important challenges to address. Complements the
  static checklist approach from scheme templates.
- [ ] **Label / notes drafting** — given a node type and brief user context, draft
  the label and notes fields as a starting point.
- [ ] **Assumption surfacer** — feed the current map to the LLM and ask it to
  identify implicit assumptions not yet present as nodes. Returns candidate
  Assumption nodes for the user to accept or discard.

### Medium effort

- [ ] **Map-to-text** — convert the current graph structure into coherent prose:
  a structured summary, policy brief, or debate speech. Traverses the graph
  in topological order and asks the LLM to narrate the argument chain.
- [ ] **Argument diagnosis** — feed the full map and ask "what are the three weakest
  points in this argument?" Complements the structural analysis panel with
  semantic judgment the algorithm cannot make (e.g. a claim may be structurally
  Supported but its evidence nodes are low-quality).
- [ ] **Credence suggestions** — given a claim and its connected evidence nodes,
  ask the LLM to suggest a reasonable prior credence based on world knowledge,
  with a brief rationale. Presented as a suggestion, not an automatic assignment.

### Design note

The key tension throughout: LLM outputs are unstructured text; the map needs
typed nodes and edges. The existing JSON schema prompting in `aiGenerate.ts`
already handles this. New features follow the same pattern: define the expected
output schema, prompt accordingly, validate and preview before applying to the store.

---

## Key References

- Toulmin, S. (1958). *The Uses of Argument*. Cambridge University Press.
- Kunz, W. & Rittel, H. (1970). *Issues as Elements of Information Systems*. (IBIS)
- Dung, P.M. (1995). On the acceptability of arguments and its fundamental role
  in nonmonotonic reasoning, logic programming and n-person games.
  *Artificial Intelligence*, 77(2), 321–357.
- Walton, D., Reed, C., & Macagno, F. (2008). *Argumentation Schemes*.
  Cambridge University Press.
- Pearl, J. (2009). *Causality: Models, Reasoning and Inference* (2nd ed.).
  Cambridge University Press. (do-calculus, interventional queries)
- Cooke, R.M. (1991). *Experts in Uncertainty*. Oxford University Press.
  (structured expert elicitation)
- Besnard, P. & Hunter, A. (2008). *Elements of Argumentation*. MIT Press.
- Reed, C. & Walton, D. (2003). Towards a formal and implemented model of
  argumentation schemes in agent communication. *Autonomous Agents and
  Multi-Agent Systems*, 11(2).
