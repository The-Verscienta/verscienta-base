'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  PageWrapper,
  LeafPattern,
  DisclaimerBox,
  Section,
  BotanicalDivider,
  Tag,
  BackLink,
} from '@/components/ui/DesignSystem';
import type { HerbDrugInteractionResult, HerbDrugCheckResponse } from '@/lib/grok';

const SEVERITY_CONFIG = {
  contraindicated: {
    label: 'Contraindicated',
    icon: '🚫',
    border: 'border-red-300 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-950/30',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    heading: 'text-red-800 dark:text-red-200',
  },
  caution: {
    label: 'Use Caution',
    icon: '⚠️',
    border: 'border-orange-300 dark:border-orange-800',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    heading: 'text-orange-800 dark:text-orange-200',
  },
  monitor: {
    label: 'Monitor',
    icon: '👁',
    border: 'border-yellow-300 dark:border-yellow-800',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    heading: 'text-yellow-800 dark:text-yellow-200',
  },
};

const EVIDENCE_LABEL: Record<string, string> = {
  strong: 'Strong Evidence',
  moderate: 'Moderate Evidence',
  preliminary: 'Preliminary',
  theoretical: 'Theoretical',
};

function InteractionCard({ interaction }: { interaction: HerbDrugInteractionResult }) {
  const sev = SEVERITY_CONFIG[interaction.severity] ?? SEVERITY_CONFIG.monitor;
  return (
    <div className={`rounded-xl border ${sev.border} ${sev.bg} p-5`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className={`font-bold text-lg ${sev.heading}`}>
            {interaction.herbName}
            {(interaction.herbChineseName || interaction.herbPinyinName) && (
              <span className="font-serif font-normal text-base ml-2 opacity-80">
                {interaction.herbChineseName}
                {interaction.herbChineseName && interaction.herbPinyinName && ' · '}
                {interaction.herbPinyinName && <span className="italic">{interaction.herbPinyinName}</span>}
              </span>
            )}
          </h4>
          <p className="text-sm text-gray-600 dark:text-earth-300 mt-0.5">
            Interacts with: <span className="font-semibold">{interaction.medicationName}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sev.badge}`}>
            {sev.icon} {sev.label}
          </span>
          {interaction.evidenceLevel && (
            <span className="text-xs text-gray-500 dark:text-earth-400">
              {EVIDENCE_LABEL[interaction.evidenceLevel] ?? interaction.evidenceLevel}
            </span>
          )}
        </div>
      </div>

      {interaction.clinicalEffect && (
        <p className="text-sm font-semibold text-gray-700 dark:text-earth-200 mb-2">
          Effect: {interaction.clinicalEffect}
        </p>
      )}

      {interaction.mechanism && (
        <p className="text-sm text-gray-600 dark:text-earth-300 leading-relaxed">
          {interaction.mechanism}
        </p>
      )}

      <div className="mt-3">
        <Link
          href={`/herbs?q=${encodeURIComponent(interaction.herbName)}`}
          className="text-xs text-sage-600 dark:text-sage-400 hover:underline font-medium"
        >
          View in Materia Medica →
        </Link>
      </div>
    </div>
  );
}

export default function HerbDrugInteractionsPage() {
  const [medications, setMedications] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HerbDrugCheckResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/grok/herb-drug-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medications }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check failed');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const contraindicated = results?.interactions?.filter(i => i.severity === 'contraindicated') ?? [];
  const caution = results?.interactions?.filter(i => i.severity === 'caution') ?? [];
  const monitor = results?.interactions?.filter(i => i.severity === 'monitor') ?? [];
  const totalInteractions = results?.interactions?.length ?? 0;

  return (
    <PageWrapper>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-50/40 to-cream-100 dark:from-red-950/60 dark:via-orange-950/30 dark:to-earth-950 border-b border-red-200/50 dark:border-red-900/50">
        <LeafPattern opacity={0.03} />
        <div className="absolute top-20 left-10 w-64 h-64 bg-red-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-orange-300/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Tools', href: '/tools/herb-drug-interactions' },
              { label: 'Herb-Drug Interactions' },
            ]}
            className="mb-8"
          />

          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-red-600 dark:text-red-400 font-medium tracking-wide uppercase text-sm">
                Safety Tool · AI-Powered
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 dark:text-earth-100 mb-4 leading-tight">
              Herb-Drug<br className="sm:hidden" /> Interaction Checker
            </h1>

            <p className="text-lg text-gray-600 dark:text-earth-300 leading-relaxed">
              Enter your current medications to check for known interactions with
              Traditional Chinese Medicine herbs and formulas.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DisclaimerBox title="Important Safety Notice">
          This tool uses AI to identify potential herb-drug interactions and is intended for
          <strong> educational reference only</strong>. Results may be incomplete. Always consult
          your physician, pharmacist, or licensed TCM practitioner before combining herbal products
          with pharmaceutical medications. Do not stop or adjust your medications based on this tool.
        </DisclaimerBox>

        <div className="mt-8">
          <Section
            variant="feature"
            title="Enter Your Medications"
            subtitle="List one medication per line, or separate with commas"
            icon={
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <textarea
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-red-200 dark:border-red-800/60 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition bg-white dark:bg-earth-800 dark:text-earth-100 dark:placeholder-earth-500 shadow-sm"
                  placeholder={`Example:\nWarfarin\nAspirin\nMetformin\nLisinopril`}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-earth-400">
                  Use generic drug names when possible (e.g., &quot;warfarin&quot; not &quot;Coumadin&quot;)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !medications.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Checking interactions...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Check Herb-Drug Interactions
                  </>
                )}
              </button>
            </form>
          </Section>
        </div>

        {results && (
          <>
            <BotanicalDivider className="my-12" />

            <Section
              id="results"
              variant="card"
              title="Interaction Results"
              icon={
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              <div className="space-y-8">
                {/* Summary */}
                {results.summary && (
                  <div className="bg-gradient-to-br from-gray-50 to-earth-50 dark:from-earth-900 dark:to-earth-950 border border-gray-200 dark:border-earth-700 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-serif text-lg font-bold text-gray-800 dark:text-earth-100">
                        Summary
                      </h3>
                      {results.checkedMedications?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 ml-2">
                          {results.checkedMedications.map((med, i) => (
                            <Tag key={i} variant="earth" size="sm">{med}</Tag>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-earth-200 leading-relaxed">{results.summary}</p>

                    {totalInteractions === 0 && (
                      <div className="mt-3 flex items-center gap-2 text-green-700 dark:text-green-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">No significant interactions identified</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Contraindicated */}
                {contraindicated.length > 0 && (
                  <div>
                    <h3 className="font-serif text-xl font-bold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                      🚫 Contraindicated ({contraindicated.length})
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                      These combinations should be avoided. Consult your healthcare provider immediately.
                    </p>
                    <div className="space-y-4">
                      {contraindicated.map((interaction, idx) => (
                        <InteractionCard key={idx} interaction={interaction} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Caution */}
                {caution.length > 0 && (
                  <div>
                    <h3 className="font-serif text-xl font-bold text-orange-800 dark:text-orange-300 mb-3 flex items-center gap-2">
                      ⚠️ Use Caution ({caution.length})
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-400 mb-4">
                      These combinations may be used with close monitoring. Discuss with your practitioner.
                    </p>
                    <div className="space-y-4">
                      {caution.map((interaction, idx) => (
                        <InteractionCard key={idx} interaction={interaction} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Monitor */}
                {monitor.length > 0 && (
                  <div>
                    <h3 className="font-serif text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
                      👁 Monitor ({monitor.length})
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                      Potential interactions to be aware of. Inform your healthcare provider.
                    </p>
                    <div className="space-y-4">
                      {monitor.map((interaction, idx) => (
                        <InteractionCard key={idx} interaction={interaction} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                {results.disclaimer && (
                  <div className="text-xs text-gray-500 dark:text-earth-400 border-t border-earth-200 dark:border-earth-700 pt-4 italic">
                    {results.disclaimer}
                  </div>
                )}
              </div>
            </Section>
          </>
        )}

        <div className="mt-12 flex flex-wrap gap-4">
          <BackLink href="/" label="Return to Home" />
          <Link
            href="/herbs"
            className="text-sage-600 dark:text-sage-400 hover:underline font-medium text-sm"
          >
            Browse Materia Medica →
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
