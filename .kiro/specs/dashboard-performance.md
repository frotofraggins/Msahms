# Dashboard Performance Endpoint

Author: Kiro A, 2026-04-27 (backfilled from implementation).
Status: SHIPPED. Live in production.

## Purpose

Team admins need to see team-wide lead conversion metrics and
per-agent breakdown. The `/dashboard/performance` page had a
frontend UI built months ago but the backend Lambda + API Gateway
route were never wired — result: CORS errors + 403s for the owner
when loading the page.

This spec covers the backend Lambda that closed the gap.

## Outcome

Team_Admin-only `GET /api/v1/dashboard/performance` returns:

```json
{
  "agents": [
    {
      "id": "unassigned",
      "name": "Unassigned",
      "totalLeads": 13,
      "closedLeads": 0,
      "conversionRate": 0,
      "leadsBySource": {
        "sell-landing": 8,
        "home-value": 2,
        "flat-fee-listing": 1,
        "full-service-request": 1,
        "ses-integration-test": 1
      }
    }
  ],
  "summary": {
    "totalLeads": 13,
    "totalClosed": 0,
    "conversionRate": 0
  }
}
```

Frontend page at `/dashboard/performance/` was already coded to
this shape. No frontend work was required.

## Non-goals

- **Time-bucketed metrics** (leads this week / this month / YTD).
  Flat all-time numbers for MVP. Will add date filters when we
  have enough data for the filters to be meaningful.
- **Lead-source revenue attribution**. We don't have revenue
  tracking yet; Stripe integration is still FSBO-only.
- **Agent-level goals / quotas**. Future feature once we have
  more than one agent.

## Data access pattern

Reuses the same DynamoDB query pattern that `dashboard-leads` uses
for admin team views:

```
1. queryGSI1(`TEAM#${teamId}`) -> list of agent records
2. For each agentId: queryGSI1(`AGENT#${agentId}`, skBeginsWith 'LEAD#')
3. queryGSI1('AGENT#UNASSIGNED', skBeginsWith 'LEAD#') for unassigned
4. Aggregate in-memory: totalLeads, closedLeads, leadsBySource
5. Compute conversionRate = closedLeads / totalLeads
```

Limit 500 leads per query. For >500 leads per agent we'd need
pagination; not a concern at current volume (~20 total leads).

## Closed status detection

A lead counts as "closed" if its `data.status` is one of:
- `closed-won`
- `won`
- `closed`

Lowercase comparison. Other statuses (`new`, `contacted`, `qualified`,
`unqualified`, `closed-lost`) don't count toward conversion rate.

This matches how the CRM logs closures today. If status values
change, this list must be updated.

## Permission model

- **Required permission**: `view_team_performance`
- **Granted to**: `Team_Admin` role only
- **Denied to**: `Agent`, `Client` roles -> 403

Checked via `requirePermission(claims, 'view_team_performance',
correlationId)` at handler top. No bypass.

## Non-destructive

Read-only handler. No writes, no side effects. Safe to call
repeatedly (e.g., auto-refresh on the dashboard page).

## Performance characteristics

- Memory: 256 MB
- Timeout: 10s
- Typical latency: ~400ms for <50 leads (dominated by 2 DDB queries)
- Scales to ~500 leads per agent before needing pagination

## Tasks completed

- [x] `lambdas/dashboard-performance/index.ts` (140 lines)
- [x] GSI1 query pattern matching dashboard-leads admin path
- [x] In-memory aggregation into AgentMetric + summary
- [x] CORS headers on all responses (including preflight OPTIONS)
- [x] `view_team_performance` permission gate
- [x] CDK LAMBDA_CONFIGS entry
- [x] CDK ROUTES entry: GET /api/v1/dashboard/performance
- [x] package-lambdas.sh list updated
- [x] Deployed + verified: owner saw 13 leads, all unassigned,
      0 closed, 0% conversion as expected

## Open work

- [ ] Time-bucketed filters (this week, this month, YTD, custom range)
- [ ] Lead-source conversion rate (beyond volume) — % of
      home-value leads that close vs % of sell-landing, etc.
- [ ] Revenue attribution once Stripe FSBO converts are tracked
- [ ] Charts (bar chart of agents, pie of lead sources) using
      Cloudscape or Recharts

## Related

- `frontend/src/app/dashboard/performance/page.tsx` — existing
  frontend this spec made functional
- `lambdas/dashboard-leads/index.ts` — same GSI1 query pattern
- `lib/authorizer.ts` — `view_team_performance` permission
