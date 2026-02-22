'use client';

import { useState } from 'react';
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

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResults(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 border-b border-sage-200/50">
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

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-earth-900 mb-4 leading-tight">
              Symptom Checker
            </h1>

            <p className="text-lg md:text-xl text-sage-700 leading-relaxed">
              Describe your symptoms and get personalized holistic health recommendations
              powered by Grok AI.
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
                  className="w-full px-4 py-3 border-2 border-earth-200 rounded-xl focus:ring-2 focus:ring-earth-500/20 focus:border-earth-500 transition bg-white shadow-sm"
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
                <div className="relative bg-gradient-to-br from-sage-50 to-earth-50 border border-sage-200 rounded-2xl p-6">
                  <h3 className="font-serif text-xl font-bold text-earth-800 mb-4">
                    AI Recommendations
                  </h3>
                  <p className="text-earth-700 whitespace-pre-wrap leading-relaxed">
                    {results.analysis || 'No analysis available'}
                  </p>
                </div>

                {results.recommendations && (
                  <div>
                    <h3 className="font-serif text-xl font-bold text-earth-800 mb-4">
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
                      <p className="mt-4 text-sm text-earth-600">
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
