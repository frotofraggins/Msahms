/**
 * Agent welcome email — sent when a Team_Admin creates a new agent
 * account or an agent self-registers.
 */
import { type EmailTemplate, wrapHtml, esc } from '../email-sender.js';

export interface WelcomeData {
  name: string;
  email: string;
  tempPassword?: string;
  dashboardUrl?: string;
}

export const welcomeTemplate: EmailTemplate<WelcomeData> = {
  subject: () => `Welcome to MesaHomes — your agent dashboard is ready`,

  text: (d) => `Hi ${d.name.split(' ')[0] ?? 'there'},

Your MesaHomes agent account is active.

Login email: ${d.email}${d.tempPassword ? `
Temporary password: ${d.tempPassword}` : ''}

Dashboard: ${d.dashboardUrl ?? 'https://mesahomes.com/auth/login'}

${d.tempPassword ? 'Change your password on first login.' : ''}

From the dashboard you can see new leads, manage listings, update your availability, and set notification preferences.

Questions? Reply to this email.

— Nick, MesaHomes`,

  html: (d) =>
    wrapHtml(`<p>Hi ${esc(d.name.split(' ')[0] ?? 'there')},</p>
<p>Your MesaHomes agent account is active.</p>
<table style="border-collapse: collapse; margin: 16px 0;">
<tr><td style="padding: 6px 12px;"><strong>Login email</strong></td><td style="padding: 6px 12px;">${esc(d.email)}</td></tr>
${d.tempPassword ? `<tr><td style="padding: 6px 12px;"><strong>Temp password</strong></td><td style="padding: 6px 12px; font-family: monospace;">${esc(d.tempPassword)}</td></tr>` : ''}
</table>
<p><a href="${esc(d.dashboardUrl ?? 'https://mesahomes.com/auth/login')}" style="display: inline-block; background: #1B4D3E; color: #FDFCF9; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Open dashboard →</a></p>
${d.tempPassword ? '<p><em>Change your password on first login.</em></p>' : ''}
<p>From the dashboard you can see new leads, manage listings, update your availability, and set notification preferences.</p>
<p>Questions? Reply to this email.</p>
<p>— Nick, MesaHomes</p>`),
};
