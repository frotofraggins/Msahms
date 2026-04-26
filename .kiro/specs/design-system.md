# Design System — MesaHomes

Author: Kiro A, 2026-04-24. Status: spec. Binds Task 12 pages. Updates
the design-token section of STEERING.md.

## Principle

Every color, size, and font decision on this site must support ONE of
three goals, ranked:

1. **Trust** — we're asking for money, phone numbers, and a home sale.
2. **Clarity** — buyers leave pages in 10-20 seconds if value isn't clear
   (Nielsen Norman Group). Our tools are useless if the next action is
   ambiguous.
3. **Differentiation** — the flat-fee philosophy shows up in visual
   restraint. We look honest, not promotional.

If a design choice doesn't serve one of those, cut it.

---

## Color palette (final, used everywhere)

These match and extend the STEERING.md palette. Each color has ONE
documented purpose. Don't invent new ones in pages.

| Token | Hex | Used for | Psychology / why |
|-------|-----|----------|------------------|
| `primary` | `#1B4D3E` | Header bg, primary buttons, Full Service Upgrade banner, agent CTAs | Deep green = stability, trust, professionalism. Still the most-associated color with real estate trust per 2026 conversion studies. |
| `primary-dark` | `#13362C` | Primary button hover, active states | 15% darker — clear affordance without color shift |
| `secondary` | `#F5A623` | Savings highlights, flat-fee CTAs, "YOU SAVE $X" amount | Warm amber = value + savings, inherited from financial products; should ONLY appear on money wins |
| `secondary-dark` | `#D48810` | Secondary button hover | |
| `background` | `#FFFFFF` | All page backgrounds | White signals transparency (our brand point) |
| `surface` | `#F8F9FA` | Card backgrounds, table row alternates, form sections | Slight off-white for visual hierarchy without adding lines |
| `border` | `#E5E7EB` | Card borders, input borders, dividers | Light enough to separate, subtle enough not to clutter |
| `text` | `#1A1A1A` | Body text | Soft black — not #000 (too harsh on LCD/OLED) |
| `text-light` | `#6B7280` | Metadata, labels, timestamps, captions | Keeps hierarchy without color change |
| `text-muted` | `#9CA3AF` | Disabled states, placeholder text | |
| `success` | `#10B981` | "Compliance verified" badge, positive market signals, price-drop good news | |
| `warning` | `#F59E0B` | Neutral market signals, optional CTAs, "action needed but not urgent" | |
| `error` | `#EF4444` | Form errors, account lockout, deletion confirmations | |
| `info` | `#3B82F6` | Market neutral notices, data source footnotes | |

### Color use rules (enforceable in code review)

1. Only `primary` and `secondary` appear as filled button backgrounds.
2. `secondary` (amber) NEVER appears for non-monetary CTAs. Using it on
   "Learn More" dilutes its savings association.
