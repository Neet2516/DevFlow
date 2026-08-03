# 30 — Folder Structure (Detailed)

## Purpose
Provide the concrete, file-level folder layout beneath the top-level monorepo structure defined in `05-monorepo-structure.md`.

## Example: `services/execution` (Pipeline Engine)
```
services/execution/
  src/
    engine/
      startExecution.ts
      handleJobCompleted.ts
      handleJobFailed.ts
    state-machine/
      transitions.ts
    consumers/
      eventBusConsumer.ts
    index.ts
  test/
    engine.unit.test.ts
    engine.integration.test.ts
  Dockerfile
  package.json
```

## Example: `apps/dashboard`
```
apps/dashboard/
  src/
    app/                # Next.js app router pages
    components/
      dag-canvas/
      inspector/
      timeline/
      log-viewer/
    hooks/
      useWebSocket.ts
      usePipelineQuery.ts
    store/
      executionStore.ts   # Zustand
    lib/
  test/
  Dockerfile
```

## Example: `packages/graph-engine`
```
packages/graph-engine/
  src/
    buildDag.ts
    detectCycles.ts
    computeReadiness.ts
    types.ts
  test/
    buildDag.test.ts
    detectCycles.test.ts
```

## Design Decisions
- **Every service/package follows the same `src/` + `test/` shape** regardless of its role — a consistent skeleton means any engineer can navigate an unfamiliar part of the codebase using the same mental model.
- **Tests live alongside the code they test, in a sibling `test/` directory**, not in a separate top-level `tests/` monolith — keeps ownership and change locality tight.

## Advantages
Predictable structure reduces onboarding time and makes automated tooling (linting, coverage reporting, codeowners) simpler to configure uniformly.

## Trade-offs
Rigid structural conventions can feel like overhead for very small packages — accepted as a worthwhile consistency cost given the number of independently deployable units in this system.

## Edge Cases
Packages that are pure type definitions (no runtime logic) still follow the same shape with an empty or minimal `test/` directory, for consistency over exception-making.

## Possible Improvements
Codegen a new-service/new-package scaffold script that produces this exact structure automatically.

## Best Practices
No service imports another service's `src/` directly — cross-service code sharing only happens through `packages/`.

## References
`05-monorepo-structure.md`, `31-coding-guidelines.md`
