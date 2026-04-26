# Hydra AI Backend Integration

Status: ready to implement. **Scoped down version** — much of the
scaffolding already exists. Est. 1-1.5 hours total.

## What already exists (verified 2026-04-26)

Kiro B already shipped the AI infrastructure skeleton:

- ✅ `lambdas/ai-proxy/index.ts` — routes `/api/v1/ai/listing-description`
  and `/api/v1/ai/offer-draft`, handles request validation, error codes,
  CORS
- ✅ `lambdas/ai-proxy/compliance-filter.ts` — scans AI output for
  compliance violations (can't say "great investment," can't give legal
  advice, fair-housing red flags, etc.). Has property + unit tests.
- ✅ `lib/ai-prompts/` — 4 prompt templates (listing-description,
  offer-draft, tool-summary, city-intro) with constants file
- ✅ Frontend tool pages that call these endpoints and display results

**What the current Lambda does**: accepts requests, validates input,
builds a prompt via `lib/ai-prompts/`, **returns a mock response**,
runs the compliance filter over the mock response, returns to user.

Actual comment in the code:

> `/* For MVP: returns mock AI responses. The actual RTX 4090 MCP server
> integration will be configured at deployment. */`

## What's missing — just the model call

We need to replace the mock-response step with a real call to Hydra
running on the owner's desktop. Everything else (routing, prompts,
compliance, error handling) is already in place.

## Purpose

## Architecture

```
Browser (mesahomes.com)
  |
  v POST /api/v1/ai/listing-description { propertyData }
API Gateway
  |
  v
Lambda: ai-proxy
  |
  v HTTPS POST https://<ngrok-tunnel>/generate
ngrok tunnel (owner's desktop)
  |
  v HTTP localhost:11434
Ollama (running llama3.2 or similar)
  |
  v streaming or block response
Lambda: ai-proxy formats + returns
  |
  v
Browser gets MLS description, offer draft, etc.
```

Precedent: `stackpro-ollama-proxy` Lambda in this AWS account already does this pattern for StackPro. Reuse the same ngrok pattern and routing code style.

## Required Hydra-side work (owner or local dev assistant)

### 1. Hydra must expose a chat completion API

Ollama's default API lives at `http://localhost:11434/api/generate`. Hydra as a wrapper should either:
- (A) Pass through Ollama's API directly (simplest) — MesaHomes Lambda talks Ollama protocol
- (B) Expose a smaller shim API that normalizes to OpenAI chat completions format (future-proof if you swap models)

Recommend **option A for MVP**. Keep it simple.

Expected endpoint contract:
```
POST http://localhost:11434/api/generate
Content-Type: application/json

{
  "model": "llama3.2:latest",        // or whatever model the owner picks
  "prompt": "...",                   // the full prompt from ai-proxy
  "stream": false,                   // keep responses atomic for Lambda
  "options": {
    "temperature": 0.7,
    "num_predict": 512                // max output tokens
  }
}

Response (non-streaming):
{
  "model": "llama3.2:latest",
  "response": "The generated text...",
  "done": true
}
```

### 2. Hydra must be reachable from AWS Lambda

Two options:

#### Option A — ngrok tunnel (matches StackPro pattern, simplest)
```bash
# On the owner's desktop:
ngrok http 11434 --domain <reserved-domain>.ngrok-free.app
```
The reserved domain stays stable across sessions. Free tier gives one reserved domain; paid tier ($10/mo) gives more and faster tunnels.

Lambda calls `https://<reserved-domain>.ngrok-free.app/api/generate` with the ngrok token as auth header.

**Reliability note:** ngrok free tier has ~40 connections/minute throttle. Fine for early MVP traffic. Upgrade to ngrok paid when volume hits.

#### Option B — cloudflared tunnel (alternative, better free tier)
Cloudflare Tunnel is free, uses zero-trust access, and is more reliable than ngrok free tier. Requires a Cloudflare account (free).

```bash
cloudflared tunnel create hydra-mesahomes
cloudflared tunnel route dns hydra-mesahomes hydra.yourdomain.com
cloudflared tunnel run --url localhost:11434 hydra-mesahomes
```

Then Lambda hits `https://hydra.yourdomain.com/api/generate`. **Better choice if you want to avoid ngrok's limits.**

#### Option C — Tailscale (most secure, more complex)
If you want the tunnel to never be exposed to the public internet, Tailscale creates a private mesh network. Lambda-in-VPC would talk to your desktop via Tailscale. Requires VPC setup for Lambda (not currently configured).

**For MVP, recommend Option B (Cloudflare Tunnel).** Free, stable, no throttling.

### 3. Hydra must stay on during business hours minimum

