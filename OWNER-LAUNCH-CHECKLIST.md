# Owner Launch Checklist — MesaHomes MVP

**Status as of 2026-04-25:** Backend code complete, frontend complete,
visual upgrade complete, content gaps filled, build passing, 852 tests
green. Nothing left for Kiro A or Kiro B to do on code. What's below
is **entirely your work as the owner.**

Estimated total time: **4-8 hours spread over 1-2 days**, plus SES
production-access waiting (~24h), plus an end-to-end test.

---

## Track 1 — One-time AWS setup (45 min active + 24h waiting)

### 1.1 Refresh AWS credentials
```bash
aws sts get-caller-identity --profile Msahms
# Should return Account: 304052673868
```
If expired, refresh your AWS SSO or reissue your access keys.

### 1.2 Merge both branches to main
```bash
cd /workplace/nflos/Msahms
git checkout main && git pull
git merge --no-ff origin/agent/kiro-b-implementation
git merge --no-ff origin/agent/kiro-nflos-review
git push origin main
```
Conflicts expected on `lib/brokerage.ts`, `lib/brokerage.test.ts`,
`.gitignore`, `.kiro/STEERING.md`. Take Kiro B's versions for the
brokerage files (newer NEXT_PUBLIC dual-read). Take both sides merged
for the others.

### 1.3 Bootstrap CDK (one-time if not already done)
```bash
aws cloudformation describe-stacks --stack-name CDKToolkit --profile Msahms --region us-west-2 2>&1 | head -3
```
If that returns a stack, skip. Otherwise:
```bash
npx cdk bootstrap aws://304052673868/us-west-2 --profile Msahms
```

### 1.3.5 API Gateway CloudWatch Logs role (one-time, account-level)

Already done (2026-04-26). If ever recreating the account:

```bash
cat > /tmp/apig-trust.json <<'EOF'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"apigateway.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF
aws iam create-role --role-name APIGatewayCloudWatchLogsRole \
  --assume-role-policy-document file:///tmp/apig-trust.json --profile Msahms
aws iam attach-role-policy --role-name APIGatewayCloudWatchLogsRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs \
  --profile Msahms
sleep 20  # IAM propagation
aws apigateway update-account \
  --patch-operations op=replace,path=/cloudwatchRoleArn,value=arn:aws:iam::304052673868:role/APIGatewayCloudWatchLogsRole \
  --profile Msahms --region us-west-2
rm /tmp/apig-trust.json
```

### 1.4 Deploy backend infrastructure
```bash
bash infrastructure/cdk/package-lambdas.sh
npx cdk diff --profile Msahms    # review what will be created
npx cdk deploy --profile Msahms  # ~10 minutes first run
```

**If this is a fresh retry after a failed deploy**, see
`.kiro/DEPLOY_RECOVERY.md` first. Orphaned DynamoDB/S3/Cognito resources
from prior attempts must be cleaned up or imported before CDK succeeds.
Creates: DynamoDB table, Cognito pool, 2 S3 buckets, 14 Lambdas,
API Gateway with 32 routes, IAM roles for Lambda SES send,
EventBridge cron, DynamoDB Streams trigger.

**NOT created by CDK** (managed manually via Google Workspace + Route 53):
- SES domain identity + DKIM records (Google Workspace handles DKIM signing
  from sales@mesahomes.com and nick@virtualhomezone.com for inbound + sent)
- SPF + DMARC TXT records (set up manually earlier; include both Google and
  amazonses.com)
- 9 Secrets Manager entries (pre-populated before first cdk deploy —
  CDK imports them by name)

To enable outbound SES from Lambdas (for transactional notifications like
"new lead captured"), you'll still need to verify mesahomes.com as a
domain identity in SES Console AFTER deploy — this is a few clicks,
takes 2 min, can wait until post-launch.

Save the outputs printed at the end — you'll need ApiUrl,
UserPoolId, UserPoolClientId for step 1.8.

### 1.5 Populate Secrets Manager (BEFORE first cdk deploy)

Do this BEFORE running `cdk deploy`. Our CDK stack imports existing
secrets (`Secret.fromSecretNameV2`) rather than creating new ones, so
all 9 secrets must already exist in AWS Secrets Manager before the
stack is synthesized.

