'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';
import { PageWrapper, BackLink } from '@/components/ui/DesignSystem';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    agreeToTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Redirect to login page with success message
      router.push('/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  return (
    <PageWrapper>
    <div className="min-h-[85vh] flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sage-600 via-sage-700 to-earth-700 p-12 items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-earth-400/20 blur-3xl" />
        </div>

        <div className="relative z-10 text-white max-w-lg">
          <div className="text-7xl mb-8">🌱</div>
          <h2 className="text-4xl font-serif font-bold mb-6">
            Start Your Natural Wellness Journey
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of users discovering the healing power of herbs,
            holistic modalities, and natural health solutions.
          </p>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🌿</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Comprehensive Herb Database</h3>
                <p className="text-white/70 text-sm">Access detailed information on hundreds of medicinal herbs</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI-Powered Insights</h3>
                <p className="text-white/70 text-sm">Get personalized recommendations based on your symptoms</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">👨‍⚕️</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Find Practitioners</h3>
                <p className="text-white/70 text-sm">Connect with verified holistic health practitioners near you</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-earth-50/50 dark:bg-earth-900/50 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-block">
              <span className="text-4xl">🌿</span>
              <h1 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mt-2">
                Verscienta Health
              </h1>
            </Link>
          </div>

          <div className="bg-white dark:bg-earth-900 rounded-2xl shadow-xl border border-earth-200 dark:border-earth-700 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-earth-100 mb-2">
                Create Your Account
              </h2>
              <p className="text-gray-600 dark:text-earth-300">
                Join our community of wellness seekers
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                      step >= s ? 'bg-earth-600 text-white' : 'bg-gray-200 dark:bg-earth-700 text-gray-500 dark:text-earth-400'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 2 && (
                    <div className={`w-12 h-1 mx-1 ${step > s ? 'bg-earth-600' : 'bg-gray-200 dark:bg-earth-700'}`} />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 rounded-xl focus:ring-2 focus:ring-earth-500 focus:border-earth-500 transition"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 rounded-xl focus:ring-2 focus:ring-earth-500 focus:border-earth-500 transition"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 rounded-xl focus:ring-2 focus:ring-earth-500 focus:border-earth-500 transition"
                        placeholder="johndoe"
                      />
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 rounded-xl focus:ring-2 focus:ring-earth-500 focus:border-earth-500 transition"
                        placeholder="john@example.com"
                      />
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!formData.username || !formData.email}
                    className="w-full bg-earth-600 hover:bg-earth-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
                      Password <span className="text-red-500">*</span>
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
                        className="w-full pl-11 pr-12 py-2.5 border border-gray-300 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 rounded-xl focus:ring-2 focus:ring-earth-500 focus:border-earth-500 transition"
                        placeholder="Create a strong password"
                      />
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-earth-300"
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
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className={`w-full pl-11 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-earth-500 focus:border-earth-500 transition dark:bg-earth-800 dark:text-earth-100 ${
                          formData.confirmPassword && formData.password !== formData.confirmPassword
                            ? 'border-red-300'
                            : 'border-gray-300 dark:border-earth-600'
                        }`}
                        placeholder="Confirm your password"
                      />
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  {/* Turnstile CAPTCHA */}
                  <div className="flex justify-center py-2">
                    <TurnstileWidget
                      onSuccess={(token) => setTurnstileToken(token)}
                      onError={() => {
                        setTurnstileToken(null);
                        setError('CAPTCHA verification failed. Please try again.');
                      }}
                      onExpire={() => setTurnstileToken(null)}
                    />
                  </div>

                  {/* Terms Agreement */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className="w-4 h-4 mt-1 rounded border-gray-300 dark:border-earth-600 text-earth-600 focus:ring-earth-500 dark:bg-earth-800"
                    />
                    <span className="text-sm text-gray-600 dark:text-earth-300">
                      I agree to the{' '}
                      <Link href="/terms" className="text-earth-600 dark:text-sage-400 hover:text-gray-800 dark:hover:text-sage-300 font-medium">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-earth-600 dark:text-sage-400 hover:text-gray-800 dark:hover:text-sage-300 font-medium">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border border-gray-300 dark:border-earth-600 text-gray-700 dark:text-earth-200 font-semibold py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-earth-800 transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !formData.agreeToTerms}
                      className="flex-1 bg-earth-600 hover:bg-earth-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>

          <p className="text-center mt-6 text-gray-600 dark:text-earth-300">
            Already have an account?{' '}
            <Link href="/login" className="text-earth-600 dark:text-sage-400 hover:text-gray-800 dark:hover:text-sage-300 font-semibold">
              Sign in
            </Link>
          </p>

          <BackLink href="/" label="Return to Home" />
        </div>
      </div>
    </div>
    </PageWrapper>
  );
}
