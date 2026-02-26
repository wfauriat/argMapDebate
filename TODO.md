# TODO — Bayesian Inference Integration

## High priority

- [x] **Display posteriors in node UI** — Show computed posterior next to credence in node cards (color-coded bar or badge). Without this, "Run Inference" has no visible effect.
- [ ] **Tune inference scale factors** — Current SUPPORT/UNDERMINE_SCALE (2.0) may be too aggressive. Test with multiple debate maps and adjust. Revisit the "absence penalty" for support edges.
- [ ] **Unified dev experience** — Add docker-compose or npm script that starts both Next.js and FastAPI in one command.

## Medium priority

- [x] **Frontend component tests** — Add Vitest tests for InferenceButton and inferenceApi (mock fetch, error handling, backend-not-running scenario).
- [x] **Posterior clearing** — Add a way to reset posteriors to null (button or auto-clear on graph structure change).
- [ ] **Better error/warning UX** — Auto-dismiss toasts after a few seconds, or integrate a proper toast system.
- [ ] **Performance for large graphs** — Fall back to BeliefPropagation for graphs above a node/edge threshold.

## Lower priority

- [ ] **Dockerfile + docker-compose** — Containerized setup for easy onboarding.
- [ ] **Configurable CORS origins** — Use environment variable instead of hardcoded localhost:3000.
- [ ] **CI pipeline** — GitHub Actions running pytest + vitest + tsc on PRs.
- [ ] **Rate limiting / request size limits** — Protect /infer endpoint from oversized payloads.