Generate the two HMAC secrets for VHZ handoff (write these down,
you'll need both on the VHZ side too):
```bash
VHZ_HANDOFF_HMAC=$(openssl rand -hex 32)
VHZ_WEBHOOK_HMAC=$(openssl rand -hex 32)
echo "Handoff HMAC: $VHZ_HANDOFF_HMAC"
echo "Webhook HMAC: $VHZ_WEBHOOK_HMAC"
```

Populate all 7 secrets:
```bash
aws secretsmanager put-secret-value --secret-id mesahomes/live/vhz-handoff-secret --secret-string "$VHZ_HANDOFF_HMAC" --profile Msahms --region us-west-2
aws secretsmanager put-secret-value --secret-id mesahomes/live/vhz-webhook-secret --secret-string "$VHZ_WEBHOOK_HMAC" --profile Msahms --region us-west-2

# These you need to obtain separately — see Track 2 for Stripe, Track 4 for SES:
aws secretsmanager put-secret-value --secret-id mesahomes/live/google-maps-api-key --secret-string "YOUR_GOOGLE_MAPS_KEY" --profile Msahms --region us-west-2
aws secretsmanager put-secret-value --secret-id mesahomes/live/stripe-secret-key --secret-string "PLACEHOLDER" --profile Msahms --region us-west-2
aws secretsmanager put-secret-value --secret-id mesahomes/live/stripe-webhook-secret --secret-string "PLACEHOLDER" --profile Msahms --region us-west-2
aws secretsmanager put-secret-value --secret-id mesahomes/live/rentcast-api-key --secret-string "YOUR_RENTCAST_KEY_OR_PLACEHOLDER" --profile Msahms --region us-west-2
aws secretsmanager put-secret-value --secret-id mesahomes/live/ses-smtp-credentials --secret-string '{"username":"","password":""}' --profile Msahms --region us-west-2
```

**Google Maps API key**: create at console.cloud.google.com → APIs →
Street View Static + Maps JavaScript. Restrict by HTTP referrer to
`*.mesahomes.com`. Free tier: 10K Street View fetches/month.

**Stripe keys**: placeholders for now. The MesaHomes-side Stripe is
only needed for the flat-fee tier (which is gated off with
`LISTINGS_PAYMENT_ENABLED=false`). FSBO uses VHZ's Stripe account
via Payment Links or webhook handoff — see Track 2.

### 1.6 Deploy CloudFront SPA rewrite function

See `infrastructure/cdk/README.md` section "CloudFront SPA Rewrite
Function" for the 7 CLI commands. Takes ~5 minutes. One-time.

### 1.7 Request SES production access

SES starts in sandbox mode (send to verified emails only). Request
production access:
- AWS Console → SES → Account Dashboard → "Request production access"
- Use case: "Transactional email — listing confirmations, lead alerts,
  password resets for MesaHomes flat-fee real estate platform"
- Expected volume: Start with 1,000/day, peak 5,000/day
- Compliance: "Only emails to users who submitted the lead form or
  signed up for the dashboard. Unsubscribe header on all marketing."

Usually approved within 24 hours. While waiting, verify your personal
email so you can still test the flow:
```bash
aws ses verify-email-identity --email-address your@email.com --profile Msahms --region us-west-2
```

### 1.8 Seed production DynamoDB

```bash
# Set frontend env vars from CDK outputs
cat > frontend/.env.production <<EOF
NEXT_PUBLIC_API_BASE=https://YOUR_API_ID.execute-api.us-west-2.amazonaws.com/prod/api/v1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-west-2_XXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=YYYYY
NEXT_PUBLIC_LISTINGS_PAYMENT_ENABLED=false
NEXT_PUBLIC_BROKER_OF_RECORD_NAME=
NEXT_PUBLIC_BROKER_OF_RECORD_LICENSE=
NEXT_PUBLIC_BROKER_OF_RECORD_BROKERAGE=
EOF

# Seed 6 cities + 3 blog posts
npx tsx deploy/seed-content.ts
```

### 1.9 Build and upload frontend

```bash
cd frontend && npm run build
aws s3 sync out/ s3://mesahomes.com/ --delete --profile Msahms --region us-west-1
aws cloudfront create-invalidation --distribution-id E3TBTUT3LJLAAT --paths "/*" --profile Msahms
```

Wait 2-5 minutes for CloudFront to invalidate.

### 1.10 Smoke test

Visit https://mesahomes.com in an incognito window:
- [ ] Homepage renders with bento grid, warm palette, Fraunces serif hero
- [ ] `/tools/home-value` form submits without error
- [ ] `/listing/fsbo` 4-step wizard progresses (don't submit yet)
- [ ] `/areas/mesa` renders the seeded city page
- [ ] `/blog` lists 3 seeded posts
- [ ] `/fsbo` educational landing loads
- [ ] `/faq` loads with 20 questions

If any 404/500, check CloudWatch Logs for the Lambda → fix → redeploy.

---

## Track 2 — Stripe / FSBO payment wiring

Two paths. Pick one.

### 2A — Soft launch with Stripe Payment Links (RECOMMENDED — 30 min)

Fastest path to revenue. You lose automatic status updates but gain
"FSBO shipping today" vs "FSBO shipping next week."

1. Log into Virtual Home Zone's Stripe dashboard
2. Products → Add Product:
   - "MesaHomes FSBO Starter" — one-time $299
   - "MesaHomes FSBO Standard" — one-time $549
   - "MesaHomes FSBO Pro" — one-time $899
3. For each product → Create Payment Link → copy URL
4. Tell Kiro B: "Going with option B (Payment Links). Links are:
   `starter: https://buy.stripe.com/...`,
   `standard: https://buy.stripe.com/...`,
   `pro: https://buy.stripe.com/...`"
5. Kiro B updates `FsboClient.tsx` to redirect directly to the
   matching Payment Link (~30 min code change)
6. After each FSBO payment: manually update listing status in your
   `/dashboard/listings` page to `paid`, trigger the photography
   booking email manually until you build Track 2B

### 2B — Full automated (2-4 hrs, build on your own timeline post-launch)

When you're ready to eliminate manual listing-status updates, build the
full VHZ `/checkout` + webhook flow. See
`.kiro/specs/pre-launch-punchlist.md` for the complete data contracts.
High-level steps:

1. On virtualhomezone.com, build a `/checkout` page that:
   - Reads query params from MesaHomes handoff
   - Verifies the `sig` HMAC using `VHZ_HANDOFF_HMAC`
   - Creates a Stripe Checkout Session with `metadata: {listing_id, lead_id, package}`
   - Redirects user to Stripe

2. On virtualhomezone.com, build a `/stripe-webhook` handler that:
   - Verifies the Stripe webhook signature
   - On `checkout.session.completed`, POSTs a JSON payload to
     `https://mesahomes.com/api/v1/listing/fsbo/vhz-webhook` with
     header `X-VHZ-Signature: sha256=<HMAC using VHZ_WEBHOOK_HMAC>`

3. When ready to switch from Payment Links → full flow: Kiro B flips
   `FsboClient.tsx` one line back to `redirectUrl` from the intake
   response. ~5 minute change.

---

## Track 3 — Broker partnership (not blocking FSBO launch)

Required before you can enable flat-fee ($999) or full-service tiers.
FSBO launches without this.

1. Identify a licensed Arizona designated broker willing to be Broker
   of Record
2. Execute a BoR agreement (per `.kiro/specs/flat-fee-legal-model.md`)
3. Update production environment variables:
   ```bash
   # via the Lambda console or CDK stack update
   BROKER_OF_RECORD_NAME="<broker full name>"
   BROKER_OF_RECORD_LICENSE="<AZ license number>"
   BROKER_OF_RECORD_BROKERAGE="<brokerage name>"
   NEXT_PUBLIC_BROKER_OF_RECORD_NAME="<broker full name>"
   NEXT_PUBLIC_BROKER_OF_RECORD_LICENSE="<AZ license number>"
   NEXT_PUBLIC_BROKER_OF_RECORD_BROKERAGE="<brokerage name>"
   LISTINGS_PAYMENT_ENABLED="true"
   NEXT_PUBLIC_LISTINGS_PAYMENT_ENABLED="true"
   ```
4. Redeploy frontend (`npm run build && aws s3 sync`)
5. Redeploy Lambdas (`bash infrastructure/cdk/package-lambdas.sh && cdk deploy`)

Now flat-fee and full-service tiers unlock.

---

## Track 4 — Optional but recommended for launch

### 4.1 ADRE license reactivation

If your salesperson license is currently inactive, reactivate before
having clients reach out. You're not practicing real estate yet — the
site is a lead-generation tool — but the disclaimers assume you're
licensed.

### 4.2 VHZ domain transfer completion

You started the transfer (in-flight at AWS, ETA 5-7 days). After it
completes:
- Create Route 53 hosted zone for `virtualhomezone.com`
- Update nameservers at GoDaddy to the 4 AWS NS records (if not
  already done when transfer completes — Route 53 may do it
  automatically)
- Issue ACM cert for `virtualhomezone.com` + `www.virtualhomezone.com`
- If rebuilding VHZ as a static site: create S3 bucket + CloudFront
  distribution, similar pattern to mesahomes.com

### 4.3 Google Analytics / Plausible

Not strictly needed for MVP, but useful to see if traffic is landing.
Task 18 event tracking captures conversion funnel data inside
DynamoDB, but you'll want aggregate traffic visibility. Plausible is
privacy-friendly and $9/mo for the first 10K visitors. Add a single
`<script>` tag in `frontend/src/app/layout.tsx` between `<head>` tags.

### 4.4 Real estate business email address

Before customers start emailing you via the contact forms, set up:
- `hello@mesahomes.com` — primary inbox
- `dmarc@mesahomes.com` — receives DMARC reports (usually empty)

Options:
- **Google Workspace**: $6/user/month, most reliable
- **Zoho Mail**: free for 5 users on custom domain
- **AWS SES inbound**: complex but free — S3 + Lambda fronted

Add MX records in Route 53 for whichever you pick. DMARC reports to
`dmarc@` will go unread initially, which is fine.

---

## Track 5 — Final go/no-go gate (before DNS flip matters)

Run this checklist. Don't accept incomplete answers:

- [ ] mesahomes.com loads in incognito over HTTPS
- [ ] Every page in top nav opens and renders (Home, Tools, Sell, Buy, Blog, About)
- [ ] Submit a test lead via `/tools/home-value` — see it in dashboard (after Cognito user creation)
- [ ] Submit a FSBO intake — verify redirect to Stripe (test mode or Payment Link)
- [ ] Pay with Stripe test card `4242 4242 4242 4242` — verify charge lands
- [ ] Verify listing marked `paid` (automated in flow A, manual in flow B with Payment Links)
- [ ] SES production access granted (check AWS console)
- [ ] Send a test email from your dashboard — verify delivery to your real inbox (not spam)
- [ ] Lighthouse mobile score: Performance ≥85, Accessibility ≥95
  (Chrome DevTools → Lighthouse → mobile audit)
- [ ] `/dashboard/leads/<any-test-id>` serves the LeadDetail client (CloudFront rewrite working)
- [ ] `robots.txt` and `sitemap.xml` accessible at their URLs

When all 10 pass, mesahomes.com is production-ready.

DNS already points to CloudFront, so "flipping DNS" is literally
nothing — the moment you finish step 1.9 (upload to S3 + invalidate),
the site is live.

---

## What's DONE (nothing needed from you)

- ✅ All Lambda code written and tested (852 tests, 0 TS errors)
- ✅ All frontend pages built (30+ pages, warm palette, bento grids)
- ✅ CDK stack synthesizes to 352 CloudFormation resources
- ✅ Content seed script with 6 cities + 3 blog posts
- ✅ FSBO landing page (`/fsbo`) + FAQ (`/faq`)
- ✅ SES CDK construct with DKIM/SPF/DMARC
- ✅ CloudFront SPA rewrite function written
- ✅ Static export builds clean
- ✅ VHZ domain transfer initiated (AWS tracks progress)
- ✅ mesahomes.com DNS already points to CloudFront

---

## What you will NOT do

- Rewrite any Lambda code
- Touch any frontend component
- Modify DynamoDB schema
- Deploy new Lambdas (CDK handles this)
- Debug TypeScript errors (there are none)
- Write any code on MesaHomes

The project is complete from a code perspective. Everything left is
**ops work** (AWS deploys, secrets, domain setup, Stripe configuration
in dashboards).

---

## TL;DR — what to do this weekend

**Hour 1**: Track 1 steps 1.1-1.5 (merge, deploy infra, populate secrets)

**Hour 2**: Track 1 steps 1.6-1.8 (CloudFront rewrite, SES request, seed content)

**Hour 3**: Track 1 step 1.9-1.10 (upload frontend, smoke test)

**Hour 4**: Track 2A (Stripe Payment Links + tell Kiro B to wire them up)

**Day 2**: Track 5 (final go/no-go), then push to friends/family for
first real FSBO intake.

Everything after that is content expansion, VHZ rebuild, Track 2B full
flow, broker partnership, and post-launch iteration.
