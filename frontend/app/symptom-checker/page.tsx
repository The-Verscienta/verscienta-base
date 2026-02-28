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
import type { TcmPatternMatch } from '@/lib/grok';

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [patternLookup, setPatternLookup] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResults(null);
    setPatternLookup({});

    try {
      const response = await fetch('/api/grok/symptom-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResults(data);

      // Fetch our patterns DB to get IDs for deep linking
      if (data.tcmPatterns?.length > 0) {
        fetch('/api/patterns?pageSize=200')
          .then(r => r.json())
          .then(({ patterns }) => {
            const lookup: Record<string, string> = {};
            patterns?.forEach((p: { id: string; title: string }) => {
              lookup[p.title.toLowerCase()] = p.id;
            });
            setPatternLookup(lookup);
          })
          .catch(() => {}); // graceful degradation — cards still show without deep links
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 dark:from-earth-950 dark:via-earth-900/50 dark:to-earth-950 border-b border-sage-200/50 dark:border-earth-700">
        <LeafPattern opacity={0.04} />

        {/* Decorative blur circles */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-earth-300/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Symptom Checker' },
            ]}
            className="mb-8"
          />

          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sage-500 to-earth-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-sage-600 font-medium tracking-wide uppercase text-sm">
                AI-Powered
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-earth-100 mb-4 leading-tight">
              Symptom Checker
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-earth-300 leading-relaxed">
              Describe your symptoms and get personalized holistic health recommendations
              powered by Grok AI — including TCM pattern differentiation.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DisclaimerBox title="Disclaimer">
          This tool is for informational purposes only and does not replace professional
          medical advice. Always consult with a qualified healthcare provider for medical concerns.
        </DisclaimerBox>

        <div className="mt-8">
          <Section
            variant="feature"
            title="Describe Your Symptoms"
            subtitle="Be as detailed as possible for better recommendations"
            icon={
              <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <textarea
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-earth-200 dark:border-earth-600 rounded-xl focus:ring-2 focus:ring-earth-500/20 focus:border-earth-500 transition bg-white dark:bg-earth-800 dark:text-earth-100 dark:placeholder-earth-500 shadow-sm"
                  placeholder="Example: I've been experiencing headaches, fatigue, and trouble sleeping for the past week..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !symptoms.trim()}
                className="w-full bg-earth-600 hover:bg-earth-700 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Symptoms'
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
              title="Analysis Results"
              icon={
                <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              <div className="space-y-8">
                <div className="relative bg-gradient-to-br from-sage-50 to-earth-50 dark:from-earth-900 dark:to-earth-950 border border-sage-200 dark:border-earth-700 rounded-2xl p-6">
                  <h3 className="font-serif text-xl font-bold text-gray-800 dark:text-earth-100 mb-4">
                    AI Recommendations
                  </h3>
                  <p className="text-gray-700 dark:text-earth-200 whitespace-pre-wrap leading-relaxed">
                    {results.analysis || 'No analysis available'}
                  </p>
                </div>

                {/* TCM Pattern Differentiation */}
                {results.tcmPatterns && results.tcmPatterns.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <h3 className="font-serif text-xl font-bold text-gray-800 dark:text-earth-100">
                        TCM Pattern Differentiation
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-earth-400 mb-4">
                      These Traditional Chinese Medicine patterns may underlie your symptoms:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {results.tcmPatterns.map((pattern: TcmPatternMatch, idx: number) => {
                        const patternId = patternLookup[pattern.patternName?.toLowerCase() ?? ''];
                        const cardInner = (
                          <div className="h-full border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 bg-amber-50/50 dark:bg-amber-950/20 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition">
                            <h4 className="font-bold text-gray-800 dark:text-earth-100 text-base mb-1">
                              {pattern.patternName}
                            </h4>
                            {(pattern.chineseName || pattern.pinyinName) && (
                              <p className="text-sm text-amber-700 dark:text-amber-400 font-serif mb-2">
                                {pattern.chineseName}
                                {pattern.chineseName && pattern.pinyinName && ' · '}
                                {pattern.pinyinName && <span className="italic">{pattern.pinyinName}</span>}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-earth-300 mb-3 leading-relaxed">
                              {pattern.matchReason}
                            </p>
                            {pattern.keySymptoms?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {pattern.keySymptoms.map((sym, i) => (
                                  <span key={i} className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                    {sym}
                                  </span>
                                ))}
                              </div>
                            )}
                            {pattern.suggestedFormulas && pattern.suggestedFormulas.length > 0 && (
                              <div className="mb-2 text-xs">
                                <span className="font-semibold text-gray-500 dark:text-earth-400 uppercase tracking-wide">Formulas: </span>
                                <span className="text-gray-600 dark:text-earth-300">{pattern.suggestedFormulas.join(', ')}</span>
                              </div>
                            )}
                            {pattern.suggestedPoints && pattern.suggestedPoints.length > 0 && (
                              <div className="mb-3 text-xs">
                                <span className="font-semibold text-gray-500 dark:text-earth-400 uppercase tracking-wide">Points: </span>
                                <span className="text-gray-600 dark:text-earth-300 font-mono">{pattern.suggestedPoints.join(', ')}</span>
                              </div>
                            )}
                            <div className="text-amber-600 dark:text-amber-500 text-sm font-medium">
                              {patternId ? 'Explore Pattern →' : 'Browse All Patterns →'}
                            </div>
                          </div>
                        );

                        return patternId ? (
                          <Link key={idx} href={`/patterns/${patternId}`} className="block">
                            {cardInner}
                          </Link>
                        ) : (
                          <Link key={idx} href="/patterns" className="block">
                            {cardInner}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {results.recommendations && (
                  <div>
                    <h3 className="font-serif text-xl font-bold text-gray-800 dark:text-earth-100 mb-4">
                      Suggested Modalities & Herbs
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {results.recommendations.modalities?.map((modality: string, idx: number) => (
                        <Tag key={`mod-${idx}`} variant="earth" size="lg">
                          <span className="mr-1.5">🧘</span> {modality}
                        </Tag>
                      ))}
                      {results.recommendations.herbs?.map((herb: string, idx: number) => (
                        <Tag key={`herb-${idx}`} variant="sage" size="lg">
                          <span className="mr-1.5">🌿</span> {herb}
                        </Tag>
                      ))}
                    </div>
                    {process.env.NEXT_PUBLIC_SYMBOLIC_FEATURE === 'true' && results.recommendations.herbs?.length > 0 && (
                      <p className="mt-4 text-sm text-gray-600 dark:text-earth-300">
                        Want precise dosage math?{' '}
                        <a
                          href={`/herbs`}
                          className="text-sage-600 hover:text-sage-800 underline font-medium transition-colors"
                        >
                          Refine dosage mathematically
                        </a>{' '}
                        on individual herb pages.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Section>
          </>
        )}

        <div className="mt-12">
          <BackLink href="/" label="Return to Home" />
        </div>
      </div>
    </PageWrapper>
  );
}
