# Virtual Home Zone — Stand-Up Runbook

Author: Kiro A, 2026-04-25. Purpose: bring virtualhomezone.com live
on AWS infrastructure (like MesaHomes) without waiting for the
pending GoDaddy → Route 53 registrar transfer to complete.

## Background

**Transfer status**: `IN_PROGRESS`, step 7 of 14, waiting for GoDaddy
to auto-approve. Operation ID `6cbe8598-489b-4622-8ef4-3960d9c2c078`.

**Current VHZ site**: GoDaddy hosted "Launching Soon" placeholder
built in GoDaddy Website Builder. Nothing to preserve.

**AWS side**: completely empty of VHZ-related resources. Clean slate
for the rebuild.

**What VHZ does** (researched 2026-04-25 via Zillow profile + competitor analysis):
Full-service real estate media company serving greater Phoenix:
- Real estate photography (HDR, twilight, night, drone)
- Video production and cinematic reels
- Virtual tours (360° panoramic, 3D Matterport)
- Virtual staging
- Marketing kits (property websites, social templates)
- MLS upload services (input, description, photo upload)
- Event photography

## Step 1 — Resolve the pending transfer (pick ONE)

### Option A — Try to manually approve at GoDaddy (fastest, 10 min)

1. Log into GoDaddy → My Products → Domains → virtualhomezone.com
2. Look for any menu item like "Transfer Status" / "Outbound Transfer"
   / "Pending Transfer"
3. If there's a **"Approve Transfer"** button — click it
4. Transfer completes in hours (not 5-10 days)
5. AWS automatically assigns Route 53 nameservers after completion
6. Proceed to Step 2 (hosted zone already exists)

### Option B — Cancel the transfer, delegate DNS manually

If Option A isn't available:

1. AWS Console → Route 53 → Registered domains → Requests
   → find the pending `TRANSFER_IN_DOMAIN` → Cancel request
2. GoDaddy → domain → Transfer → Cancel outbound transfer (if still
   showing)
3. Refund is automatic for unfinished transfers
4. Proceed to Step 2 below

### Option C — Just wait (no action, 5-7 days)

Do nothing. Transfer completes on its own. Skip to Step 2 after that.

## Step 2 — Set up DNS on AWS

### If transfer completed (Options A or C):

Route 53 → Registered domains → virtualhomezone.com should now show
the domain with an auto-created hosted zone. The 4 AWS nameservers
are already set. Proceed to Step 3.

### If transfer cancelled (Option B):

```bash
aws route53 create-hosted-zone \
  --name virtualhomezone.com \
  --caller-reference "vhz-$(date +%s)" \
  --profile Msahms --region us-east-1

# Note the 4 NS records from the response, then:
```

Log into GoDaddy → virtualhomezone.com → DNS Management → Nameservers
→ Change to Custom → paste the 4 AWS nameservers → Save.

DNS propagates in ~5-60 minutes.

## Step 3 — Create Google Workspace email (nick@virtualhomezone.com)

Before Stripe account verification (needs a professional email):

1. Go to workspace.google.com → Get started
2. Business name: "Virtual Home Zone"
3. Number of employees: Just you
4. Current email for admin: your personal Gmail
5. Business domain: `virtualhomezone.com`
6. Pick a plan (Business Starter $6/user/month is fine)
7. Google provides TXT + MX records to add in Route 53:

```bash
# In Route 53 hosted zone for virtualhomezone.com, add:

# TXT for domain verification (one Google gives you)
# MX records for Gmail inbox (5 records with Google Apps priority 1, 5, 5, 10, 10)

# Use AWS CLI or the Route 53 console directly
```

8. Once TXT/MX records verify, create `nick@virtualhomezone.com` in
   Google Workspace Admin
9. Add SPF record (if not already done during MesaHomes SES setup):
   ```
   TXT @ "v=spf1 include:_spf.google.com ~all"
   ```
   Or if already present from SES, change to:
   ```
   TXT @ "v=spf1 include:amazonses.com include:_spf.google.com ~all"
   ```

