'use client';

import { useState } from 'react';

interface NewsletterSignupProps {
  variant?: 'default' | 'compact' | 'card' | 'footer';
  className?: string;
}

export function NewsletterSignup({
  variant = 'default',
  className = '',
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus('success');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('error');
    }
  };

  // Compact variant - inline form
  if (variant === 'compact') {
    return (
      <div className={className}>
        {status === 'success' ? (
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Subscribed!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500 text-sm"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-earth-600 hover:bg-earth-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50"
            >
              {status === 'loading' ? '...' : 'Subscribe'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }

  // Footer variant - for footer sections
  if (variant === 'footer') {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold text-white mb-3">Stay Updated</h3>
        <p className="text-white/70 text-sm mb-4">
          Get the latest wellness tips and herb guides delivered to your inbox.
        </p>
        {status === 'success' ? (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-300 text-sm">Thanks for subscribing!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 text-white placeholder-white/50 text-sm"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-white text-gray-800 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-earth-50 transition disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <span className="w-4 h-4 border-2 border-earth-600/30 border-t-earth-600 rounded-full animate-spin inline-block" />
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>
            {status === 'error' && (
              <p className="text-xs text-red-300 mt-2">{error}</p>
            )}
          </form>
        )}
      </div>
    );
  }

  // Card variant - standalone card
  if (variant === 'card') {
    return (
      <div className={`bg-gradient-to-br from-earth-50 to-sage-50 rounded-2xl p-8 border border-earth-200 ${className}`}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-earth-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-earth-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Join Our Wellness Newsletter
          </h3>
          <p className="text-gray-600 text-sm">
            Receive weekly insights on herbs, holistic health tips, and exclusive content.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-800 font-medium">Welcome aboard!</p>
            <p className="text-green-600 text-sm">Check your email to confirm your subscription.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-earth-500 focus:border-earth-500"
              />
            </div>
            {status === 'error' && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-earth-600 hover:bg-earth-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Subscribing...
                </>
              ) : (
                'Subscribe Now'
              )}
            </button>
            <p className="text-xs text-gray-500 text-center">
              No spam, ever. Unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    );
  }

  // Default variant - section style
  return (
    <div className={`bg-gradient-to-r from-earth-600 to-sage-600 rounded-2xl p-8 md:p-12 text-white ${className}`}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-serif font-bold mb-4">
          Your Wellness Journey Starts Here
        </h2>
        <p className="text-white/80 mb-8">
          Subscribe to our newsletter for weekly herbal insights, health tips,
          and exclusive content delivered straight to your inbox.
        </p>

        {status === 'success' ? (
          <div className="bg-white/20 backdrop-blur rounded-xl p-6">
            <svg className="w-12 h-12 text-white mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-xl font-semibold mb-1">You're all set!</p>
            <p className="text-white/80">Check your inbox for a confirmation email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="flex-1 px-5 py-3.5 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-earth-800 hover:bg-earth-900 text-white px-8 py-3.5 rounded-xl font-semibold transition disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Subscribing...</span>
                  </>
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>
            {status === 'error' && (
              <p className="text-red-200 text-sm mt-3">{error}</p>
            )}
            <p className="text-white/60 text-sm mt-4">
              Join 10,000+ wellness enthusiasts. No spam, unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
