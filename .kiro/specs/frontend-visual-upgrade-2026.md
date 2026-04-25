# Frontend Visual Upgrade — 2026 Conventions

Author: Kiro A, 2026-04-25. Status: execute after pre-launch punchlist
blockers are closed, BEFORE DNS flip. Est. ~6-10 hours of Kiro B's work.

## Why this exists

Kiro B's Task 10-12 frontend shipped functional but looks ~2022-era
generic: flat card grids, single-color hero, standard `text-5xl`
headings, no real motion design, no textural depth, no editorial
rhythm. Owner's critique was correct — it looks basic.

This spec brings it to 2026 conventions based on research from 5
authoritative sources (DMR Media luxury real estate 2026, EDigital 20
trends list, SERP Blocks component trends, DesignRush award gallery,
TREM Group real estate). Consensus patterns only — nothing on the
bleeding edge.

## Research sources

Reviewed and cross-referenced:

1. **DMR Media** — "7 Luxury Real Estate Website Design Trends 2026"
   (quiet luxury, earthy palettes, editorial typography, cinematic
   hero video)
2. **EDigital** — "20 Top Web Design Trends 2026" (bento grids, fluid
   variable fonts, glassmorphism, kinetic typography, dark mode,
   agentic AI integration, mobile-first vertical photography)
3. **SERP Blocks** — "Web Design Trends 2026: Components and Layouts
   Developers Love" (bento grids high staying power, dark-first,
   oversized typography, gradient mesh, micro-animations)
4. **DesignRush** — Best real estate designs 2026 gallery (pattern:
   Casaverse, Pantheon Development, DolceVita — all use asymmetric
   editorial layouts with oversized serifs)
5. **TREM Group** — "Real Estate Website Design Ideas 2026"
   (minimalist visuals, mobile-first, immersive virtual tours,
   CRM/AI integration, professional branding)

Where 3+ sources agreed, pattern was adopted. Anything appearing in
only 1-2 sources was rejected as fad (e.g. brutalism, heavy 3D,
kinetic scroll-jacking).

## The 8 patterns we're adopting

### 1. Quiet luxury palette (warm neutrals, not harsh black/white)

Current palette uses `primary #1B4D3E` (forest green) + `secondary
#F5A623` (orange). Keep primary but **warm up neutrals entirely**.

**Replace everywhere:**
- `text-[#1A1A1A]` / `text-black` → `text-[#2A2824]` (warm charcoal)
- `bg-white` → `bg-[#FDFCF9]` (warm off-white, paper feel)
- `bg-gray-50` → `bg-[#F5F2EC]` (warm beige surface)
- `bg-gray-100` → `bg-[#EDE8DE]` (warmer beige for elevated surfaces)
- `border-gray-200` → `border-[#D9D3C6]` (warm tan border)
- Keep `primary #1B4D3E` — it's a deep olive/forest that fits perfectly
- Keep `secondary #F5A623` but **use only for money wins** (price
  displays, big savings, CTA hover states). Spec from `design-system.md`.

Add two supporting tokens:
- `--surface-cream: #FAF6EE` (cards, elevated blocks)
- `--accent-olive: #707B4C` (tertiary accents, tags, meta text)

Research citation: DMR Media — "warm beiges, deep olives, and rich
charcoals instead of harsh blacks and whites." EDigital — "warm tones
replacing harsh contrasts."

### 2. Editorial typography (serif display + fluid scaling)

Current: Inter everywhere. Hero is `text-5xl md:text-6xl` (fixed
ramps). No serif for contrast, no fluid scaling.

**Upgrade to a paired serif + sans system:**

- **Display serif: Fraunces (Google Fonts, variable)** — luxury
  real estate convention. Modern serif with optical-size axis; works
  beautifully at 80-120px. Open source.
- **Body sans: Inter (kept)** — for UI and body text.
- **Tabular nums: Inter with `font-feature-settings: "tnum"`** on
  all price displays (already partially done).

Install via `next/font`:
```tsx
// frontend/src/app/layout.tsx
import { Fraunces, Inter } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz', 'SOFT'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
```

**Fluid typography (clamp-based, responsive without breakpoints):**

