/**
 * Offer draft prompt — generates purchase offer key terms and draft text.
 *
 * Temperature: 0.2 | Max tokens: 500
 * Legal disclaimer required on every output.
 */

import { BANNED_PHRASES } from './constants.js';

export interface OfferDraftInput {
  propertyAddress: string;
  offeredPrice: number;
  earnestMoney: number;
  financingType: string;
  contingencies: string[];
  closingDate: string;
  buyerName?: string;
}

export interface OfferDraftOutput {
  keyTerms: {
    offeredPrice: string;
    earnestMoney: string;
    financingType: string;
    contingencies: string[];
    closingDate: string;
  };
  draftText: string;
  disclaimer: string;
  wordCount: number;
}

const LEGAL_DISCLAIMER = 'This is for educational purposes only and does not constitute legal advice. Consult a licensed real estate attorney before submitting any offer.';

export function buildOfferDraftPrompt(input: OfferDraftInput): {
  system: string;
  user: string;
} {
  const system = `You are a real estate offer draft assistant for Arizona residential transactions.

RULES:
- Output ONLY valid JSON: {"keyTerms": {...}, "draftText": "...", "disclaimer": "...", "wordCount": N}
- draftText: 200-400 words, plain English, covers all key terms
- ALWAYS include this exact disclaimer in the "disclaimer" field: "${LEGAL_DISCLAIMER}"
- Reference Arizona-specific contract conventions (BINSR, SPDS, AAR purchase contract)
- Never give legal advice — frame everything as "typical" or "common practice"
- Never use Fair Housing banned phrases

BANNED PHRASES:
${BANNED_PHRASES.join(', ')}`;

  const user = `Draft an offer for:
Property: ${input.propertyAddress}
Offered Price: $${input.offeredPrice.toLocaleString()}
Earnest Money: $${input.earnestMoney.toLocaleString()}
Financing: ${input.financingType}
Contingencies: ${input.contingencies.join(', ')}
Closing Date: ${input.closingDate}
${input.buyerName ? `Buyer: ${input.buyerName}` : ''}

Output JSON only.`;

  return { system, user };
}

export function validateOfferDraftOutput(output: unknown): string | null {
  if (!output || typeof output !== 'object') return 'Output is not an object';
  const o = output as Record<string, unknown>;
  if (typeof o.draftText !== 'string') return 'Missing draftText field';
  if (typeof o.disclaimer !== 'string') return 'Missing disclaimer field';
  if (!o.disclaimer.includes('educational purposes')) return 'Disclaimer missing required language';
  if (typeof o.keyTerms !== 'object') return 'Missing keyTerms object';
  return null;
}