Set expectations:
- Owner's desktop stays on Mon-Fri 8am-6pm AZ time (business hours)
- Model loaded in VRAM (llama3.2 8B fits easily on RTX 4090)
- Desktop sleep disabled during business hours

Failure mode: if desktop is off, MesaHomes Lambda calls timeout (30s) and returns a graceful "AI service temporarily unavailable" message to the user. Never crashes the page.

## Required AWS-side work (Kiro B or Cline)

### New Lambda environment variables

In `deploy/lambda-config.json` and `infrastructure/cdk/stack.ts`, add to `ai-proxy` Lambda:

```ts
'ai-proxy': {
  source: 'ai-proxy',
  memory: 512,
  timeout: 30,
  env: {
    AI_BACKEND: 'hydra',                    // 'hydra' | 'bedrock' | 'openai'
    HYDRA_TUNNEL_URL: 'https://hydra.yourdomain.com',  // or ngrok URL
    HYDRA_MODEL: 'llama3.2:latest',
    HYDRA_TIMEOUT_MS: '25000',
  },
},
```

When `AI_BACKEND=hydra`, the Lambda uses Hydra. Flip to `bedrock` or `openai` later with no code change.

### New Secrets Manager entry

If using ngrok paid tier with auth, add:
```
mesahomes/live/hydra-auth-token  (ngrok token or cloudflare service token)
```

### Lambda code change

`lambdas/ai-proxy/index.ts` currently has placeholder AI functions (per Kiro B's Task 6 notes). Refactor to:

```ts
// lib/ai-backend.ts
export interface AIBackend {
  generate(prompt: string, options?: { maxTokens?: number }): Promise<string>;
}

export async function getBackend(): Promise<AIBackend> {
  const backend = process.env['AI_BACKEND'] ?? 'hydra';
  switch (backend) {
    case 'hydra': return new HydraBackend();
    case 'bedrock': return new BedrockBackend();
    default: throw new Error(`Unknown backend: ${backend}`);
  }
}

class HydraBackend implements AIBackend {
  async generate(prompt: string, options = {}): Promise<string> {
    const url = process.env['HYDRA_TUNNEL_URL']!;
    const model = process.env['HYDRA_MODEL'] ?? 'llama3.2:latest';
    const timeoutMs = parseInt(process.env['HYDRA_TIMEOUT_MS'] ?? '25000', 10);
    const authToken = await getSecret('mesahomes/live/hydra-auth-token').catch(() => null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${url}/api/generate`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: { temperature: 0.7, num_predict: options.maxTokens ?? 512 },
        }),
      });
      if (!res.ok) throw new Error(`Hydra returned ${res.status}`);
      const data = await res.json() as { response: string };
      return data.response;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('AI service timeout');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
```

### Fallback handling

When Hydra is unreachable (desktop off, tunnel dropped):
1. Lambda catches timeout/network error
2. Returns structured error to frontend: `{ error: 'ai_temporarily_unavailable', message: 'AI features are taking a break — try again in a few minutes or contact us at sales@mesahomes.com' }`
3. Frontend shows friendly message, disables AI button, logs event to tracking

Do NOT silently swallow failures. User needs to know it didn't work.

### Prompt library

The existing `lib/ai-prompts/` already has 4 prompt templates (`listing-description`, `offer-draft`, `tool-summary`, `city-intro`). These feed into `ai-proxy` and are model-agnostic. Hydra will consume these prompts without modification.

**One consideration**: local models (llama3.2 8B) perform noticeably worse than Claude/GPT-4 on complex prompts. The existing prompts may need tuning for Hydra:
- Shorter prompts
- More explicit output format instructions ("respond with 200-250 words, no preamble")
- Lower temperature (0.5 instead of 0.7) for consistency
- Few-shot examples for format compliance

## Frontend considerations (Kiro B)

`frontend/src/app/tools/listing-generator/ListingGeneratorClient.tsx` and similar pages that call `api.aiListingDescription()` already show loading states. No frontend changes needed unless you want to:
- Add a "AI is thinking..." spinner that includes a subtle hint about occasional delays
- Display "Powered by local AI" badge on AI outputs during Hydra period (builds trust around your unique infrastructure)
- Track AI call success/failure in events (already covered by existing tracking.ts)

## Monitoring

In CloudWatch, create an alarm for:
- `ai-proxy` Lambda error rate > 10% over 15 min → emails sales@mesahomes.com
- `ai-proxy` Lambda duration p99 > 20s → warning

If alarms trigger, check:
1. Is desktop on?
2. Is Ollama running? (`ollama list` shows loaded models)
3. Is tunnel up? (`curl https://hydra.yourdomain.com/api/tags` should return model list)

## Cost estimate

