/**
 * FSBO intake confirmation.
 *
 * Sent when someone completes the /listing/fsbo wizard. In lead-only
 * mode, explains photography is coming and we'll reach out within 24h.
 * In stripe mode, would link to the payment URL (not yet active).
 */
import { type EmailTemplate, wrapHtml, esc } from '../email-sender.js';

export interface FsboIntakeData {
  name: string;
  packageType: string;
  propertyAddress: string;
  listingId: string;
  launchMode: 'lead-only' | 'stripe' | 'payment-links';
  paymentUrl?: string;
}

function packagePrice(pkg: string): string {
  if (pkg.endsWith('starter')) return '$299';
  if (pkg.endsWith('standard')) return '$549';
  if (pkg.endsWith('pro')) return '$899';
  return '';
}

function packageName(pkg: string): string {
  return pkg.replace(/^fsbo-/, '').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const fsboIntakeTemplate: EmailTemplate<FsboIntakeData> = {
  subject: (d) => `Your MesaHomes FSBO ${packageName(d.packageType)} package — next steps`,

  text: (d) => `Hi ${d.name.split(' ')[0] ?? 'there'},

Your FSBO intake is in the queue for ${d.propertyAddress}.

Package: FSBO ${packageName(d.packageType)} (${packagePrice(d.packageType)})
Reference ID: ${d.listingId}

${d.launchMode === 'lead-only' ? `What happens next:
- We'll email you within 24 hours (usually same-day) to confirm photography scheduling.
- Virtual Home Zone, our media partner, will reach out to schedule your shoot.
- Payment is collected when we confirm the shoot date. No upfront payment needed yet.` : d.paymentUrl ? `What happens next:
1. Complete your payment: ${d.paymentUrl}
2. Virtual Home Zone will contact you within 24 hours of payment to schedule photography.
3. We handle the rest (listing prep, description, syndication).` : `We'll email you within 24 hours to confirm next steps.`}

Questions before then? Reply to this email or text (480) 269-0502.

— The MesaHomes Team`,

  html: (d) =>
    wrapHtml(`<p>Hi ${esc(d.name.split(' ')[0] ?? 'there')},</p>
<p>Your FSBO intake is in the queue for <strong>${esc(d.propertyAddress)}</strong>.</p>
<table style="border-collapse: collapse; margin: 16px 0;">
<tr><td style="padding: 6px 12px;"><strong>Package</strong></td><td style="padding: 6px 12px;">FSBO ${esc(packageName(d.packageType))} (${packagePrice(d.packageType)})</td></tr>
<tr><td style="padding: 6px 12px;"><strong>Reference ID</strong></td><td style="padding: 6px 12px; font-family: monospace; font-size: 12px;">${esc(d.listingId)}</td></tr>
</table>
${
  d.launchMode === 'lead-only'
    ? `<p><strong>What happens next:</strong></p>
<ul>
<li>We'll email you within 24 hours (usually same-day) to confirm photography scheduling.</li>
<li>Virtual Home Zone, our media partner, will reach out to schedule your shoot.</li>
<li>Payment is collected when we confirm the shoot date. No upfront payment needed yet.</li>
</ul>`
    : d.paymentUrl
      ? `<p><strong>What happens next:</strong></p>
<ol>
<li><a href="${esc(d.paymentUrl)}" style="display: inline-block; background: #1B4D3E; color: #FDFCF9; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin: 8px 0;">Complete your payment →</a></li>
<li>Virtual Home Zone will contact you within 24 hours of payment to schedule photography.</li>
<li>We handle the rest — listing prep, description, syndication.</li>
</ol>`
      : `<p>We'll email you within 24 hours to confirm next steps.</p>`
}
<p>Questions before then? Reply to this email or text <a href="tel:+14802690502">(480) 269-0502</a>.</p>
<p>— The MesaHomes Team</p>`),
};
