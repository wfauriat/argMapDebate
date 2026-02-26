# TODO — Bayesian Inference Integration

## High priority

- [x] **Display posteriors in node UI** — Show computed posterior next to credence in node cards (color-coded bar or badge). Without this, "Run Inference" has no visible effect.
- [x] **Tune inference scale factors** — Reduced scales from 2.0 to 1.2 (support/undermine/contradict), 3.0 to 2.0 (DependsOn). Added ABSENCE_PENALTY_FACTOR (0.25, was hardcoded 0.5). Updated all example map posteriors.
- [x] **Unified dev experience** — `npm run dev:full` starts Next.js + FastAPI together. `npm run test:all` runs both test suites.

## Medium priority

- [x] **Frontend component tests** — Add Vitest tests for InferenceButton and inferenceApi (mock fetch, error handling, backend-not-running scenario).
- [x] **Posterior clearing** — Add a way to reset posteriors to null (button or auto-clear on graph structure change).
- [x] **Better error/warning UX** — Toast system with auto-dismiss (error 8s, warning 5s, success 3s, info 4s). Replaced alert() and inline toasts.
- [ ] **Performance for large graphs** — Fall back to BeliefPropagation for graphs above a node/edge threshold.

## Lower priority

- [ ] **Dockerfile + docker-compose** — Containerized setup for easy onboarding.
- [ ] **Configurable CORS origins** — Use environment variable instead of hardcoded localhost:3000.
- [ ] **CI pipeline** — GitHub Actions running pytest + vitest + tsc on PRs.
- [ ] **Rate limiting / request size limits** — Protect /infer endpoint from oversized payloads.
