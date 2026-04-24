/**
 * AI Prompts Library — central registry for all AI-generated content.
 *
 * Every AI-generated string goes through a prompt defined here.
 * One prompt, one output format, one compliance gate.
 *
 * Runs on local RTX 4090 via Hydra MCP by default.
 * Falls back to Amazon Bedrock (Claude 3.5 Sonnet) when Hydra is unreachable.
 *
 * See .kiro/specs/ai-prompts-library.md for full spec.
 */

export { buildListingDescriptionPrompt, type ListingDescriptionInput, type ListingDescriptionOutput } from './listing-description.js';
export { buildOfferDraftPrompt, type OfferDraftInput, type OfferDraftOutput } from './offer-draft.js';
export { buildToolSummaryPrompt, type ToolSummaryInput, type ToolSummaryOutput } from './tool-summary.js';
export { buildCityIntroPrompt, type CityIntroInput, type CityIntroOutput } from './city-intro.js';
export { BANNED_PHRASES, FEATURE_PREMIUM_WORDS } from './constants.js';
