# Spec Catalog — Grouped by Status

Last reorg: 2026-05-02

**36 specs** organized by status below. Specs tagged here don't need
separate `Status:` fields in each file — check this catalog first.

When adding a new spec: add a row below AND set an explicit status
line at the top of the file. Avoid writing a new spec for work that
fits within an existing one — prefer extending specs over cloning.

---

## ✅ SHIPPED (6 specs)

Work complete and live in production. Kept for reference / future
maintenance.

| Spec | What shipped |
|---|---|
| [ci-cd-github-actions.md](./ci-cd-github-actions.md) | GHA + OIDC auto-deploy pipeline |
| [dashboard-performance.md](./dashboard-performance.md) | `/dashboard/performance` endpoint + Lambda |
| [lead-nurture-sequences.md](./lead-nurture-sequences.md) | Path-specific welcome emails |
| [seller-hub-content.md](./seller-hub-content.md) | 5 of 6 hand-written seller guides (Article 5 skipped as redundant) |
| [fsbo-launch-mode-gate.md](./fsbo-launch-mode-gate.md) | `NEXT_PUBLIC_FSBO_LAUNCH_MODE` environment flag |
| [notification-worker-ses-wireup.md](./notification-worker-ses-wireup.md) | notification-worker now sends real SES email |

---

## 🟡 PARTIAL / IN-FLIGHT (7 specs)

Work started, meaningful portions live, but spec still has open items.

| Spec | What's done / pending |
|---|---|
| [content-ingest-pipeline.md](./content-ingest-pipeline.md) | Phases 1-3 + 4.1 ✓  •  Pending: 4.2 (moving-to-mesa hub), 4.3 (housing-law tracker), 4.4 (social scheduler) |
| [content-pipeline-phase-2.md](./content-pipeline-phase-2.md) | 2A-2D ✓  •  Pending: 2E (compliance filter), 2F (CloudWatch $5/day alarm — **✓ actually shipped**, update spec) |
| [phase-1b-content-automation.md](./phase-1b-content-automation.md) | Mostly superseded by phase-2  •  Archive candidate |
| [phase-1b-lead-gen-amplification.md](./phase-1b-lead-gen-amplification.md) | Some done  •  Pending: agent email actions, more Zillow datasets, moving-to-mesa, HOA auto-directory |
| [three-tier-product.md](./three-tier-product.md) | Structure live  •  Pending: broker-of-record launch of Mesa Listing Service (external blocker) |
| [seo-architecture.md](./seo-architecture.md) | Mostly implemented via ai-seo + sitemap changes  •  Pending: per-ZIP landing pages |
| [seo-audit-2026-04-28.md](./seo-audit-2026-04-28.md) | Baseline 4.8/10 captured  •  Pending: 30/60/90-day comparison re-audits |

---

## 📋 REFERENCE / LIVE DOCS (7 specs)

Narrative specs that never "complete" — they describe the current
state, research findings, or design-system-style conventions. Update
as reality changes.

| Spec | Purpose |
|---|---|
| [CONTENT-PIPELINE-STATUS.md](./CONTENT-PIPELINE-STATUS.md) | Top-level content-pipeline navigator (read first for anything content-related) |
| [content-ingest-verified-sources.md](./content-ingest-verified-sources.md) | Live record of which RSS feeds are active |
| [ai-content-and-photos-research.md](./ai-content-and-photos-research.md) | Research memo |
| [ai-prompts-library.md](./ai-prompts-library.md) | Prompt patterns for Bedrock calls |
| [design-system.md](./design-system.md) | Tailwind tokens, component library conventions |
| [legal-reference-library.md](./legal-reference-library.md) | AZ statutes + AAR forms catalog |
| [flat-fee-legal-model.md](./flat-fee-legal-model.md) | Legal boundaries for flat-fee work |

---

## 📦 PENDING IMPLEMENTATION (10 specs)

Written but not yet executed. Prioritized below.

### High priority

| Spec | Why important |
|---|---|
| [frontend-content-gaps.md](./frontend-content-gaps.md) | Content holes flagged by SEO audit |
| [pre-launch-punchlist.md](./pre-launch-punchlist.md) | Some items remain; mostly done |

### Medium priority

| Spec | Why |
|---|---|
| [frontend-visual-upgrade-2026.md](./frontend-visual-upgrade-2026.md) | Polish pass, not blocking |
| [hoa-hyperlocal-strategy.md](./hoa-hyperlocal-strategy.md) | Content moat opportunity |
| [hyperlocal-content-pipeline.md](./hyperlocal-content-pipeline.md) | Largely overlaps with current pipeline; re-examine |
| [mortgage-cost-transparency.md](./mortgage-cost-transparency.md) | Copy + content strategy |
| [mls-syndication-messaging.md](./mls-syndication-messaging.md) | Onboarding copy work |
| [public-data-enrichment.md](./public-data-enrichment.md) | Free data source research |

### Low priority

| Spec | Why |
|---|---|
| [middle-tier-rebrand-research.md](./middle-tier-rebrand-research.md) | Messaging experiment, not urgent |
| [content-traffic-analytics-audit.md](./content-traffic-analytics-audit.md) | Gap analysis — action-on-demand |

---

## 📐 PROCESS / META (2 specs)

Process documentation and acute fixes that aren't feature work.

| Spec | Purpose |
|---|---|
| [pre-deploy-verification.md](./pre-deploy-verification.md) | Verification checklist for deploys |
| [build-blocker-static-export.md](./build-blocker-static-export.md) | Acute fix from 2026-04-25 — archive candidate |

---

## 🚫 DEFERRED (3 specs)

Intentionally not being worked on right now. Unblock conditions noted.

| Spec | Deferred because |
|---|---|
| [research-agent.md](./research-agent.md) | Cost per draft too high until traffic justifies it |
| [armls-idx-integration.md](./armls-idx-integration.md) | Requires paid ARMLS data feed (~$200/mo), post-MVP |
| [hydra-ai-backend.md](./hydra-ai-backend.md) | Local RTX 4090 backend — optional, currently use Bedrock |

---

## 📂 Subfolder: `mesahomes-lead-generation/`

Original product spec from the MVP phase. Mostly superseded by
individual specs above but still useful context.

| File | Status |
|---|---|
| `requirements.md` | Historical — original MVP requirements |
| `design.md` | Historical — original architecture |
| `frontend-design.md` | Historical — original UI design |
| `tasks.md` | Task list — tasks 1-8 complete, task 9+ absorbed into individual specs |
| `content-sources.md` | Overlaps with `content-ingest-verified-sources.md` |
| `data-sources.md` | Overlaps with `public-data-enrichment.md` |

---

## What's missing / should exist

Specs we don't yet have but could use:

| Proposed spec | Why |
|---|---|
| `virtualhomezone-site.md` | VHZ standup runbook exists (`VHZ-STANDUP-RUNBOOK.md`), but no product spec. Features, pricing, launch criteria, integration with MesaHomes. |
| `per-zip-landing-pages.md` | `/areas/mesa/85201/` structure — highest-leverage SEO gap per audit |
| `cost-monitoring.md` | Already in `content-pipeline-phase-2.md §2F` but could be its own — covers Bedrock alarms + account-wide budget |

---

## Maintenance rules

1. **One status per spec.** If this INDEX says "shipped" but the spec file has no status line, add one referencing this catalog.
2. **Don't delete specs.** Mark as archived / superseded in this INDEX; keep files as history.
3. **New work**: extend an existing spec before creating a new one. Every new spec is a maintenance tax.
4. **When something ships**: move the row from PARTIAL/PENDING to SHIPPED in this INDEX, same commit as the code change.