Replace fixed-size hero text with:
```css
.hero-display {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 1rem + 5vw, 6rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-variation-settings: "opsz" 72;
}
.section-heading {
  font-family: var(--font-display);
  font-size: clamp(1.875rem, 1rem + 2.5vw, 3.25rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
}
.tool-heading {
  font-family: var(--font-sans);
  font-size: clamp(1.5rem, 1rem + 1.25vw, 2.25rem);
  line-height: 1.2;
}
```

Research citation: EDigital — "variable fonts represent a technical
breakthrough that's now a cornerstone." DMR — "Custom, elegant serif
fonts for headlines that convey tradition and authority." SERP —
"hero headlines regularly exceed 72px on desktop."

### 3. Bento grid layouts (replace flat 3-col card grids)

Current tool pages and landing pages use uniform 3-column card grids.
In 2026 that reads as dated.

**Bento grid pattern** — asymmetric modular cards, some spanning 2 cols
or 2 rows. Use on:

- **Homepage tools section**: currently flat 6-card grid → bento
  layout with "Home Value Estimator" as 2x1 hero card, other 5 as 1x1.
- **`/areas/[slug]` city page**: currently stacked sections →
  bento grid combining market stats (1x1), school summary (2x1),
  neighborhoods (1x2), recent listings (2x2).
- **Homepage "why choose us" section**: instead of 3-column icon list,
  use a 4-cell bento with varying sizes showing: flat-fee pricing
  (large), verified listings (small), free tools (small), local data
  (medium).

Tailwind implementation:
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
  <Card className="md:col-span-2 md:row-span-2">Hero content</Card>
  <Card className="md:col-span-2">Wide content</Card>
  <Card>Standard</Card>
  <Card>Standard</Card>
  <Card className="md:col-span-2">Wide content</Card>
