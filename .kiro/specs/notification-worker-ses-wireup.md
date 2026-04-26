# notification-worker Needs Actual SES Wire-Up

Author: Kiro A, 2026-04-25. Status: needed before launch notifications
work. Est. 30-45 min for Kiro B.

## The gap

`lambdas/notification-worker/index.ts` currently logs notifications to
CloudWatch instead of sending real SES email. Line 233:

```ts
// MVP: log the notification. Production: SES send with retry.
console.log(`[notification-worker] Sending ${payload.type} notification to agent ${payload.agentId}`);
console.log(`[notification-worker] Email body:\n${emailBody}`);
```

When a FSBO intake arrives, nothing hits the owner's inbox. Owner has
to manually check the dashboard to see new leads. Not viable for launch.

## What Kiro B needs to do

### 1. Wire up actual SES send

In `lambdas/notification-worker/index.ts` `sendNotification()`, replace
the two `console.log` statements with a real SES call:

```ts
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const sesClient = new SESv2Client({ region: process.env['AWS_REGION'] ?? 'us-west-2' });

async function sendNotification(payload: NotificationPayload): Promise<void> {
  // ... existing prefs lookup ...

  if (emailPref === 'none') return;

  const emailBody = formatEmailBody(payload);
  const subject = buildSubject(payload);
  const toAddress = await getAgentEmailAddress(payload.agentId);
  const fromAddress = process.env['NOTIFICATION_FROM_ADDRESS'] ?? 'notifications@mesahomes.com';
  const replyToAddress = process.env['NOTIFICATION_REPLY_TO'] ?? 'sales@mesahomes.com';

  await sesClient.send(new SendEmailCommand({
    FromEmailAddress: fromAddress,
    Destination: { ToAddresses: [toAddress] },
    ReplyToAddresses: [replyToAddress],
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Text: { Data: emailBody, Charset: 'UTF-8' },
          Html: { Data: htmlEscape(emailBody).replace(/\n/g, '<br>'), Charset: 'UTF-8' },
        },
      },
    },
    // ConfigurationSetName removed — CDK no longer creates a config set
    // because Google Workspace manages email DNS. Add back if/when we
    // set up a MesaHomes-specific SES config set for bounce handling.
  }));

  console.log(`[notification-worker] Sent ${payload.type} notification to ${toAddress}`);
}

function buildSubject(payload: NotificationPayload): string {
  switch (payload.type) {
    case 'new_lead': return `New MesaHomes Lead: ${payload.leadName ?? 'Unknown'}`;
    case 'status_change': return `Lead Status Updated: ${payload.leadName ?? payload.leadId}`;
    default: return 'MesaHomes Notification';
  }
}

function htmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

### 2. Add email env vars to Lambda config

In `deploy/lambda-config.json` for `mesahomes-notification-worker`:

```json
"environment": {
  "MESAHOMES_TABLE": "mesahomes-main",
  "NOTIFICATION_FROM_ADDRESS": "notifications@mesahomes.com",
  "NOTIFICATION_REPLY_TO": "sales@mesahomes.com",
  "SES_CONFIG_SET": "mesahomes-default"
}
```

And in `infrastructure/cdk/stack.ts` under `LAMBDA_CONFIGS['notification-worker']`:

```ts
'notification-worker': {
  source: 'notification-worker',
  memory: 256,
  timeout: 10,
  env: {
    NOTIFICATION_FROM_ADDRESS: 'notifications@mesahomes.com',
    NOTIFICATION_REPLY_TO: 'sales@mesahomes.com',
    SES_CONFIG_SET: 'mesahomes-default',
  },
},
```

### 3. Send initial notifications to sales@mesahomes.com

Per owner: `sales@mesahomes.com` is the only active inbox initially. Every
agent's profile in DynamoDB will be seeded with this email until more
agents join. The current agent lookup path
(`getAgentEmailAddress(agentId)`) should fall back to
`sales@mesahomes.com` if the agent record doesn't have an email.

OR, simpler for MVP: wire up a single owner notification address env var
and skip the agent-specific routing:

```ts
// MVP behavior — all notifications to owner@
const toAddress = process.env['OWNER_NOTIFICATION_ADDRESS'] ?? 'sales@mesahomes.com';
```

Then the per-agent notification preferences become a Phase 2 improvement
when actual agents (not the owner) join the team.

### 4. Add SES send test

In `lambdas/notification-worker/index.test.ts`, add a test that mocks
the SESv2Client and verifies:
- `SendEmailCommand` is invoked once per notification
- `FromEmailAddress` matches the env var
- `ToAddresses` contains the expected recipient
- Subject matches the notification type
- Config set is attached

Don't add integration tests hitting real SES — too slow, flaky.

### 5. Verification

- `npx tsc --noEmit` — clean
- `npx vitest run` — all pre-existing tests + new SES mock test pass
- `cd frontend && npm run build` — clean
- `bash infrastructure/cdk/package-lambdas.sh` — clean

## Dependencies

- SES domain identity must be verified (`cdk deploy` creates this)
- SES production access must be granted (or test from a verified email
  only)
- `sales@mesahomes.com` must be receiving mail via Google Workspace (done
  by owner)

## Launch handoff

With this fix + `cdk deploy`:
- New FSBO intake → DynamoDB Stream → notification-worker Lambda
  → SES sends email to `sales@mesahomes.com`
- Owner gets Gmail notification within ~10 seconds
- Stripe test: after VHZ webhook marks listing paid, second SES email
  notifies owner of payment

## Commit message

```
feat(notifications): wire up SES send in notification-worker

Replace CloudWatch logs with real SES SendEmail calls. All notifications
route to OWNER_NOTIFICATION_ADDRESS (sales@mesahomes.com by default)
until multi-agent support is fleshed out in Phase 2.
```
