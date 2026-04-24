'use client';

import { useState, useCallback } from 'react';
import { Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';

const MOCK_DESCRIPTION = `Welcome to this beautifully maintained home in the heart of Mesa, AZ! This spacious residence features an open-concept floor plan with abundant natural light throughout. The updated kitchen boasts modern finishes, granite countertops, and stainless steel appliances — perfect for entertaining.

Step outside to your private backyard oasis with a covered patio, mature landscaping, and plenty of room for outdoor activities. Located in a sought-after neighborhood with easy access to top-rated schools, shopping, dining, and major freeways.

Don't miss this incredible opportunity to own in one of Mesa's most desirable communities!`;

export function ListingGeneratorClient() {
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [sqft, setSqft] = useState<number>(1800);
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState<number>(2005);
  const [upgrades, setUpgrades] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [generating, setGenerating] = useState(false);
  const [description, setDescription] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!leadCaptured && !hasGenerated) {
      // First generation — show lead capture
      setModalOpen(true);
      return;
    }
    doGenerate();
  }, [leadCaptured, hasGenerated]);

  function doGenerate() {
    setGenerating(true);
    // Mock generation delay
    setTimeout(() => {
      setDescription(MOCK_DESCRIPTION);
      setHasGenerated(true);
      setGenerating(false);
    }, 2000);
  }

  function handleModalClose() {
    setModalOpen(false);
    setLeadCaptured(true);
    doGenerate();
  }

  function handleRegenerate() {
    doGenerate();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-text">
          AI Listing Description Generator
        </h1>
        <p className="text-text-light">
          Generate a professional MLS listing description for your Mesa-area property in seconds.
        </p>
      </div>

      {/* Input Form */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="bedrooms" className="mb-1 block text-sm font-medium text-text">
                Bedrooms
              </label>
              <input
                id="bedrooms"
                type="number"
                min={1}
                max={10}
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="bathrooms" className="mb-1 block text-sm font-medium text-text">
                Bathrooms
              </label>
              <input
                id="bathrooms"
                type="number"
                min={1}
                max={10}
                step={0.5}
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="sqft" className="mb-1 block text-sm font-medium text-text">
                Square Feet
              </label>
              <input
                id="sqft"
                type="number"
                min={100}
                step={50}
                value={sqft}
                onChange={(e) => setSqft(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="lot-size" className="mb-1 block text-sm font-medium text-text">
                Lot Size (e.g. 0.15 acres)
              </label>
              <input
                id="lot-size"
                type="text"
                placeholder="0.15 acres"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="year-built" className="mb-1 block text-sm font-medium text-text">
                Year Built
              </label>
              <input
                id="year-built"
                type="number"
                min={1900}
                max={2030}
                value={yearBuilt}
                onChange={(e) => setYearBuilt(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="upgrades" className="mb-1 block text-sm font-medium text-text">
              Recent Upgrades
            </label>
            <textarea
              id="upgrades"
              placeholder="New roof, updated kitchen, pool added..."
              value={upgrades}
              onChange={(e) => setUpgrades(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="neighborhood" className="mb-1 block text-sm font-medium text-text">
              Neighborhood / Subdivision
            </label>
            <input
              id="neighborhood"
              type="text"
              placeholder="Sunland Village, Mesa"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-colors',
              generating
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-secondary hover:bg-secondary-dark',
            )}
          >
            <Sparkles className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Listing Description'}
          </button>
        </div>
      </div>

      {/* Generating Animation */}
      {generating && (
        <div className="mb-8 flex flex-col items-center gap-3 rounded-xl bg-surface p-8">
          <div className="animate-spin">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm font-medium text-text">Generating your listing description...</p>
          <p className="text-xs text-text-light">Our AI is crafting a compelling description for your property.</p>
        </div>
      )}

      {/* Generated Description */}
      {description && !generating && (
        <div className="mb-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">Your Listing Description</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-text-light transition-colors hover:border-primary hover:text-primary"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-text-light transition-colors hover:border-primary hover:text-primary"
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </button>
              </div>
            </div>
            <div className="whitespace-pre-wrap rounded-lg bg-surface p-4 text-sm leading-relaxed text-text">
              {description}
            </div>
          </div>
        </div>
      )}

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={modalOpen}
        onClose={handleModalClose}
        leadType="Seller"
        toolSource="listing-generator"
        headline="Generate Your Listing Description"
        subtext="Enter your info to generate a professional MLS listing description."
      />
    </div>
  );
}
