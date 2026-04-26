/**
 * Home value request confirmation.
 *
 * Sent when someone submits /tools/home-value. Includes the estimate
 * they saw on-screen so they have it on record.
 */
import { type EmailTemplate, wrapHtml, esc } from '../email-sender.js';

export interface HomeValueData {
  name: string;
  address: string;
  estimatedValue: number;
  salePrice?: number;
  yearBuilt?: number;
  sqft?: number;
}

function fmtMoney(n: number): string {
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export const homeValueTemplate: EmailTemplate<HomeValueData> = {
  subject: (d) => `Your home value estimate: ${fmtMoney(d.estimatedValue)}`,

  text: (d) => `Hi ${d.name.split(' ')[0] ?? 'there'},

Here's the estimate we ran for ${d.address}:

Estimated value: ${fmtMoney(d.estimatedValue)}${d.salePrice ? `
Last sale on record: ${fmtMoney(d.salePrice)}` : ''}${d.sqft ? `
Square feet: ${d.sqft.toLocaleString()}` : ''}${d.yearBuilt ? `
Year built: ${d.yearBuilt}` : ''}

A few things worth knowing:
- This is an estimate from county records plus Zillow Home Value Index data. Not an appraisal.
- Actual sale price depends on condition, updates, market timing, and how you list.
- For a real CMA (comparable market analysis), reply to this email with your goal (selling, refinancing, just curious) and we'll put something together.

Want to run the numbers on selling? Our net sheet calculator shows exactly what you'd walk away with at different price points: https://mesahomes.com/tools/net-sheet

— The MesaHomes Team`,

  html: (d) =>
    wrapHtml(`<p>Hi ${esc(d.name.split(' ')[0] ?? 'there')},</p>
<p>Here's the estimate we ran for <strong>${esc(d.address)}</strong>:</p>
<table style="border-collapse: collapse; margin: 16px 0;">
<tr><td style="padding: 6px 12px; font-weight: bold;">Estimated value</td><td style="padding: 6px 12px; color: #1B4D3E; font-size: 18px; font-weight: bold;">${fmtMoney(d.estimatedValue)}</td></tr>
${d.salePrice ? `<tr><td style="padding: 6px 12px;">Last sale on record</td><td style="padding: 6px 12px;">${fmtMoney(d.salePrice)}</td></tr>` : ''}
${d.sqft ? `<tr><td style="padding: 6px 12px;">Square feet</td><td style="padding: 6px 12px;">${d.sqft.toLocaleString()}</td></tr>` : ''}
${d.yearBuilt ? `<tr><td style="padding: 6px 12px;">Year built</td><td style="padding: 6px 12px;">${d.yearBuilt}</td></tr>` : ''}
</table>
<p><strong>A few things worth knowing:</strong></p>
<ul>
<li>This is an estimate from county records plus Zillow Home Value Index data. Not an appraisal.</li>
<li>Actual sale price depends on condition, updates, market timing, and how you list.</li>
<li>For a real CMA, reply with your goal (selling, refinancing, just curious) and we'll put something together.</li>
</ul>
<p>Want to run the numbers on selling? Our <a href="https://mesahomes.com/tools/net-sheet">net sheet calculator</a> shows exactly what you'd walk away with at different price points.</p>
<p>— The MesaHomes Team</p>`),
};
