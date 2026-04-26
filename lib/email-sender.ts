/**
 * Shared SES email sender used by all Lambdas that send user-facing mail.
 *
 * Not called by notification-worker (which has its own sender for owner
 * alerts) — that one uses `OWNER_NOTIFICATION_ADDRESS` and different
 * tone. This module is for transactional email TO users: lead capture
 * confirmations, home value reports, FSBO intake receipts, password
 * resets, etc.
 *
 * Env vars:
 *   EMAIL_FROM_ADDRESS   — default 'hello@mesahomes.com'
 *   EMAIL_REPLY_TO       — default 'sales@mesahomes.com'
 *
 * Usage:
 *   import { sendUserEmail } from '../../lib/email-sender.js';
 *   import { leadCaptureTemplate } from '../../lib/email-templates/lead-capture.js';
 *
 *   await sendUserEmail(user.email, leadCaptureTemplate, { name, toolSource });
 */

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const sesClient = new SESv2Client({
  region: process.env['AWS_REGION'] ?? 'us-west-2',
});

const FROM = process.env['EMAIL_FROM_ADDRESS'] ?? 'hello@mesahomes.com';
const REPLY_TO = process.env['EMAIL_REPLY_TO'] ?? 'sales@mesahomes.com';

/** Template shape — each email template exports one of these. */
export interface EmailTemplate<TData> {
  subject: (data: TData) => string;
  text: (data: TData) => string;
  html: (data: TData) => string;
}

/**
 * Send a user-facing transactional email.
 *
 * Returns void. Logs SES MessageId on success. Swallows and logs errors
 * so a failed email doesn't break the user's form submission. Lambda
 * callers should NOT await this in the critical path if they want to
 * guarantee low latency — use `.catch(console.error)` instead.
 */
export async function sendUserEmail<TData>(
  toAddress: string,
  template: EmailTemplate<TData>,
  data: TData,
): Promise<void> {
  if (!toAddress || !toAddress.includes('@')) {
    console.warn(`[email-sender] Invalid to address, skipping: ${toAddress}`);
    return;
  }

  try {
    const result = await sesClient.send(
      new SendEmailCommand({
        FromEmailAddress: FROM,
        Destination: { ToAddresses: [toAddress] },
        ReplyToAddresses: [REPLY_TO],
        Content: {
          Simple: {
            Subject: { Data: template.subject(data), Charset: 'UTF-8' },
            Body: {
              Text: { Data: template.text(data), Charset: 'UTF-8' },
              Html: { Data: template.html(data), Charset: 'UTF-8' },
            },
          },
        },
      }),
    );
    console.log(
      `[email-sender] Sent to ${toAddress}: messageId=${result.MessageId}`,
    );
  } catch (err) {
    console.error(`[email-sender] Failed to send to ${toAddress}:`, err);
  }
}

/**
 * Shared HTML wrapper — plain, human, no overdone marketing styling.
 * Paired with the text version by each template.
 */
export function wrapHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<style>
  body { font-family: Georgia, serif; color: #2A2824; line-height: 1.6; max-width: 560px; margin: 24px auto; padding: 0 16px; background: #FDFCF9; }
  a { color: #1B4D3E; }
  .footer { border-top: 1px solid #D9D3C6; margin-top: 32px; padding-top: 16px; font-size: 13px; color: #6B6861; }
</style>
</head><body>${bodyHtml}
<div class="footer">
<strong>MesaHomes</strong><br>
Your local source for Mesa, Arizona real estate.<br>
Reply to this email or reach us at <a href="mailto:sales@mesahomes.com">sales@mesahomes.com</a>.<br>
<a href="https://mesahomes.com">mesahomes.com</a>
</div></body></html>`;
}

/** HTML-escape helper. */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