</div>
```

Research citation: SERP Blocks — "bento grid layout has gone from
niche to default. Staying power: High." EDigital — "modular bento
grid layouts." All 3 sources agree.

### 4. Full-bleed hero with scroll-triggered motion

Current homepage hero is a colored block with centered text and a
search bar. Functional but flat.

**Upgrade:**

- Full-bleed background: either drone-style image of Mesa/Gilbert
  mountains OR subtle animated gradient mesh as fallback
- Scroll-triggered parallax on hero photo (subtle — translate-y ~30px)
- Oversized serif headline using the `hero-display` fluid scale above
- Text-reveal animation on page load (staggered `fadeInUp` ~400ms)

For MVP, use a static high-quality Unsplash image of Superstition
Mountains OR commission Virtual Home Zone to shoot one piece of
drone cinematography (10 seconds, looped, muted) — VHZ's core
competency.

Photo-free fallback with gradient mesh:
```css
background:
  radial-gradient(at 20% 30%, #1B4D3E 0%, transparent 50%),
  radial-gradient(at 80% 20%, #707B4C 0%, transparent 40%),
  radial-gradient(at 40% 80%, #F5A623 0%, transparent 30%),
  #FAF6EE;
```

Research citation: DMR — "full-bleed, auto-playing video hero
sections... professional, cinematic drone footage." EDigital —
"Scroll Storytelling & Cinematic Experiences" and "Gradient Mesh
Backgrounds."

### 5. Micro-interactions on all interactive elements

Currently buttons have default Tailwind `hover:bg-{color}-600`. No
scroll-triggered motion, no hover depth on cards, no button-press
feedback.

**Add globally:**

- **Button press**: `active:scale-[0.98] transition-transform
  duration-100` on all `<button>` / `<a className="btn">`
- **Card hover**: subtle lift — `hover:shadow-xl hover:-translate-y-1
  transition-all duration-300` on all `Card` components that are
  clickable/link-wrapped
- **Link underline animation**: `after:w-0 hover:after:w-full
  after:transition-all` for content links (blog, nav)
- **Scroll reveal**: wrap major sections in a `<FadeInOnScroll>`
  component using `IntersectionObserver` + `opacity-0 translate-y-4`
  → `opacity-100 translate-y-0` with 500ms transition
- **Input focus**: `focus:ring-2 focus:ring-primary/30 focus:border-primary
  transition-all duration-150` (currently abrupt)

Build a `<FadeInOnScroll>` helper in
`frontend/src/components/animations/FadeInOnScroll.tsx`. Respect
`prefers-reduced-motion` by skipping animation when the media query
matches.

Research citation: EDigital — "subtle purposeful motion to guide
attention." DMR — "Subtle Hover Effects... Scroll-Triggered Animations...
Cursor Effects." SERP — "micro-animations for functional feedback —
improves UX — invest in this."

### 6. Textured background surfaces

Current backgrounds are flat solid colors. 2026 luxury real estate
pages use subtle paper/noise texture for depth.

Add a single low-opacity SVG noise pattern as a body background:
```css
body {
  background-color: #FDFCF9;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.035 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
```

Inline SVG noise — no HTTP request, 400 bytes, barely visible but
adds tactile warmth. Test at 3% opacity; adjust to taste.

Research citation: DMR — "Textured Backgrounds: Subtle noise, paper
textures, or soft gradients that add depth and a tactile feel."

### 7. Footer redesign — editorial, not utilitarian

Current footer (from my earlier review): basic 4-column link dump
with legal disclosure I wrote. Works, but the research shows 2026
footers are more editorial — larger brand statement, generous
whitespace, editorial typography.

**Structure:**
- Row 1: Oversized brand statement using the serif display font
  ("Real estate, simplified. Mesa, Arizona.") at `clamp(2rem, 1.5rem +
  2vw, 3.5rem)` in the olive-700 color
- Row 2: 3-column link grid (For Sellers | For Buyers | About) with
  increased spacing
- Row 3: the existing brokerage disclosure in smaller warm-gray text
- Row 4: copyright + social icons

Keep all current links. Just restructure visually.

### 8. Consistent elevation / shadow system

Current shadow usage is ad-hoc: `shadow`, `shadow-md`, `shadow-lg`
scattered through pages. Replace with a 3-tier elevation system
applied consistently:

```css
--shadow-sm: 0 1px 2px rgba(42, 40, 36, 0.04), 0 1px 3px rgba(42, 40, 36, 0.06);
--shadow-md: 0 4px 8px rgba(42, 40, 36, 0.04), 0 6px 16px rgba(42, 40, 36, 0.08);
--shadow-lg: 0 8px 16px rgba(42, 40, 36, 0.06), 0 16px 32px rgba(42, 40, 36, 0.12);
```

Note: warm-tinted shadows (using `#2A2824` base) — not pure black.
Makes the whole thing feel cohesive with the warm palette.

**Rule:** `shadow-sm` = surfaces (inputs, small cards); `shadow-md` =
content cards (tool cards, listing cards); `shadow-lg` = floating
elements (modals, dropdowns, hero cards on hover).

## Things we're NOT doing (explicit rejections)

Trends that appeared in the research but rejected for this MVP:

- **Dark mode toggle** — real estate is primarily consumed in daylight
  on mobile. Light-first. Would add complexity with no clear win.
  EDigital calls dark mode "as standard" but SERP Blocks caveats this
  applies to developer tools/SaaS dashboards, not real estate
  marketing sites. Reassess post-MVP if analytics show > 40% mobile
  users have system dark mode on.
- **Heavy 3D / WebGL** — performance cost too high for Lambda@Edge
  on 3G connections, which a chunk of Mesa buyer traffic will use.
  SERP Blocks flags "staying power medium-low for heavy 3D."
- **Hand-drawn scribble accents** — appropriate for startup/creative
  brands, off-brand for professional real estate per DMR Media.
- **Brutalism / anti-design** — not aligned with "quiet luxury"
  positioning.
- **AI chatbot** — premature. Task 18 event tracking data first,
  then evaluate post-launch.
- **Custom cursor effects** — mobile-hostile, flagged by DMR but
  inappropriate when 65%+ of traffic is mobile (TREM Group cites
  this number for real estate specifically).
- **Full-page scroll-jacking / cinematic horizontal scroll** — hurts
  SEO discoverability and accessibility; we rely heavily on SEO.

## Implementation plan — execution order

Do these in order for maximum visual impact per hour:

### Phase A: Token layer (~1 hour)

1. Update `frontend/tailwind.config.ts` with the new color tokens,
   font families, shadow system, and extended spacing scale
2. Install Fraunces via `next/font` in `layout.tsx`
3. Add the SVG noise texture to global CSS
4. Update the design-system spec to reflect what actually shipped

Commit: `style(design-tokens): 2026 quiet-luxury palette + fluid type`

### Phase B: Core components (~2 hours)

5. Update `Button.tsx` with active-scale + refined hover
6. Update `Card.tsx` with lift-on-hover + shadow-md default
7. Build `FadeInOnScroll.tsx` animation helper
8. Update `Header.tsx` and `Footer.tsx` with new editorial typography
   and bento-style footer restructure
9. Update input/form component focus states

Commit: `style(components): micro-interactions + warm palette migration`

### Phase C: Homepage hero + bento (~2 hours)

10. Rewrite homepage hero: full-bleed background (static image or
    gradient mesh), fluid serif display headline, scroll-reveal
11. Convert homepage "tools" section from flat grid to bento layout
12. Convert homepage "why MesaHomes" section to bento

Commit: `style(homepage): bento grid + oversized serif hero`

### Phase D: Marketing pages (~2 hours)

13. `/areas/[slug]` city pages: convert to bento layout
14. `/landing/*` intent pages: apply editorial type scale, full-bleed
    hero treatment
15. `/blog/[slug]`: editorial serif typography for post body, wider
    reading measure (65ch), pull-quote styling

Commit: `style(pages): bento city pages + editorial blog layout`

### Phase E: Tool pages + polish (~1-2 hours)

16. Tool pages: tighter form styling, wrap result cards in bento
    layouts where applicable (e.g. sell-now-or-wait results)
17. Dashboard: keep light-first, apply warm neutral palette, add
    subtle texture
18. FSBO intake flow: editorial headers on each step, progress
    indicator polish

Commit: `style(tools+dashboard): warm palette + refined spacing`

### Phase F: Verification (~30 min)

19. `npx tsc --noEmit` (frontend + backend) — 0 errors
20. `npx vitest run` — 783 tests still green
21. Build: `cd frontend && npm run build` — static export succeeds
22. Manual: scroll every page at 360px (iPhone SE), 1280px (laptop),
    1920px (desktop) — confirm fluid type scales, bento reflows to
    single column on mobile
23. Lighthouse mobile — performance ≥85, accessibility ≥95
24. Verify `prefers-reduced-motion` disables all animations

Commit: `style: verify 2026 upgrade — all tests pass, a11y 95+`

Total: ~6-10 hours depending on how polished Kiro B wants to go.

## Deliverable checklist

- [ ] Tailwind config updated with warm palette tokens
- [ ] Fraunces + Inter installed via `next/font`
- [ ] Fluid typography via `clamp()` applied to all headings
- [ ] Noise texture on `body` background
- [ ] Homepage uses bento grid + oversized serif hero
- [ ] City pages use bento layout
- [ ] Cards have lift-on-hover motion
- [ ] Buttons have press-scale motion
- [ ] `FadeInOnScroll` used on major sections
- [ ] Footer redesigned editorially
- [ ] 3-tier shadow system applied consistently
- [ ] `prefers-reduced-motion` respected globally
- [ ] Mobile tested at 360px (iPhone SE viewport)
- [ ] Lighthouse mobile performance ≥85, a11y ≥95
- [ ] All 783 tests still pass
- [ ] Frontend static export still builds

## If Kiro B pushes back on scope

The critical 80% is:
1. Warm palette migration (1 hour)
2. Fraunces + fluid typography (1 hour)
3. Homepage hero upgrade (1 hour)
4. One bento section (homepage tools) (45 min)

Even just those four in ~4 hours moves it from "basic 2022" to
"recognizably 2026." Everything else is polish.

## Cross-references

- `.kiro/specs/design-system.md` — the original design-system spec
  (this upgrades it with research-backed 2026 conventions)
- `.kiro/specs/pre-launch-punchlist.md` — execute that first, this
  after
- Owner's VHZ drone footage — usable as hero video content
- Research sources documented at top of this file — link back there
  for any implementation question
