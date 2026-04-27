/**
 * Per-source next-steps content for lead welcome emails.
 *
 * Keyed by `toolSource` from the lead form. Each entry returns plain-text
 * lines (rendered as <ul><li> in HTML, bullet lines in plain text).
 *
 * When a new tool/landing ships, add its toolSource here so the lead
 * gets a path-specific welcome instead of the generic fallback.
 */

export interface StepContent {
  /** Headline shown after "Here's what happens next:" */
  intro: string;
  /** Ordered bullet steps. */
  steps: string[];
  /** Optional deep-link the user should visit next. */
  cta?: { label: string; url: string };
}

const FALLBACK: StepContent = {
  intro: "Here's what happens next:",
  steps: [
    "We'll review your request within 24 hours (usually much faster during business hours).",
    "If we're a good fit, we'll email back with specifics on how we can help.",
    "Anything time-sensitive? Reply to this email or text (480) 269-0502.",
  ],
};

const STEP_MAP: Record<string, StepContent> = {
  // ---- Sellers ----
  'home-value': {
    intro: 'Here are your next steps for a home valuation:',
    steps: [
      'We\'ll pull county records, recent Mesa-area comps, and current market trends for your address.',
      'Within 24 hours you\'ll get a detailed valuation report with low/high/most-likely price ranges.',
      'If you\'re ready to list, we can walk you through the $999 Mesa Listing Service or full-service options.',
    ],
    cta: { label: 'Compare our listing options', url: 'https://mesahomes.com/sell' },
  },
  'net-sheet': {
    intro: 'Here\'s what happens after your net-sheet calculation:',
    steps: [
      'Your detailed net-sheet is saved to the email you provided.',
      'We\'ll follow up with a free home valuation so your estimate uses your real list price.',
      'When you\'re ready to list, we offer $999 flat-fee MLS or traditional full-service.',
    ],
    cta: { label: 'Start a flat-fee listing', url: 'https://mesahomes.com/listing/start' },
  },
  'sell-now-or-wait': {
    intro: 'Here\'s what happens after your timing analysis:',
    steps: [
      'You already have our rate-vs-price modeling for your target window.',
      'Within 24 hours we\'ll send a personalized recommendation based on current Phoenix metro data.',
      'If you decide to move forward, we can list at $999 or represent you full-service.',
    ],
  },
  'listing-generator': {
    intro: 'Here\'s what happens next with your AI listing description:',
    steps: [
      'Your listing copy is in your inbox. Edit freely before using it.',
      'When you\'re ready to list on MLS, our $999 Mesa Listing Service gets you on Zillow, Realtor.com, Redfin in 24-48 hours.',
      'Need professional photos + listing prep? Our FSBO package covers both.',
    ],
    cta: { label: 'Start your listing', url: 'https://mesahomes.com/listing/start' },
  },
  'flat-fee-listing': {
    intro: 'Here\'s what happens with your Mesa Listing Service inquiry:',
    steps: [
      'A licensed team member will reach out within 4 business hours with next steps.',
      'You\'ll sign the listing agreement, upload photos, and we put you on ARMLS within 24-48 hours.',
      'Your listing syndicates to Zillow, Realtor.com, Redfin, Trulia, Homes.com automatically.',
      'At close, the $400 broker fee is taken from proceeds — you pay nothing upfront beyond the $999 listing fee.',
    ],
    cta: { label: 'Review listing agreement', url: 'https://mesahomes.com/listing/start' },
  },
  'full-service-request': {
    intro: 'Here\'s what happens with your full-service consultation request:',
    steps: [
      'A licensed Arizona agent will call or email within 4 business hours to schedule a free consultation.',
      'We\'ll walk through pricing, marketing plan, photography, showings, and negotiation strategy.',
      'If you decide to proceed, we handle everything end-to-end, commission-based.',
    ],
    cta: { label: 'Book a consult time', url: 'https://mesahomes.com/booking' },
  },
  'sell-landing': {
    intro: 'Here\'s how we\'ll help you sell:',
    steps: [
      'Within 24 hours we\'ll email a free home valuation for your address.',
      'We\'ll send a side-by-side of our three service tiers so you can pick what fits.',
      'When you\'re ready, reply and we\'ll kick off your listing the same day.',
    ],
    cta: { label: 'See all three tiers', url: 'https://mesahomes.com/sell' },
  },

  // ---- Buyers ----
  'affordability': {
    intro: 'Here\'s what happens after your affordability check:',
    steps: [
      'You have your monthly payment range. We\'ll email a detailed breakdown + current Arizona mortgage rate snapshot.',
      'If you want pre-approval, we\'ll connect you with a local Mesa-area lender (your choice).',
      'When you\'re ready to tour homes, reply and we\'ll get you set up with buyer representation.',
    ],
    cta: { label: 'Explore homes by area', url: 'https://mesahomes.com/areas/mesa' },
  },
  'offer-writer': {
    intro: 'Here\'s what happens next with your draft offer:',
    steps: [
      'Your AI-generated offer draft is in your inbox. Review it carefully before signing anything.',
      'Within 24 hours we\'ll follow up to review the offer, suggest terms, and answer questions.',
      'When you\'re ready to submit, a licensed Arizona agent will finalize and send it.',
    ],
    cta: { label: 'Talk to a buyer\'s agent', url: 'https://mesahomes.com/booking' },
  },
  'first-time-buyer': {
    intro: 'Here\'s what happens next on your first home:',
    steps: [
      'We\'ll email a first-time-buyer roadmap: pre-approval, down-payment assistance programs, inspection basics, closing timeline.',
      'Within 24 hours a buyer specialist will reach out to answer questions and get you pre-approved if needed.',
      'We\'ll tour homes with you once you\'re ready — no pressure, no commission-push.',
    ],
    cta: { label: 'Start with mortgage affordability', url: 'https://mesahomes.com/tools/affordability' },
  },
  'offer-guidance': {
    intro: 'Here\'s your offer-writing support plan:',
    steps: [
      'A licensed Arizona agent reviews comparable sales and market conditions for your target property.',
      'We\'ll send offer strategy recommendations (price, contingencies, earnest money, timeline) within 24 hours.',
      'When you\'re ready, we\'ll draft and submit the offer under full buyer representation.',
    ],
    cta: { label: 'Book a 15-min strategy call', url: 'https://mesahomes.com/booking' },
  },
  'buy-landing': {
    intro: 'Here\'s how we\'ll help you buy:',
    steps: [
      'We\'ll email our free Mesa-area home-buying guide within a few minutes.',
      'Within 24 hours a buyer specialist reaches out to understand your budget, timeline, and neighborhood preferences.',
      'Once you\'re pre-approved, we start touring homes.',
    ],
    cta: { label: 'Check affordability now', url: 'https://mesahomes.com/tools/affordability' },
  },

  // ---- Renters & investors ----
  'rent-landing': {
    intro: 'Here\'s what we\'ll send you about renting in Mesa:',
    steps: [
      'A current rent-by-ZIP snapshot for the East Valley will hit your inbox within 24 hours.',
      'If you\'re considering buying instead, we\'ll include a rent-vs-buy comparison for your budget.',
      'If you want to rent one of our managed properties, we\'ll follow up with available units.',
    ],
  },
  'invest-landing': {
    intro: 'Here\'s what happens with your investment inquiry:',
    steps: [
      'We\'ll send cap-rate and cash-on-cash snapshots for Mesa-area ZIPs within 24 hours.',
      'Within 24 hours a licensed team member will discuss your investment goals and budget.',
      'If you\'re ready to buy or sell investment properties, we offer full buyer/seller representation.',
    ],
    cta: { label: 'See investment overview', url: 'https://mesahomes.com/invest' },
  },

  // ---- Comparison + direct contact ----
  comparison: {
    intro: 'Here\'s what happens next:',
    steps: [
      'You already have the flat-fee-vs-traditional-agent breakdown.',
      'Within 24 hours we\'ll follow up to answer questions about which tier fits your situation.',
      'Whenever you\'re ready to list, we offer $999 Mesa Listing Service or full-service agent representation.',
    ],
    cta: { label: 'Review our three tiers', url: 'https://mesahomes.com/sell' },
  },
  'contact-form': {
    intro: 'Here\'s what happens with your message:',
    steps: [
      'We\'ll review your message and respond within 24 hours (often much faster during business hours).',
      'If it\'s urgent, reply to this email or text (480) 269-0502.',
    ],
  },
  'direct-consult': {
    intro: 'Here\'s what happens with your consultation request:',
    steps: [
      'A licensed team member will reach out within 4 business hours to schedule.',
      'We\'ll walk through your buying or selling goals and recommend the right service tier.',
      'No cost, no commitment — just honest advice from local Mesa-area professionals.',
    ],
    cta: { label: 'Pick a time on our calendar', url: 'https://mesahomes.com/booking' },
  },
  'valuation-request': {
    intro: 'Here\'s what happens with your valuation request:',
    steps: [
      'We\'ll pull county records, recent comps, and current trends for your property.',
      'Within 24 hours you\'ll get a detailed valuation report by email.',
      'If you\'re thinking of selling, we\'ll include options across all three service tiers.',
    ],
  },
};

export function getStepsForSource(source?: string): StepContent {
  if (!source) return FALLBACK;
  return STEP_MAP[source] ?? FALLBACK;
}
