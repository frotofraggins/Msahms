# Agent Coordination

Two AI agents work this repo. Read this file before starting any task.

> **Before writing any code, also read `.kiro/STEERING.md`** — product north
> star, architecture rules, naming conventions, quality bars. That's the
> single source of truth for how this repo is built.

## Workspace isolation (new 2026-04-24)

Each agent has its own git worktree — independent working directory, shared `.git/`.
This prevents the shared-workspace branch-collision bug we hit earlier where one
agent's `git checkout` silently switched HEAD under the other agent's feet.

| Agent | Working directory | Branch |
|-------|-------------------|--------|
| Kiro A | `/workplace/nflos/Msahms-kiro-a` | `agent/kiro-nflos-review` |
| Kiro B | `/workplace/nflos/Msahms` | `agent/kiro-b-implementation` |

Create a new worktree with:
```
git worktree add <path> <branch>
```
Neither agent touches the other's directory. Each runs `npm install` or links
`node_modules` once per worktree.

## Workflow: branch-per-agent

Each agent works on its own long-lived branch. Merges to `main` happen only after
the human reviews. Neither agent pushes directly to `main`.

### Branches

| Agent | Branch | Role |
|-------|--------|------|
| Kiro A (review/fixes) | `agent/kiro-nflos-review` | TypeScript hygiene, spec review, cross-cutting concerns, differentiator features |
| Kiro B (implementation) | `agent/kiro-b-implementation` | Main task list execution (tasks 1-8 done, 9+ in progress) |

### Rules

1. `git branch --show-current` before every `git commit` / `git push`. The
   shared-workspace bug taught us this the hard way.
2. Read this file and `tasks.md` before starting any task.
3. Work only on your own branch. Never commit to another agent's branch or `main`.
4. Before starting a task: `git fetch origin && git rebase origin/main`.
5. Claim a task by adding a row under `Active Work` in your branch's copy of this
   file, then commit and push. The other agent reads the pushed version.
6. Read the other agent's AGENTS.md via:
   ```
   git show origin/<other-branch>:.kiro/AGENTS.md
   ```
7. Never edit a file the other agent is actively working on. For shared `lib/`
   changes, add a row under `Handoffs Needed`.
8. When done: commit, push, ask the human to merge to `main`.
9. Stale claim (no commit for >4 hours) → may be taken over.

### Shared modules (both agents read, handoff to edit)

- `lib/errors.ts`, `lib/retry.ts`, `lib/dynamodb.ts`, `lib/s3.ts`, `lib/secrets.ts`, `lib/cognito.ts`
- `lib/types/*`, `lib/models/*`
- `infrastructure/*`
- `.kiro/specs/*` (spec files — only edit checkboxes in `tasks.md` for tasks you completed)

## Active Work

| Agent | Task | Files | Started | Status |
|-------|------|-------|---------|--------|
| Kiro A | Worktree setup + post-Task-8 review | `.kiro/AGENTS.md` | 2026-04-24T15:50 | In progress |
| Kiro B | Task 9 checkpoint | (verifying 719 tests) | 2026-04-24T15:45 | Per user handoff |

## Handoffs Needed

_Use this when you need another agent to change a shared module before you can proceed._

| From | To | What | Why | Blocking Task |
|------|----|------|-----|---------------|
|      |    |      |     |               |

## Notes / Decisions

- 2026-04-24 (Kiro A): Fixed 5 `noUnusedLocals` TypeScript errors and the awkward `EntityType` cast in `lambdas/property-lookup/index.ts`. Kiro B picked these up in the Task 5 commit (d915342).
- 2026-04-24 (Kiro A): Accidentally pushed commit `8e207ea` (SYNC_PROMPT.md) to Kiro B's branch during the shared-workspace collision. The file is useful, so it's staying on their branch. Root cause now fixed with worktrees.
- 2026-04-24 (Kiro B via human): Task 8 complete. 719 tests passing. Built: auth-api (login/refresh/register/lockout), authorizer, dashboard-api (11 endpoints), notification-worker, listing-service. Property tests 12, 13, 14, 15 passing.
- 2026-04-24 (Kiro A): Product differentiation ideas in earlier conversation with human: unlimited local AI, county-verified data badge, Sell-Now-or-Wait with confidence intervals, Fair Housing stamp, AZ-specific offer writer, public agent SLA, path-aware lead context, public market API, subdivision/ZIP SEO pages. Not yet implemented.
- 2026-04-24 (Kiro A): See `.kiro/SYNC_PROMPT.md` for the onboarding prompt both agents should read before starting work.