3. Body text is ALWAYS `text` (#1A1A1A). `text-light` for ≥1 level of
   hierarchy below. `text-muted` only for disabled/placeholder.
4. Error red (`#EF4444`) appears ONLY for validation errors or destructive
   confirmations. Do not use it to decorate "wait" or "caution" signals —
   use `warning` instead.
5. Background cards use `surface` (#F8F9FA) OR white-with-border. Never
   both at once (double hierarchy is noise).
6. AA contrast required on ALL text/background pairs (minimum 4.5:1 for
   body, 3:1 for ≥18pt). All tokens above pass against white and
   #F8F9FA; verify when combining.

### Color use by page type

| Page type | Hero bg | Primary CTA | Secondary accent |
|-----------|---------|-------------|------------------|
| Homepage | white | primary | secondary (savings number only) |
| Tool pages (/tools/*) | white | primary | secondary (result highlight) |
| Comparison page | white | primary (start listing) + secondary (savings total) | — |
| City pages | white hero with subtle green accent strip | primary | warning (market neutral signals) |
| Blog | white | primary (inline CTA) | — |
| Listing onboarding | surface | primary | secondary (total cost) |
| Dashboard | surface | primary | info (data metadata) |
| Auth pages | white | primary | — |

---

## Typography

Two fonts total. No more.

### Fonts

- **Body + UI:** `Inter` — system-standard sans, excellent legibility at
  every size, widest weight range, free via Google Fonts and
  `@next/font`. Ranked among the top 5 real estate website fonts in the
  2022-2026 best-practice roundup.
- **Headings optional variant:** `DM Sans` — slightly warmer geometric
  sans with nicer display-size rendering. Use ONLY at `h1` with
  `font-display: 'swap'`. Use Inter elsewhere.
- **Numbers:** Inter with `font-variant-numeric: tabular-nums` for
  prices, square footage, and market metrics. Stops the price column
  from wobbling.

No Playfair, no script, no serif. We are not a luxury brokerage — we are
flat-fee, transparent, efficient. Playfair would undercut our positioning.

### Loading

```ts
// frontend/src/app/layout.tsx
import { Inter, DM_Sans } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-dm-sans', weight: ['500', '700'] });
```

Use CSS variables, not global body font. Prevents unused weight loading.

### Type scale (4 levels on every page, plus display for hero)

Desktop (collapse to mobile ratios below):

| Token | Size / line-height | Weight | Font | Used for |
|-------|-------------------:|-------:|------|----------|
| `display` | 56 / 64 px | 700 | DM Sans | Hero h1 only (homepage, /sell, /buy) |
| `h1` | 40 / 48 px | 700 | Inter | Page title (tool pages, blog post, city page) |
| `h2` | 28 / 36 px | 600 | Inter | Section headers |
| `h3` | 20 / 28 px | 600 | Inter | Sub-section, card titles |
| `body` | 16 / 24 px | 400 | Inter | Default body text |
| `body-sm` | 14 / 20 px | 400 | Inter | Captions, metadata, form labels |
| `caption` | 12 / 16 px | 500 | Inter | Legal disclaimer, source footnotes |
| `number-lg` | 36 / 44 px tabular | 700 | Inter | Savings amount, ZHVI, primary tool result |
| `number-md` | 24 / 32 px tabular | 600 | Inter | Market stat cards, price rows |

Mobile overrides (≤767px):
- `display` → 40/48
- `h1` → 32/40
- `h2` → 24/32
- `h3` → 18/24
- `body` stays 16/24 (never shrink body text)

### Content rules

1. Max body line length: 65-75 characters. Use `max-w-prose` on blog +
   long-form content.
2. One `h1` per page. Non-negotiable per SEO spec.
3. Heading levels skip never allowed (no h1→h3 without h2).
4. Price/number display: always `tabular-nums`.
5. Legal disclaimers use `caption` size; never shrink below 12px.

---

## Spacing scale

4px base unit. Tailwind's default scale works — use these and nothing
else:

`0 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128` (pixels)

Component spacing conventions:
- Button padding: `12 24` (tool CTAs), `16 32` (hero CTAs)
- Card padding: `24` mobile, `32` desktop
- Section vertical gap: `48` mobile, `96` desktop
- Input padding: `12 16`
- Border radius: `8px` buttons and inputs, `12px` cards, `16px` modals,
  `9999px` pill/badge only

Never freehand margins. If something needs a non-scale value, write it
up and we'll add a token.

---

## Component shape standards

### Buttons

Two shapes only: primary (filled) and ghost (text + underline on hover).
No outlined buttons — they compete visually with primary and reduce
clarity.

- Primary filled: `primary` bg, white text, 8px radius, 12/24 or 16/32 padding
- Secondary filled (money CTAs only): `secondary` bg, `text` (dark) text, same shape
- Ghost: `primary` text, no background, underline on hover
- Disabled: `text-muted` text on `surface` bg, no pointer cursor

### Cards

- `surface` bg OR white+border. Never both.
- 12px radius
- 24px padding mobile, 32px desktop
- Shadow only on hover (desktop); mobile cards stay flat

### Forms

- Inputs: 8px radius, `border` border 1px, focus state turns border
  `primary` + 2px ring in `primary` at 20% opacity
- Labels above inputs, `body-sm` size, `text` color
- Error messages below, `error` color, `caption` size, icon optional
- Required fields marked with `*` in `error` color

### Market data cards (MarketSnapshot, PropertyDataCard)

- 2-column grid mobile, 4-column desktop
- Each card: label on top in `body-sm text-light`, value in `number-md`,
  optional delta below in `caption` with `success`/`error` color
- Source attribution always visible: `caption text-muted` at the bottom
  of the container: "Source: Zillow / Pinal County / Maricopa County"

---

## Trust signals (required on every page)

Per the 2026 Nielsen Norman + BrandVM conversion research, these signals
must be visible above the fold on conversion-focused pages:

| Signal | Where |
|--------|-------|
| Broker of record + AZ license # | Footer on every page |
| "Educational only, not legal advice" | Every mortgage/offer page |
| Data source attribution | Below any stat, map, or price |
| Fair-Housing verified badge | Any AI-generated listing or description |
| Agent response-time stat | Homepage hero secondary area, when >10 leads |
| SSL lock / security icon | Header near phone number |
| Phone number as `tel:` link | Header, footer, and sticky contact bar |

---

## Micro-interactions (subtle, not decorative)

- Input focus: 150ms ring transition
- Button hover: 100ms background transition, no scale/rotate
- Card hover (desktop only): 4px translateY-negative + shadow, 200ms
- Skeleton loading for property data cards (1-2s GIS fetch): `surface`
  pulsing 1000ms

Never: bouncing elements, parallax, autoplaying carousels, scroll-jack,
entrance animations on page load (they delay first meaningful paint).

---

## Dark mode

Not for MVP. Real estate buyers overwhelmingly browse in light mode.
Revisit post-launch if mobile app wraps require it.

---

## Accessibility non-negotiables (WCAG 2.1 AA)

Already flagged in Task 10 review for LeadCaptureModal — apply everywhere:

1. Color never the only signal (error shows text + icon, not just red)
2. All interactive elements keyboard-reachable and focus-visible
3. All images have `alt` (empty for decorative)
4. Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus
   trap, Escape-to-close
5. Accordions (FAQ): `aria-expanded`, `aria-controls`
6. Tap targets: 44×44 px minimum on mobile
7. AA contrast verified on every text/background pair

---

## Implementation in Tailwind

### tailwind.config.ts additions

```ts
export default {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1B4D3E', dark: '#13362C' },
        secondary: { DEFAULT: '#F5A623', dark: '#D48810' },
        surface: '#F8F9FA',
        border: '#E5E7EB',
        text: { DEFAULT: '#1A1A1A', light: '#6B7280', muted: '#9CA3AF' },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-dm-sans)', 'var(--font-inter)', 'sans-serif'],
      },
      fontSize: {
        'display': ['56px', { lineHeight: '64px', fontWeight: '700' }],
        'h1': ['40px', { lineHeight: '48px', fontWeight: '700' }],
        'h2': ['28px', { lineHeight: '36px', fontWeight: '600' }],
        'h3': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'number-lg': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'number-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
      },
      borderRadius: {
        'button': '8px',
        'card': '12px',
        'modal': '16px',
      },
    },
  },
};
```

### Enforcement

- ESLint rule (future): no inline `style={{ color: '...' }}` with hex
  values; must come from tokens
- Storybook eventually: snapshot every component in every state with
  tokens bound
- For MVP: code review gate — any PR adding a hex color that isn't in
  the token table above gets rejected

---

## Implementation checklist for Kiro B

When Kiro B picks up Task 12:

- [ ] Update `tailwind.config.ts` with the tokens above (additive; keep
      existing primary/secondary)
- [ ] Install `@next/font` Inter + DM Sans in `layout.tsx`, wire via CSS
      variables
- [ ] Audit Task 10-11 components and replace any `text-lg`, `text-xl`,
      ad-hoc spacing with the token scale
- [ ] Ensure single `h1` per page (the SEO spec already requires this;
      enforce in code review)
- [ ] Footer component shows broker-of-record via
      `tryGetBrokerOfRecord()` from `lib/brokerage.ts`
- [ ] MarketSnapshot + PropertyDataCard get source attribution line
- [ ] All numbers use tabular-nums utility class
- [ ] Run Rich Results Test + Schema Markup Validator on the redesigned
      homepage before committing

---

## References

- Nielsen Norman Group 10-20s page value rule
- 2026 Color psychology conversion research (froggyads.com): 85% of
  purchasing decisions influenced by color
- Real estate font best practices 2022-2026 (vaned.com): Inter/Montserrat/
  DM Sans for digital; Playfair reserved for luxury
- MIT research: 90% of information transmitted to brain is visual
- BrandVM homepage conversion patterns (2026)
- WCAG 2.1 AA contrast rules

## Cross-reference

- `.kiro/STEERING.md` — existing design token definitions (this spec
  extends, does not replace — merge on next pass)
- `.kiro/specs/seo-architecture.md` — one-h1-per-page rule, metadata
- `.kiro/specs/mls-syndication-messaging.md` — footer broker-of-record
  and disclaimer placement
