'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types (duplicated from lib to avoid server-only imports in client bundle)
// ---------------------------------------------------------------------------

type GuidedPath = 'seller' | 'buyer' | 'landlord' | 'investor';

interface PathStep {
  id: string;
  label: string;
  href: string;
  description: string;
}

interface PathProgressInfo {
  currentStep: PathStep | null;
  completedSteps: PathStep[];
  remainingSteps: PathStep[];
  percentComplete: number;
}

interface WhatsNextMessage {
  title: string;
  explanation: string;
  href: string;
}

type RiskSeverity = 'low' | 'medium' | 'high';

interface RiskIndicator {
  type: string;
  severity: RiskSeverity;
  explanation: string;
  suggestFullService: boolean;
}

interface ToolResultsForRisk {
  salePrice?: number;
  mortgageBalance?: number;
  notes?: string;
  hasTenants?: boolean;
  isInvestment?: boolean;
  downPaymentPercent?: number;
  isFirstTimeBuyer?: boolean;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Inline path definitions (avoids importing Node.js modules in client)
// ---------------------------------------------------------------------------

const GUIDED_PATHS: Record<GuidedPath, PathStep[]> = {
  seller: [
    { id: 'home-value', label: 'Home Value', href: '/tools/home-value', description: "Find out what your home is worth in today's Mesa-area market so you can set a competitive asking price." },
    { id: 'net-sheet', label: 'Net Sheet', href: '/tools/net-sheet', description: "See exactly how much you'll walk away with after commissions, closing costs, and mortgage payoff." },
    { id: 'sell-now-or-wait', label: 'Sell Now or Wait', href: '/tools/sell-now-or-wait', description: 'Compare selling now vs. waiting based on market trends, seasonality, and your personal timeline.' },
    { id: 'listing-prep', label: 'Listing Prep', href: '/sell/listing-prep', description: 'Get a personalized checklist of repairs, staging tips, and photos that maximize your sale price.' },
    { id: 'flat-fee-or-full-service', label: 'Flat Fee or Full Service', href: '/compare/flat-fee-vs-traditional-agent', description: 'Decide whether our flat-fee listing saves you money or if full-service agent support is the better fit.' },
  ],
  buyer: [
    { id: 'affordability', label: 'Affordability', href: '/tools/affordability', description: 'Calculate your monthly payment and max purchase price so you know your budget before you start looking.' },
    { id: 'first-time-guide', label: 'First-Time Guide', href: '/buy/first-time-buyer', description: 'Walk through the home-buying process step by step — from pre-approval to closing day.' },
    { id: 'offer-guidance', label: 'Offer Guidance', href: '/buy/offer-guidance', description: 'Learn how to structure a competitive offer in the Mesa market including contingencies and escalation clauses.' },
    { id: 'offer-writer', label: 'Offer Writer', href: '/tools/offer-writer', description: 'Generate a draft offer letter with the right terms for your situation and the current market.' },
    { id: 'consult-or-full-service', label: 'Consult or Full Service', href: '/compare/flat-fee-vs-traditional-agent', description: 'Choose between a one-time buyer consultation or full-service representation with a licensed agent.' },
  ],
  landlord: [
    { id: 'rent-estimate', label: 'Rent Estimate', href: '/rent', description: 'See what your property could rent for based on comparable rentals in your Mesa-area neighborhood.' },
    { id: 'pm-pain-points', label: 'PM Pain Points', href: '/rent', description: 'Identify the biggest headaches of self-managing — late payments, maintenance calls, tenant screening.' },
    { id: 'pm-overview', label: 'PM Overview', href: '/rent', description: 'Understand what a property manager handles and how it affects your net rental income.' },
    { id: 'pm-sub-or-consult', label: 'PM Subscribe or Consult', href: '/rent', description: 'Decide between ongoing property management or a one-time landlord consultation.' },
  ],
  investor: [
    { id: 'cash-flow-check', label: 'Cash Flow Check', href: '/invest', description: 'Run the numbers on a potential investment property — rent, expenses, cap rate, and cash-on-cash return.' },
    { id: 'market-comparison', label: 'Market Comparison', href: '/invest', description: 'Compare Mesa-area sub-markets to find the neighborhoods with the best investment fundamentals.' },
    { id: 'investment-consult', label: 'Investment Consult', href: '/invest', description: 'Book a strategy session with a licensed agent who specializes in Mesa-area investment properties.' },
  ],
};

// ---------------------------------------------------------------------------
// Inline engine logic (client-side, no server dependencies)
// ---------------------------------------------------------------------------

function getNextStepClient(pathType: GuidedPath, completedStepIds: string[]): PathStep | null {
  const steps = GUIDED_PATHS[pathType];
  const completedSet = new Set(completedStepIds);
  for (const step of steps) {
    if (!completedSet.has(step.id)) return step;
  }
  return null;
}

function getPathProgressClient(pathType: GuidedPath, completedStepIds: string[]): PathProgressInfo {
  const steps = GUIDED_PATHS[pathType];
  const completedSet = new Set(completedStepIds);
  const completedSteps: PathStep[] = [];
  const remainingSteps: PathStep[] = [];

  for (const step of steps) {
    if (completedSet.has(step.id)) {
      completedSteps.push(step);
    } else {
      remainingSteps.push(step);
    }
  }

  const total = steps.length;
  const percentComplete = total === 0 ? 100 : Math.round((completedSteps.length / total) * 100);

  return {
    currentStep: remainingSteps[0] ?? null,
    completedSteps,
    remainingSteps,
    percentComplete,
  };
}

function generateWhatsNextClient(pathType: GuidedPath, currentStepId: string): WhatsNextMessage | null {
  const steps = GUIDED_PATHS[pathType];
  const idx = steps.findIndex((s) => s.id === currentStepId);
  if (idx === -1) return null;
  const next = steps[idx + 1];
  if (!next) return null;
  return { title: next.label, explanation: next.description, href: next.href };
}

function detectRisksClient(toolResults: ToolResultsForRisk): RiskIndicator[] {
  const risks: RiskIndicator[] = [];

  if (
    typeof toolResults.mortgageBalance === 'number' &&
    typeof toolResults.salePrice === 'number' &&
    toolResults.mortgageBalance > toolResults.salePrice
  ) {
    risks.push({
      type: 'short-sale',
      severity: 'high',
      explanation: 'Your mortgage balance exceeds the estimated sale price. This is a short sale situation that requires lender approval and specialized negotiation.',
      suggestFullService: true,
    });
  }

  if (typeof toolResults.notes === 'string' && /\b(estate\s+sale|probate|inherited|deceased|trust\s+sale)\b/i.test(toolResults.notes)) {
    risks.push({
      type: 'estate-sale',
      severity: 'high',
      explanation: 'Estate and probate sales involve legal requirements, court approvals, and title complexities that benefit from professional guidance.',
      suggestFullService: true,
    });
  }

  if (toolResults.isInvestment && toolResults.hasTenants) {
    risks.push({
      type: 'investment-with-tenants',
      severity: 'medium',
      explanation: 'Selling or managing an investment property with existing tenants requires careful handling of lease agreements, tenant rights, and Arizona landlord-tenant law.',
      suggestFullService: true,
    });
  }

  if (toolResults.isFirstTimeBuyer && typeof toolResults.downPaymentPercent === 'number' && toolResults.downPaymentPercent < 5) {
    risks.push({
      type: 'low-down-payment',
      severity: 'medium',
      explanation: "With less than 5% down, you'll need PMI and may face stricter lender requirements. A full-service agent can help you navigate loan programs and negotiate seller concessions.",
      suggestFullService: true,
    });
  }

  return risks;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'mesahomes_guided_';

function loadFromStorage(pathType: GuidedPath): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${pathType}`);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) {
      return parsed as string[];
    }
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(pathType: GuidedPath, completedSteps: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${pathType}`, JSON.stringify(completedSteps));
  } catch {
    // localStorage may be full or disabled — fail silently
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseGuidedPathReturn {
  /** The next step the visitor should complete (null if path is done). */
  currentStep: PathStep | null;
  /** IDs of completed steps. */
  completedSteps: string[];
  /** Full progress snapshot. */
  progress: PathProgressInfo;
  /** WhatsNextCard content for the current step (null if path is done). */
  whatsNext: WhatsNextMessage | null;
  /** Detected risk indicators based on completed step results. */
  risks: RiskIndicator[];
  /** Mark a step as completed and optionally provide tool results for risk detection. */
  completeStep: (stepId: string, toolResults?: ToolResultsForRisk) => void;
}

/**
 * React hook that manages guided path state in localStorage.
 *
 * Persists completed steps so state survives page navigation.
 * Runs risk detection on each step completion.
 */
export function useGuidedPath(pathType: GuidedPath): UseGuidedPathReturn {
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => loadFromStorage(pathType));
  const [risks, setRisks] = useState<RiskIndicator[]>([]);

  // Sync from localStorage when pathType changes
  useEffect(() => {
    setCompletedSteps(loadFromStorage(pathType));
    setRisks([]);
  }, [pathType]);

  const progress = useMemo(
    () => getPathProgressClient(pathType, completedSteps),
    [pathType, completedSteps],
  );

  const currentStep = useMemo(
    () => getNextStepClient(pathType, completedSteps),
    [pathType, completedSteps],
  );

  const whatsNext = useMemo(() => {
    if (!currentStep) return null;
    return generateWhatsNextClient(pathType, currentStep.id);
  }, [pathType, currentStep]);

  const completeStep = useCallback(
    (stepId: string, toolResults?: ToolResultsForRisk) => {
      setCompletedSteps((prev) => {
        if (prev.includes(stepId)) return prev;
        const next = [...prev, stepId];
        saveToStorage(pathType, next);
        return next;
      });

      if (toolResults) {
        const detected = detectRisksClient(toolResults);
        if (detected.length > 0) {
          setRisks((prev) => {
            const existingTypes = new Set(prev.map((r) => r.type));
            const newRisks = detected.filter((r) => !existingTypes.has(r.type));
            return newRisks.length > 0 ? [...prev, ...newRisks] : prev;
          });
        }
      }
    },
    [pathType],
  );

  return {
    currentStep,
    completedSteps,
    progress,
    whatsNext,
    risks,
    completeStep,
  };
}
