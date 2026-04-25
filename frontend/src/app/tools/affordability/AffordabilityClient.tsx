'use client';

import { useState, useCallback } from 'react';
import { Calculator, DollarSign, Percent, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';
import { ProgressIndicator, type PathStep } from '@/components/ProgressIndicator';
import Link from 'next/link';
import { trackEvent } from '@/lib/tracking';

const buyerSteps: PathStep[] = [
  { id: 'affordability', label: 'Affordability', href: '/tools/affordability' },
  { id: 'home-search', label: 'Home Search', href: '/buy' },
  { id: 'offer', label: 'Make Offer', href: '/tools/offer-writer' },
  { id: 'close', label: 'Close', href: '/booking' },
];

const AZ_DPA_PROGRAMS = [
  {
    name: 'Arizona Home Plus',
    description: 'Up to 5% down payment assistance for qualified buyers.',
    url: 'https://www.arizonaida.com/home-plus/',
  },
  {
    name: 'Pathway to Purchase',
    description: 'Down payment and closing cost assistance for Maricopa County.',
    url: 'https://www.maricopa.gov/5498/Pathway-to-Purchase',
  },
  {
    name: 'Home in Five Advantage',
    description: 'Up to 5% assistance for homes in Maricopa County.',
    url: 'https://www.homeinfive.org/',
  },
];

function calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  if (monthlyRate === 0) return principal / numPayments;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
}

function calculateMaxPrice(
  annualIncome: number,
  monthlyDebts: number,
  downPayment: number,
  interestRate: number,
  loanTerm: number,
): number {
  const monthlyIncome = annualIncome / 12;
  const maxMonthlyPayment = monthlyIncome * 0.28 - monthlyDebts;
  if (maxMonthlyPayment <= 0) return 0;

  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTerm * 12;

  let maxLoan: number;
  if (monthlyRate === 0) {
    maxLoan = maxMonthlyPayment * numPayments;
  } else {
    maxLoan = maxMonthlyPayment *
      (Math.pow(1 + monthlyRate, numPayments) - 1) /
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments));
  }

  return Math.round(maxLoan + downPayment);
}

interface Scenario {
  label: string;
  downPaymentPct: number;
  rate: number;
  term: number;
}

export function AffordabilityClient() {
  const [income, setIncome] = useState<number>(85000);
  const [debts, setDebts] = useState<number>(500);
  const [downPayment, setDownPayment] = useState<number>(50000);
  const [rate, setRate] = useState<number>(6.5);
  const [term, setTerm] = useState<number>(30);
  const [calculated, setCalculated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCalculate = useCallback(() => {
    setCalculated(true);
    trackEvent('tool_use', 'affordability', { income, downPayment });
  }, [income, downPayment]);

  const maxPrice = calculateMaxPrice(income, debts, downPayment, rate, term);
  const loanAmount = maxPrice - downPayment;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, rate, term);

  const scenarios: Scenario[] = [
    { label: 'Conservative', downPaymentPct: 20, rate: rate, term: 30 },
    { label: 'Moderate', downPaymentPct: 10, rate: rate, term: 30 },
    { label: 'Aggressive', downPaymentPct: 3.5, rate: rate + 0.25, term: 30 },
  ];

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <ProgressIndicator
          steps={buyerSteps}
          currentStepId="affordability"
          completedStepIds={[]}
        />
      </div>

      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-text">
          How Much Home Can You Afford?
        </h1>
        <p className="text-text-light">
          Calculate your buying power based on income, debts, and down payment.
        </p>
      </div>

      {/* Calculator Form */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="income" className="mb-1 block text-sm font-medium text-text">
                Annual Income
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
                <input
                  id="income"
                  type="number"
                  min={0}
                  step={1000}
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label htmlFor="debts" className="mb-1 block text-sm font-medium text-text">
                Monthly Debts
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
                <input
                  id="debts"
                  type="number"
                  min={0}
                  step={50}
                  value={debts}
                  onChange={(e) => setDebts(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="down-payment" className="mb-1 block text-sm font-medium text-text">
                Down Payment
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
                <input
                  id="down-payment"
                  type="number"
                  min={0}
                  step={1000}
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label htmlFor="rate" className="mb-1 block text-sm font-medium text-text">
                Interest Rate (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
                <input
                  id="rate"
                  type="number"
                  min={0}
                  max={15}
                  step={0.125}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label htmlFor="term" className="mb-1 block text-sm font-medium text-text">
                Loan Term
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
                <select
                  id="term"
                  value={term}
                  onChange={(e) => setTerm(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={30}>30 years</option>
                  <option value={15}>15 years</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleCalculate}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
          >
            <Calculator className="h-4 w-4" />
            Calculate Affordability
          </button>
        </div>
      </div>

      {/* Teaser Results */}
      {calculated && (
        <div className="mb-8">
          <div className="mb-6 rounded-xl bg-primary/5 p-6 text-center">
            <p className="text-sm text-text-light">You can afford a home up to</p>
            <p className="text-3xl font-bold tabular-nums text-primary">{fmt(maxPrice)}</p>
            <p className="mt-2 text-sm text-text-light">
              Estimated monthly payment: <span className="font-semibold tabular-nums text-text">{fmt(Math.round(monthlyPayment))}/mo</span>
            </p>
          </div>

          {/* 3 Mortgage Scenarios */}
          <h2 className="mb-4 text-lg font-bold text-text">Mortgage Scenarios</h2>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {scenarios.map((s) => {
              const dp = Math.round(maxPrice * (s.downPaymentPct / 100));
              const loan = maxPrice - dp;
              const payment = calculateMonthlyPayment(loan, s.rate, s.term);
              return (
                <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="mb-2 text-sm font-semibold text-primary">{s.label}</h3>
                  <div className="space-y-1 text-xs text-text-light">
                    <div className="flex justify-between">
                      <span>Down Payment</span>
                      <span className="tabular-nums font-medium text-text">{s.downPaymentPct}% ({fmt(dp)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate</span>
                      <span className="tabular-nums font-medium text-text">{s.rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly</span>
                      <span className="tabular-nums font-medium text-text">{fmt(Math.round(payment))}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progressive disclosure */}
          <div className="mb-6 rounded-xl bg-surface p-6 text-center">
            <p className="mb-2 text-sm font-semibold text-text">
              🔒 Get your full affordability report
            </p>
            <p className="mb-4 text-xs text-text-light">
              Includes detailed scenarios, pre-approval guidance, and personalized recommendations.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
            >
              Unlock Full Report →
            </button>
          </div>
        </div>
      )}

      {/* Arizona DPA Programs */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-text">Arizona Down Payment Assistance Programs</h2>
        <div className="space-y-3">
          {AZ_DPA_PROGRAMS.map((program) => (
            <div key={program.name} className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-primary">{program.name}</h3>
              <p className="mt-1 text-xs text-text-light">{program.description}</p>
              <a
                href={program.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
              >
                Learn More →
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      {calculated && (
        <div className="mb-8 text-center">
          <Link
            href="/tools/offer-writer"
            className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
          >
            Ready to Make an Offer? →
          </Link>
        </div>
      )}

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Buyer"
        toolSource="affordability"
        headline="Unlock Your Full Affordability Report"
        subtext="Get detailed mortgage scenarios, pre-approval guidance, and personalized recommendations."
      />
    </div>
  );
}