Verify by sending yourself an email from Gmail to nick@virtualhomezone.com
and vice versa.

## Step 4 — Set up Stripe account

Log into stripe.com with nick@virtualhomezone.com:

### If VHZ already has a Stripe account (you mentioned this earlier):
- Log into the existing Stripe dashboard
- Complete any pending verification using nick@virtualhomezone.com
- Confirm the business is set up correctly (tax ID, bank account)

### If creating new:
1. Sign up at stripe.com with nick@virtualhomezone.com
2. Business details: Virtual Home Zone, sole proprietor or LLC
3. Tax ID (EIN if LLC, SSN if sole prop)
4. Bank account for payouts
5. Confirm identity (driver's license + selfie usually)

Usually takes 1-5 business days for account to be fully live.

## Step 5 — Create Stripe products for VHZ

Based on what a typical Mesa real-estate-media company offers, plus
the 3 MesaHomes FSBO package tiers:

### FSBO Tier Packages (these match MesaHomes pricing)
- **FSBO Starter — $299**
  - Daytime photography (20 photos)
  - MLS photo upload
  - 24-hour delivery
- **FSBO Standard — $549**
  - Photography package (40 photos)
  - 2D floor plan
  - Virtual tour (Matterport or 360°)
  - MLS photo upload
  - 48-hour delivery
- **FSBO Pro — $899**
  - Premium photography (60 photos)
  - Drone aerial photos
  - Video walkthrough (1-2 min cinematic)
  - 3D Matterport tour
  - Virtual staging (up to 3 rooms)
  - MLS photo + description upload
  - 72-hour delivery

### VHZ standalone products (separate from MesaHomes)
- Photography a la carte: $199 (20 photos, next-day)
- Drone add-on: $99
- Twilight session: $149
- Video reel: $299
- 3D Matterport: $199
- Virtual staging per room: $49
- Marketing kit (website + social templates): $199
- MLS upload service: $49

In Stripe dashboard → Products → Create each of the above with a Price.
Save the price IDs for later.

## Step 6 — Create Stripe Payment Links (for immediate payment)

Since the full VHZ `/checkout` page won't exist until the site is
rebuilt, use Payment Links for now:

1. Stripe Dashboard → Payment Links → Create
2. Select the FSBO Starter product → copy the URL (e.g.
   `https://buy.stripe.com/xxx...`)
3. Repeat for FSBO Standard and FSBO Pro
4. Save the 3 URLs — pass them to Kiro B for MesaHomes integration

## Step 7 — Give Kiro B the Payment Links (MesaHomes side)

Tell Kiro B:

> Going with Path B (Stripe Payment Links + lead-only mode).
>
> Payment Links:
> - Starter: https://buy.stripe.com/STARTER_LINK
> - Standard: https://buy.stripe.com/STANDARD_LINK
> - Pro: https://buy.stripe.com/PRO_LINK
>
> Implement from `.kiro/specs/fsbo-launch-mode-gate.md` with
> `NEXT_PUBLIC_FSBO_LAUNCH_MODE=payment-links`. The FSBO
> confirmation page should show the matching Payment Link based on
> `selectedPackage`. No redirect directly — show it as a clear button
> ("Complete Your $X Payment →") so user can confirm before leaving.

Kiro B updates `FsboClient.tsx` in ~30 min.

## Step 8 — VHZ site rebuild (Phase 2, not launch-blocking)

Once MesaHomes is launched and taking FSBO intakes + Payment Link
revenue, build the proper VHZ site on AWS:

### Architecture (mirrors MesaHomes)
- **S3 bucket** `virtualhomezone.com` with static website hosting
- **CloudFront distribution** + ACM cert in us-east-1
- **Route 53 aliases** to CloudFront
- **Next.js static site** with:
  - Homepage (hero + services overview)
  - /portfolio (sample galleries organized by property type)
  - /services (photography, video, 3D tours, virtual staging,
    marketing kits, MLS services)
  - /packages (FSBO tiers + a la carte)
  - /booking (calendar/scheduling)
  - /checkout (receives MesaHomes handoff, creates Stripe Session)
  - /contact
- **Optional: single Lambda + API Gateway** for:
  - /checkout POST → creates Stripe Checkout Session
  - /stripe-webhook → forwards payment confirmations to MesaHomes
- **CDK stack** (can reuse patterns from MesaHomesStack)

### Phase 2 timeline (after MesaHomes is live)
- Week 1: Next.js scaffold, hero, portfolio placeholder
- Week 2: Services page, packages page, contact
- Week 3: /checkout + /stripe-webhook (switches MesaHomes from Payment
  Links → signed handoff)
- Week 4: Booking calendar (Calendly embed or custom), portfolio
  content, launch

### When to switch MesaHomes from Payment Links to full handoff
Flip `NEXT_PUBLIC_FSBO_LAUNCH_MODE=stripe` on MesaHomes, rebuild
frontend, redeploy. ~10 min total.

## Step 9 — Redirect MesaHomes FSBO intake success page

Currently shown as "we'll email you within 24 hours." With Payment
Links wired via `NEXT_PUBLIC_FSBO_LAUNCH_MODE=payment-links`, the
confirmation should show:

> **Reserve your spot** — You selected the [FSBO Standard — $549]
> package. Click below to pay securely via Stripe. After payment,
> Virtual Home Zone will email you within 24 hours to schedule your
> photography.
>
> [Pay $549 Now →] ← links to matching Payment Link

## Step 10 — Final verification (matches MesaHomes smoke test)

Run after VHZ DNS is live + Google Workspace email is set up:

- [ ] `dig virtualhomezone.com` returns Route 53 nameservers
- [ ] `nick@virtualhomezone.com` can send + receive
- [ ] Stripe account shows "Active" (payouts enabled)
- [ ] 3 Payment Links return 200 OK when visited
- [ ] Test charge with `4242 4242 4242 4242` on each Payment Link
- [ ] Refund your own test charge
- [ ] (Later, after site rebuild) https://virtualhomezone.com loads
      with SSL

## Total effort estimate

Per-step times:

| Step | Effort | Owner time |
|------|--------|------------|
| 1. Transfer resolution | 10 min | ✅ |
| 2. DNS setup | 15 min | ✅ |
| 3. Google Workspace email | 25 min | ✅ |
| 4. Stripe account setup | 30 min - 5 days | ⚠️ Stripe verification wait |
| 5. Create Stripe products | 15 min | ✅ |
| 6. Create Payment Links | 5 min | ✅ |
| 7. Hand off to Kiro B | 5 min | ✅ |
| 8. VHZ site rebuild (Phase 2) | 3-5 weeks | 🔜 post-launch |
| 9. MesaHomes confirmation copy | 0 min | Kiro B does this |
| 10. Final verification | 15 min | ✅ |

Owner active time: ~2 hours (excluding Stripe verification wait)
Owner calendar time: 1-5 days

## MesaHomes dependency chain

- MesaHomes can launch **as soon as Step 7 happens**
- Step 7 depends on Step 6 (Payment Links)
- Step 6 depends on Step 4 (Stripe account — this is the slow part)
- Step 4 depends on Step 3 (nick@virtualhomezone.com for account
  verification)
- Step 3 depends on Step 2 (DNS control for MX records)

Critical path: Steps 1 → 2 → 3 → 4 → 5 → 6 → 7 → MesaHomes deploy.
Assuming Stripe takes 2 days to verify: **3 days from now to
MesaHomes live with FSBO payments.**

If Stripe verifies same-day: **same-day launch possible.**

## Cross-references

- `.kiro/specs/pre-launch-punchlist.md` — original Stripe handoff spec
- `.kiro/specs/fsbo-launch-mode-gate.md` — launch-mode env var for Kiro B
- `OWNER-LAUNCH-CHECKLIST.md` — main launch checklist (update Track 2
  after this runs)
- `infrastructure/cdk/README.md` — for Phase 2 CDK patterns when
  rebuilding VHZ on AWS
