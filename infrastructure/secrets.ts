/**
 * AWS Secrets Manager secret definitions for the MesaHomes platform.
 *
 * Defines all secret paths stored in Secrets Manager. Lambda functions
 * retrieve these at runtime via the shared `lib/secrets.ts` helper —
 * keys are NEVER hardcoded in source, environment variables, or git.
 *
 * This module exports the secret names as a typed constant that can be
 * referenced by infrastructure-as-code and application code alike.
 */

/** Individual secret path constants. */
export const GOOGLE_MAPS_API_KEY_SECRET = 'mesahomes/google-maps-api-key';
export const STRIPE_SECRET_KEY_SECRET = 'mesahomes/stripe-secret-key';
export const STRIPE_WEBHOOK_SECRET_SECRET = 'mesahomes/stripe-webhook-secret';
export const RENTCAST_API_KEY_SECRET = 'mesahomes/rentcast-api-key';
export const COGNITO_CLIENT_SECRET_SECRET = 'mesahomes/cognito-client-secret';
export const SES_SMTP_CREDENTIALS_SECRET = 'mesahomes/ses-smtp-credentials';

/**
 * All Secrets Manager secret definitions for the MesaHomes platform.
 *
 * Each entry describes a secret stored in AWS Secrets Manager:
 * - `name` — the Secrets Manager secret ID / path
 * - `description` — human-readable purpose of the secret
 * - `service` — the external service or AWS service the secret belongs to
 */
export const MESAHOMES_SECRETS = [
  {
    name: GOOGLE_MAPS_API_KEY_SECRET,
    description: 'Google Maps API key for Street View and Aerial View',
    service: 'Google Maps',
  },
  {
    name: STRIPE_SECRET_KEY_SECRET,
    description: 'Stripe secret key for payment processing',
    service: 'Stripe',
  },
  {
    name: STRIPE_WEBHOOK_SECRET_SECRET,
    description: 'Stripe webhook signing secret for event verification',
    service: 'Stripe',
  },
  {
    name: RENTCAST_API_KEY_SECRET,
    description: 'RentCast API key for property data backup',
    service: 'RentCast',
  },
  {
    name: COGNITO_CLIENT_SECRET_SECRET,
    description: 'Cognito app client secret for authentication',
    service: 'AWS Cognito',
  },
  {
    name: SES_SMTP_CREDENTIALS_SECRET,
    description: 'SES SMTP credentials for transactional email',
    service: 'AWS SES',
  },
] as const;

/** Type representing a valid MesaHomes secret name. */
export type MesaHomesSecretName = (typeof MESAHOMES_SECRETS)[number]['name'];

/** Ordered list of all secret names for iteration / validation. */
export const MESAHOMES_SECRET_NAMES: readonly MesaHomesSecretName[] = MESAHOMES_SECRETS.map(
  (s) => s.name,
);
