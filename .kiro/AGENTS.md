# Agent Coordination

Two AI agents work this repo. Read this file before starting any task.

## Workflow: branch-per-agent

Each agent works on its own long-lived branch. Merges to `main` happen only after
the human reviews. Neither agent pushes directly to `main`.

### Branches

| Agent | Branch | Role |
|-------|--------|------|
| Kiro A (review/fixes) | `agent/kiro-nflos-review` | TypeScript hygiene, spec review, cross-cutting concerns, differentiator features |
| Kiro B (implementation) | _(set by other agent)_ | Main task list execution (tasks 5, 6, 8, etc.) |

### Rules

1. Read this file and `tasks.md` before starting any task.
2. Work only on your own branch. Never commit to another agent's branch or `main`.
3. Before starting a task, pull `main` and rebase your branch onto it:
   ```
   git fetch origin && git rebase origin/main
   ```
4. Claim a task by adding a row under `Active Work` in your own branch's copy of this file, then push.
5. Read the **other agent's branch** before starting work to see what they've claimed:
   ```
   git fetch origin && git show origin/<other-branch>:.kiro/AGENTS.md
   ```
6. Never edit a file the other agent is actively working on. If you need a change to a shared `lib/` file they own, add a row under `Handoffs Needed`.
7. When done with a task: commit, push, and ask the human to review/merge.
8. Stale claim (no commit for >4 hours) → may be taken over.

### Shared modules (both agents read, handoff to edit)

- `lib/errors.ts`, `lib/retry.ts`, `lib/dynamodb.ts`, `lib/s3.ts`, `lib/secrets.ts`, `lib/cognito.ts`
- `lib/types/*`, `lib/models/*`
- `infrastructure/*`
- `.kiro/specs/*` (spec files — only edit checkboxes in `tasks.md` for tasks you completed)

## Active Work

| Agent | Task | Files | Started | Status |
|-------|------|-------|---------|--------|
| Kiro A | Coordination setup | `.kiro/AGENTS.md` | 2026-04-24T14:30 | Done |

## Handoffs Needed

_Use this when you need another agent to change a shared module before you can proceed._

| From | To | What | Why | Blocking Task |
|------|----|------|-----|---------------|
|      |    |      |     |               |

## Notes / Decisions

- 2026-04-24 (Kiro A): Fixed 5 `noUnusedLocals` TypeScript errors and the awkward `EntityType` cast in `lambdas/property-lookup/index.ts`. Kiro B picked these up in the Task 5 commit (d915342). Going forward both agents should run `npx tsc --noEmit && npx vitest run` before committing.
- 2026-04-24 (Kiro A): See `.kiro/DIFFERENTIATORS.md` (TBD) for product differentiation ideas the human wants explored after MVP.
