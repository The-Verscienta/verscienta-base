'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageWrapper, BackLink } from '@/components/ui/DesignSystem';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Invalid or missing token
  if (!token) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-earth-100 mb-2">
          Invalid Reset Link
        </h2>
        <p className="text-gray-600 dark:text-earth-300 mb-6">
          This password reset link is invalid or has expired.
          Please request a new password reset link.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block w-full bg-earth-600 hover:bg-earth-700 text-white font-semibold py-3 rounded-xl transition text-center"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-earth-100 mb-2">
          Password Reset Successful!
        </h2>
        <p className="text-gray-600 dark:text-earth-300 mb-6">
          Your password has been reset successfully.
          You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className="inline-block w-full bg-earth-600 hover:bg-earth-700 text-white font-semibold py-3 rounded-xl transition text-center"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-earth-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-earth-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-earth-100 mb-2">
          Create New Password
        </h2>
        <p className="text-gray-600 dark:text-earth-300">
          Enter your new password below. Make sure it&apos;s strong and secure.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full pl-11 pr-12 py-3 border border-gray-300 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 rounded-xl focus:ring-2 focus:ring-earth-500 focus:border-earth-500 transition"
              placeholder="Enter new password"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-earth-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-earth-500 dark:hover:text-earth-300"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded ${
                      i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200 dark:bg-earth-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-earth-400">
                Password strength: {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : 'Too weak'}
              </p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-earth-300 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-earth-500 focus:border-earth-500 transition dark:bg-earth-800 dark:text-earth-100 ${
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-earth-600'
              }`}
              placeholder="Confirm new password"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-earth-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-earth-600 hover:bg-earth-700 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-earth-700">
        <p className="text-center text-sm text-gray-600 dark:text-earth-300">
          Remember your password?{' '}
          <Link href="/login" className="text-earth-600 dark:text-sage-400 hover:text-gray-800 dark:hover:text-sage-300 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <PageWrapper>
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-earth-50/50 dark:bg-earth-950">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-5xl">🌿</span>
            <h1 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mt-2">
              Verscienta Health
            </h1>
          </Link>
        </div>

        <div className="bg-white dark:bg-earth-900 rounded-2xl shadow-xl border border-earth-200 dark:border-earth-700 p-8">
          <Suspense fallback={
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-earth-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 dark:text-earth-400 mt-2">Loading...</p>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <div className="mt-6">
          <BackLink href="/" label="Return to Home" />
        </div>
      </div>
    </div>
    </PageWrapper>
  );
}
