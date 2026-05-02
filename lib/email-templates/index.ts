/**
 * Barrel export for all email templates.
 *
 * Usage:
 *   import { leadCaptureTemplate } from '../../lib/email-templates/index.js';
 */
export { leadCaptureTemplate, type LeadCaptureData } from './lead-capture.js';
export { homeValueTemplate, type HomeValueData } from './home-value.js';
export { fsboIntakeTemplate, type FsboIntakeData } from './fsbo-intake.js';
export { bookingTemplate, type BookingData } from './booking.js';
export { welcomeTemplate, type WelcomeData } from './welcome.js';
export {
  passwordResetTemplate,
  type PasswordResetData,
} from './password-reset.js';
