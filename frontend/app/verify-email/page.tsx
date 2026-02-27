'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');
  const uid = searchParams.get('uid');

  useEffect(() => {
    if (!token || !uid) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    async function verify() {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token!)}&uid=${encodeURIComponent(uid!)}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      } catch {
        setStatus('error');
        setMessage('Something went wrong. Please try again later.');
      }
    }

    verify();
  }, [token, uid]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white dark:from-earth-950 dark:to-earth-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-earth-900 rounded-xl shadow-sm border border-gray-100 dark:border-earth-700 p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 border-4 border-sage-200 dark:border-sage-800 border-t-sage-600 rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-earth-100 mb-2">Verifying Your Email</h1>
            <p className="text-gray-600 dark:text-earth-300">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-earth-100 mb-2">Email Verified!</h1>
            <p className="text-gray-600 dark:text-earth-300 mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-sage-600 text-white rounded-lg font-medium hover:bg-sage-700 transition"
            >
              Log In
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-earth-100 mb-2">Verification Failed</h1>
            <p className="text-gray-600 dark:text-earth-300 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/register"
                className="px-4 py-2 bg-sage-600 text-white rounded-lg font-medium hover:bg-sage-700 transition text-sm"
              >
                Register Again
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2 border border-gray-200 dark:border-earth-700 text-gray-600 dark:text-earth-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-earth-800 transition text-sm"
              >
                Contact Support
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
