/**
 * Lead capture confirmation — sent when a user submits any lead form
 * (home value request, affordability calc, contact form, any tool that
 * captures contact info).
 */
import { type EmailTemplate, wrapHtml, esc } from '../email-sender.js';

export interface LeadCaptureData {
  name: string;
  toolSource?: string;
}

function friendlySource(s?: string): string {
  if (!s) return 'your request';
  const map: Record<string, string> = {
    'home-value': 'home value estimate',
    'net-sheet': 'seller net sheet',
    affordability: 'affordability calculator',
    'listing-generator': 'AI listing generator',
    'offer-writer': 'offer draft',
    'sell-now-or-wait': 'sell-or-wait analysis',
    comparison: 'flat-fee vs agent comparison',
    'contact-form': 'message',
    'valuation-request': 'home valuation request',
    'full-service-request': 'full-service consultation request',
    'flat-fee-listing': 'flat-fee listing inquiry',
  };
  return map[s] ?? s.replace(/-/g, ' ');
}

export const leadCaptureTemplate: EmailTemplate<LeadCaptureData> = {
  subject: (d) => `Got your ${friendlySource(d.toolSource)} — MesaHomes`,

  text: (d) => `Hi ${d.name.split(' ')[0] ?? 'there'},

Thanks for your ${friendlySource(d.toolSource)}. It's in our queue.

Here's what happens next:
- We'll review your details within 24 hours (usually much faster during business hours).
- If we have a fit, we'll email back with specifics on how we can help.
- If there's anything time-sensitive, reply to this email or text (480) 269-0502.

MesaHomes isn't just flat-fee listings. We're the local source for Mesa-area real estate data — home values, market trends, HOA updates, city meetings. Whatever you need, we're here.

— The MesaHomes Team

--
Reply to this email with questions. Or check out our FAQ: https://mesahomes.com/faq`,

  html: (d) =>
    wrapHtml(`<p>Hi ${esc(d.name.split(' ')[0] ?? 'there')},</p>
<p>Thanks for your <strong>${esc(friendlySource(d.toolSource))}</strong>. It's in our queue.</p>
<p><strong>Here's what happens next:</strong></p>
<ul>
<li>We'll review your details within 24 hours, usually much faster during business hours.</li>
<li>If we have a fit, we'll email back with specifics on how we can help.</li>
<li>Anything time-sensitive? Reply to this email or text <a href="tel:+14802690502">(480) 269-0502</a>.</li>
</ul>
<p>MesaHomes isn't just flat-fee listings. We're the local source for Mesa-area real estate data — home values, market trends, HOA updates, city meetings. Whatever you need, we're here.</p>
<p>— The MesaHomes Team</p>`),
};
