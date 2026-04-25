# Kiro B — Frontend Visual Upgrade Handoff

**Status**: All 3 pre-launch blockers closed ✅. Before merge + DNS flip,
we need one more round of work: bringing the frontend to 2026 visual
conventions. The owner flagged the current pages as looking "basic".

**Source of truth**: `.kiro/specs/frontend-visual-upgrade-2026.md` on
the `agent/kiro-nflos-review` branch. Read that spec first — it has
research citations from 5 sources, 8 patterns to adopt, 6 explicit
rejections with reasons.

## What changed in your world

Merge `agent/kiro-nflos-review` into your branch first to pick up the
new spec, then execute from it.

```bash
git fetch origin
git merge origin/agent/kiro-nflos-review --no-edit
# The spec file is purely additive — zero conflict surface
```

## Execute in this order (from the spec)

**Critical 80% (~4 hours)** — do these four even if you skip the rest:

1. **Phase A: Tailwind tokens + Fraunces font** (~1 hr)
   - Warm palette: `#2A2824` charcoal, `#FDFCF9` paper white, `#F5F2EC`
     beige, `#707B4C` olive accent. Keep primary `#1B4D3E`, keep
     secondary `#F5A623` for money-wins only.
   - Install Fraunces variable serif via `next/font`, expose as
     `var(--font-display)`
   - Add SVG noise texture to body background
   - Tailwind config: new color tokens + 3-tier shadow system +
     font family extensions

2. **Phase B: Core components** (~2 hrs)
   - Button: `active:scale-[0.98] transition-transform duration-100`
   - Card: `hover:shadow-xl hover:-translate-y-1 transition-all duration-300`
   - `<FadeInOnScroll>` helper with IntersectionObserver + respect
     `prefers-reduced-motion`
   - Header / Footer: editorial typography, bento-style footer link
     layout, keep brokerage disclosure

3. **Phase C: Homepage** (~2 hrs)
   - Hero: full-bleed background (static Mesa/Superstition image OR
     gradient mesh fallback), fluid serif headline with
     `clamp(2.5rem, 1rem + 5vw, 6rem)`, scroll-reveal animation
   - Replace flat 3-col tools grid with bento layout (one 2x1 hero
     card + five 1x1)
   - Replace flat "why choose us" section with bento

**Nice-to-have (~4-6 hrs more):**

4. **Phase D**: city pages `/areas/[slug]` → bento; blog → editorial
   serif body; intent landing pages → full-bleed hero treatment
5. **Phase E**: tool result cards in bento where applicable; dashboard
   keep light-first but migrate to warm neutrals; FSBO intake step
   headers in Fraunces
6. **Phase F**: verification gate before commit

## Verification gate (non-negotiable)

Before your final commit:

- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npx vitest run` — all 814 tests still pass
- [ ] `cd frontend && npm run build` — static export succeeds
- [ ] Manual at 360px viewport (iPhone SE): bento reflows to single
      column, fluid type scales, nothing cuts off
- [ ] Lighthouse mobile: Performance ≥85, Accessibility ≥95
- [ ] `prefers-reduced-motion: reduce` disables all animations

If Lighthouse accessibility drops below 95 after changes, fix before
committing. Most likely culprit will be contrast ratios on the warm
palette — check with axe DevTools or `npx lighthouse` against a local
dev server.

## Commits

Group your work into phase commits per the spec:
- `style(design-tokens): 2026 quiet-luxury palette + fluid type`
- `style(components): micro-interactions + warm palette migration`
- `style(homepage): bento grid + oversized serif hero`
- `style(pages): bento city pages + editorial blog layout`
- `style(tools+dashboard): warm palette + refined spacing`
- `style: verify 2026 upgrade — all tests pass, a11y 95+`

## Then we're truly ready to merge

After the visual upgrade commits land, we merge in this order to main:

```bash
git checkout main && git pull
git merge --no-ff origin/agent/kiro-b-implementation
git merge --no-ff origin/agent/kiro-nflos-review
git push origin main
```

Expected: both branches merge cleanly. The visual upgrade spec on my
branch is docs-only (no code conflicts). Your implementation on your
branch is entirely new files + modifications to files we agreed on.

## Questions to flag while executing

If any of these come up, stop and ask:

- Accessibility fails despite fixes (needs broader contrast/palette rework)
- Bundle size increases > 30KB gzipped (Fraunces + noise should be
  flat; anything else is suspect)
- A page becomes noticeably slower on 3G simulation
- Tailwind `content: []` glob misses new classes (JIT won't emit them)

Ship it.
