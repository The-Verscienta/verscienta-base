'use client';

import { useState } from 'react';
import Link from 'next/link';
import { contactFormSchema, formatZodErrors } from '@/lib/validation';
import { PageWrapper, LeafPattern, BackLink } from '@/components/ui/DesignSystem';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Validate with Zod
    const result = contactFormSchema.safeParse(formData);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      return;
    }

    setStatus('loading');

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real app, you would send this to an API endpoint
    console.log('Form submitted:', formData);
    setStatus('success');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <PageWrapper>
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 border-b border-earth-200/50">
        <LeafPattern opacity={0.04} />

        {/* Decorative blurred circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-earth-300/15 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-earth-200/50 mb-6">
            <svg className="w-4 h-4 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sage-700 font-medium text-sm">Get in Touch</span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-earth-900 mb-6 leading-tight">
            Contact Us
          </h1>

          <p className="text-xl md:text-2xl text-sage-700 max-w-2xl mx-auto leading-relaxed">
            Have questions or feedback? We'd love to hear from you.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-earth-200 p-6 hover:shadow-md transition-shadow">
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-5">Get in Touch</h2>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-sage-100 to-earth-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-sage-200">
                    <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-sage-500 font-medium uppercase tracking-wide">Email</p>
                    <a
                      href="mailto:hello@verscienta.health"
                      className="text-earth-700 hover:text-sage-600 font-medium transition-colors"
                    >
                      hello@verscienta.health
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-sage-100 to-earth-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-sage-200">
                    <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-sage-500 font-medium uppercase tracking-wide">Response Time</p>
                    <p className="text-earth-700 font-medium">Within 24-48 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-sage-50/50 via-earth-50/50 to-cream-50 rounded-2xl p-6 border border-sage-200">
              <h3 className="font-serif font-semibold text-earth-800 mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-sage-600 hover:text-earth-700 font-medium flex items-center gap-2 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-sage-600 hover:text-earth-700 font-medium flex items-center gap-2 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sage-600 hover:text-earth-700 font-medium flex items-center gap-2 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sage-600 hover:text-earth-700 font-medium flex items-center gap-2 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-earth-200 p-8">
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-6">Send us a Message</h2>

              {status === 'success' ? (
                <div className="bg-gradient-to-br from-sage-50 to-earth-50 border border-sage-200 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sage-100 to-sage-200 rounded-full flex items-center justify-center border border-sage-300">
                    <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-earth-800 mb-2">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-sage-700 mb-6 leading-relaxed">
                    Thank you for reaching out. We'll get back to you within 24-48 hours.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-sage-600 hover:text-earth-700 font-semibold transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-earth-700 mb-2"
                      >
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition bg-cream-50/50 ${
                          fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-earth-200'
                        }`}
                        placeholder="John Doe"
                      />
                      {fieldErrors.name && (
                        <p className="mt-1.5 text-sm text-red-600">{fieldErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-earth-700 mb-2"
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition bg-cream-50/50 ${
                          fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-earth-200'
                        }`}
                        placeholder="john@example.com"
                      />
                      {fieldErrors.email && (
                        <p className="mt-1.5 text-sm text-red-600">{fieldErrors.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-earth-700 mb-2"
                    >
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition bg-cream-50/50 ${
                        fieldErrors.subject ? 'border-red-300 bg-red-50' : 'border-earth-200'
                      }`}
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="feedback">Feedback</option>
                      <option value="content">Content Suggestion</option>
                      <option value="practitioner">Practitioner Listing</option>
                      <option value="technical">Technical Issue</option>
                      <option value="partnership">Partnership Opportunity</option>
                    </select>
                    {fieldErrors.subject && (
                      <p className="mt-1.5 text-sm text-red-600">{fieldErrors.subject}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-earth-700 mb-2"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition resize-none bg-cream-50/50 ${
                        fieldErrors.message ? 'border-red-300 bg-red-50' : 'border-earth-200'
                      }`}
                      placeholder="How can we help you?"
                    />
                    {fieldErrors.message && (
                      <p className="mt-1.5 text-sm text-red-600">{fieldErrors.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-sage-500">* Required fields</p>
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="bg-gradient-to-r from-earth-600 to-sage-600 hover:from-earth-700 hover:to-sage-700 disabled:from-earth-400 disabled:to-sage-400 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      {status === 'loading' ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <BackLink href="/" label="Return to Home" />
        </div>
      </div>
    </div>
    </PageWrapper>
  );
}
