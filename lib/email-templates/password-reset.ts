/**
 * Password reset email — sent when agent requests password reset.
 */
import { type EmailTemplate, wrapHtml, esc } from '../email-sender.js';

export interface PasswordResetData {
  name: string;
  resetUrl: string;
  expiresIn?: string;
}

export const passwordResetTemplate: EmailTemplate<PasswordResetData> = {
  subject: () => `Reset your MesaHomes password`,

  text: (d) => `Hi ${d.name.split(' ')[0] ?? 'there'},

Someone (hopefully you) requested a password reset for your MesaHomes agent account.

Reset link: ${d.resetUrl}
${d.expiresIn ? `This link expires in ${d.expiresIn}.` : 'This link expires in 1 hour.'}

If you didn't request this, ignore this email. Your password is unchanged.

— MesaHomes`,

  html: (d) =>
    wrapHtml(`<p>Hi ${esc(d.name.split(' ')[0] ?? 'there')},</p>
<p>Someone (hopefully you) requested a password reset for your MesaHomes agent account.</p>
<p><a href="${esc(d.resetUrl)}" style="display: inline-block; background: #1B4D3E; color: #FDFCF9; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Reset password →</a></p>
<p><em>This link expires in ${esc(d.expiresIn ?? '1 hour')}.</em></p>
<p>If you didn't request this, ignore this email. Your password is unchanged.</p>
<p>— MesaHomes</p>`),
};
