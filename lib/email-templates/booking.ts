/**
 * Booking confirmation — sent when user completes /booking form.
 */
import { type EmailTemplate, wrapHtml, esc } from '../email-sender.js';

export interface BookingData {
  name: string;
  intent: string;
  preferredTime?: string;
}

function friendlyIntent(i: string): string {
  const map: Record<string, string> = {
    seller: 'selling your home',
    buyer: 'buying a home',
    'flat-fee': 'flat-fee listing',
    fsbo: 'FSBO packages',
    'home-value': 'home valuation',
    other: 'real estate questions',
  };
  return map[i] ?? i.replace(/-/g, ' ');
}

export const bookingTemplate: EmailTemplate<BookingData> = {
  subject: () => `MesaHomes consultation request — we'll be in touch`,

  text: (d) => `Hi ${d.name.split(' ')[0] ?? 'there'},

Thanks for booking a consultation about ${friendlyIntent(d.intent)}.

${d.preferredTime ? `You asked for: ${d.preferredTime}` : ''}
We'll call you within 24 hours to confirm the time, usually same-day during business hours.

Before our call, it helps to think about:
- What's driving your timeline? (job relocation, life change, market watching, etc.)
- What matters most? (sale price, speed, low hassle, etc.)
- Any properties or neighborhoods you're already targeting?

No prep required. We'll cover these on the call.

— The MesaHomes Team

Reply here or text (480) 269-0502 if anything changes.`,

  html: (d) =>
    wrapHtml(`<p>Hi ${esc(d.name.split(' ')[0] ?? 'there')},</p>
<p>Thanks for booking a consultation about <strong>${esc(friendlyIntent(d.intent))}</strong>.</p>
${d.preferredTime ? `<p>You asked for: <strong>${esc(d.preferredTime)}</strong></p>` : ''}
<p>We'll call you within 24 hours to confirm the time, usually same-day during business hours.</p>
<p><strong>Before our call, it helps to think about:</strong></p>
<ul>
<li>What's driving your timeline — job relocation, life change, market watching?</li>
<li>What matters most — sale price, speed, low hassle?</li>
<li>Any properties or neighborhoods you're already targeting?</li>
</ul>
<p>No prep required. We'll cover these on the call.</p>
<p>— The MesaHomes Team</p>
<p><em>Reply to this email or text <a href="tel:+14802690502">(480) 269-0502</a> if anything changes.</em></p>`),
};
