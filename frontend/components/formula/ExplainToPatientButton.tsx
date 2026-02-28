'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';

interface ExplainToPatientButtonProps {
  formulaName: string;
  ingredients: string[];
  actions: string;
  indications: string;
}

export function ExplainToPatientButton({
  formulaName,
  ingredients,
  actions,
  indications,
}: ExplainToPatientButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleOpen() {
    setIsOpen(true);
    if (explanation) return; // Use cached result
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/grok/explain-formula', {
        method: 'POST',
        body: JSON.stringify({ formulaName, ingredients, actions, indications }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate explanation.');
      } else {
        setExplanation(data.explanation || '');
      }
    } catch {
      setError('Unable to reach AI service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!explanation) return;
    await navigator.clipboard.writeText(explanation).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sage-700 dark:text-sage-300 bg-sage-50 dark:bg-sage-900/30 border border-sage-200 dark:border-sage-700 rounded-lg hover:bg-sage-100 dark:hover:bg-sage-900/50 transition-colors"
        title="Explain to Patient"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        Explain to Patient
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div className="bg-white dark:bg-earth-900 rounded-2xl shadow-2xl border border-earth-200 dark:border-earth-700 p-8 max-w-xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-earth-100">Patient Explanation</h2>
                <p className="text-sm text-earth-500 dark:text-earth-400">{formulaName}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-earth-200 transition-colors ml-4"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-earth-500 dark:text-earth-400">Generating plain-English explanation…</p>
                </div>
              )}
              {error && !loading && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}
              {explanation && !loading && (
                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-earth-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {explanation}
                </div>
              )}
            </div>

            {explanation && !loading && (
              <div className="flex gap-3 mt-6 pt-4 border-t border-earth-100 dark:border-earth-800 shrink-0">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-earth-600 dark:text-earth-300 bg-earth-50 dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-lg hover:bg-earth-100 dark:hover:bg-earth-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                  </svg>
                  Print
                </button>
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-sage-600 hover:bg-sage-700 text-white rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