| Item | Cost |
|---|---|
| Ollama + llama3.2 8B | $0 (owner's hardware) |
| Electricity | ~$20/mo if desktop 24/7 at ~200W |
| Cloudflare Tunnel | Free |
| ngrok paid (if chosen) | $10/mo |
| Lambda invocations | Negligible at early volume |
| **Total additional** | **$20-30/mo vs Bedrock's $5-50/mo** |

So Hydra isn't dramatically cheaper unless you value the local-data-never-leaves-your-desktop privacy angle. The real win: **full control of the model, no rate limits, no surprise bills, good learning exercise.**

## Upgrade trigger: when to swap to Bedrock

Hard trigger: if you get >100 AI API calls/day (i.e., AI features being used seriously by real users), flip `AI_BACKEND=bedrock`. Reasons:
- Bedrock 99.9% SLA vs "hope my desktop is on"
- Claude Haiku is materially better at real estate prose than llama3.2 8B
- Paying $5-20/mo for hosted inference is negligible at that volume
- You don't want customer-facing uptime tied to your desktop

Soft trigger: owner wants to close the laptop or leave town → bedrock is always-on, hydra is you-dependent.

## What the owner needs to do (step by step)

Tomorrow when rested:

1. **Set up Cloudflare Tunnel** (recommended over ngrok, 20 min)
   - Sign up at cloudflare.com (free)
   - Add a domain or subdomain you control (e.g., `hydra.mesahomes.com` or `hydra.allbusinesstools.com`)
   - Install `cloudflared` on desktop
   - Create tunnel, route DNS, run tunnel
   - Test: from outside the LAN, `curl https://hydra.yourdomain.com/api/tags` returns Ollama's model list

2. **Keep Ollama running** (5 min)
   - `ollama pull llama3.2` (or whichever model)
   - `ollama serve` (or configure as a system service)
   - Confirm: `curl localhost:11434/api/tags` returns models

3. **Populate the auth token secret** (2 min)
   - Generate a random bearer token: `openssl rand -hex 32`
   - Configure Cloudflare Tunnel to require this token OR configure Ollama to check `Authorization` header
   - Populate: `aws secretsmanager create-secret --name mesahomes/live/hydra-auth-token ...`

4. **Give Kiro B or Cline this spec** to implement the Lambda changes
   - Update `lib/ai-backend.ts` abstraction
   - Update `lambdas/ai-proxy/index.ts` to use backend abstraction
   - Add tests (mock fetch)
   - Deploy via `cdk deploy`

5. **Test end-to-end** (15 min)
   - Visit `https://mesahomes.com/tools/listing-generator`
   - Fill in a test property
   - Verify: request flows through → Hydra generates → response appears
   - Tail Lambda CloudWatch logs to confirm it's hitting Hydra, not erroring

6. **Verify fallback** (5 min)
   - Turn off Ollama (or unplug desktop)
   - Submit listing generator
   - Verify: frontend shows friendly error, doesn't crash
   - Turn back on

## Acceptance criteria

- [ ] POST `/api/v1/ai/listing-description` routes to Hydra when `AI_BACKEND=hydra`
- [ ] POST `/api/v1/ai/offer-draft` same
- [ ] When Hydra tunnel is up: responses return in <15s for typical prompts
- [ ] When Hydra tunnel is down: Lambda returns 503 with helpful message, doesn't hang
- [ ] Fallback: frontend displays friendly error, offers to email owner
- [ ] CloudWatch alarms configured
- [ ] Backend abstraction lets us switch to Bedrock by setting `AI_BACKEND=bedrock` + adding BedrockBackend class (future)
- [ ] Tests cover both success and failure paths in ai-backend.ts

## Open questions for owner

1. Which model? llama3.2:latest (8B, fast) vs llama3.3:70b (slower but better prose)? Recommend start with 8B.
2. Which domain for the tunnel? `hydra.mesahomes.com`? A subdomain of another domain you own? A raw ngrok URL? 
3. Acceptable downtime? If desktop sleeps overnight, AI features return errors 10pm-8am. Acceptable for MVP? (yes, per the "lead-only mode" launch approach)
4. Do you want to log prompts for debugging / model fine-tuning? If yes, log to DynamoDB with a TTL of 30 days. Flag any PII concerns.

## Cross-references

- `lib/ai-prompts/` — existing prompt templates (no changes needed)
- `lambdas/ai-proxy/` — current Lambda that currently has placeholder AI code; will be rewired
- `stackpro-ollama-proxy` Lambda (already in AWS account) — example of the ngrok-tunnel pattern
- `.kiro/specs/ai-prompts-library.md` — existing prompt design spec
- `OWNER-LAUNCH-CHECKLIST.md` — doesn't cover AI backend; add reference after this is implemented
