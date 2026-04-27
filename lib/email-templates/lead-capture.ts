/**
 * Lead capture confirmation — sent when a user submits any lead form
 * (home value request, affordability calc, contact form, any tool that
 * captures contact info).
 *
 * Body is branched by `toolSource` via welcome-steps.ts so buyers,
 * sellers, and tool-specific prospects each get path-specific next
 * steps instead of a generic acknowledgement.
 */
import { type EmailTemplate, wrapHtml, esc } from '../email-sender.js';
import { getStepsForSource } from './welcome-steps.js';

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

  text: (d) => {
    const { intro, steps, cta } = getStepsForSource(d.toolSource);
    return `Hi ${d.name.split(' ')[0] ?? 'there'},

Thanks for your ${friendlySource(d.toolSource)}. It's in our queue.

${intro}
${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
${cta ? `\n${cta.label}: ${cta.url}\n` : ''}
MesaHomes isn't just flat-fee listings. We're the local source for Mesa-area real estate data — home values, market trends, HOA updates, city meetings. Whatever you need, we're here.

— The MesaHomes Team

--
Reply to this email with questions. Or check out our FAQ: https://mesahomes.com/faq`;
  },

  html: (d) => {
    const { intro, steps, cta } = getStepsForSource(d.toolSource);
    return wrapHtml(`<p>Hi ${esc(d.name.split(' ')[0] ?? 'there')},</p>
<p>Thanks for your <strong>${esc(friendlySource(d.toolSource))}</strong>. It's in our queue.</p>
<p><strong>${esc(intro)}</strong></p>
<ol>
${steps.map((s) => `<li>${esc(s)}</li>`).join('\n')}
</ol>
${cta ? `<p><a href="${esc(cta.url)}" style="display:inline-block;padding:10px 20px;background:#9C6644;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">${esc(cta.label)}</a></p>` : ''}
<p>Anything time-sensitive? Reply to this email or text <a href="tel:+14802690502">(480) 269-0502</a>.</p>
<p>MesaHomes isn't just flat-fee listings. We're the local source for Mesa-area real estate data — home values, market trends, HOA updates, city meetings.</p>
<p>— The MesaHomes Team</p>`);
  },
};
