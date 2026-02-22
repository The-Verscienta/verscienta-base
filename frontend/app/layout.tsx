import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter, Crimson_Pro, JetBrains_Mono, Noto_Serif_SC } from 'next/font/google';
import 'katex/dist/katex.min.css';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-chinese',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Verscienta Health - Holistic Health Database',
  description: 'Comprehensive holistic health database covering modalities, herbs, and guided symptom diagnosis.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Reading headers makes this a dynamic route, ensuring the nonce
  // from middleware is available to Next.js for inline script tags
  await headers();

  return (
    <html lang="en" className={`${inter.variable} ${crimsonPro.variable} ${jetbrainsMono.variable} ${notoSerifSC.variable}`}>
      <body className="font-sans">
        <ToastProvider position="bottom-right">
          <div className="min-h-screen bg-gradient-to-b from-earth-50 to-sage-50">
            {/* Skip to content link for keyboard/screen reader users */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-sage-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
            >
              Skip to main content
            </a>
            <Header />

          <main id="main-content" className="container-custom py-8 md:py-12" role="main">
            {children}
          </main>

          <footer role="contentinfo" aria-label="Site footer" className="relative bg-gradient-to-b from-earth-800 via-earth-900 to-earth-950 text-white mt-16 overflow-hidden">
            {/* Decorative botanical background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-96 h-96 bg-sage-600/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-gold-600/5 rounded-full blur-3xl" />
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-2 10-10 18-20 20 10 2 18 10 20 20 2-10 10-18 20-20-10-2-18-10-20-20z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
              }} />
            </div>

            {/* Top decorative border */}
            <div className="h-1 bg-gradient-to-r from-earth-700 via-sage-600 to-earth-700" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
              {/* Main Footer Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
                {/* Brand Column */}
                <div className="lg:col-span-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative">
                      <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
                        <defs>
                          <linearGradient id="footerLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a9c2b1" />
                            <stop offset="50%" stopColor="#6b9279" />
                            <stop offset="100%" stopColor="#426650" />
                          </linearGradient>
                        </defs>
                        <path d="M20 4c-3 10-12 16-12 24a12 12 0 0024 0c0-8-9-14-12-24z" fill="url(#footerLeafGrad)" />
                        <path d="M20 10v20M16 16c2 2 4 6 4 10M24 16c-2 2-4 6-4 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xl font-serif font-bold text-white tracking-tight">Verscienta</span>
                      <span className="block text-[10px] text-sage-400 font-medium tracking-widest uppercase -mt-0.5">Health</span>
                    </div>
                  </div>
                  <p className="text-earth-300 text-sm leading-relaxed mb-6 max-w-sm">
                    Bridging ancient healing wisdom with modern scientific understanding.
                    Your comprehensive guide to holistic wellness and natural remedies.
                  </p>
                  {/* Social proof or trust indicators */}
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {['bg-sage-500', 'bg-earth-500', 'bg-gold-500'].map((color, i) => (
                        <div key={i} className={`w-8 h-8 ${color} rounded-full border-2 border-earth-900 flex items-center justify-center text-xs font-bold`}>
                          {['🌿', '☯️', '🧪'][i]}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-earth-400">500+ herbs documented</span>
                  </div>
                </div>

                {/* Explore Column */}
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-sage-400 mb-5 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Explore
                  </h3>
                  <ul className="space-y-3">
                    {[
                      { href: '/herbs', label: 'Medicinal Herbs' },
                      { href: '/modalities', label: 'Healing Modalities' },
                      { href: '/formulas', label: 'Herbal Formulas' },
                      { href: '/conditions', label: 'Health Conditions' },
                    ].map((link) => (
                      <li key={link.href}>
                        <a href={link.href} className="group flex items-center gap-2 text-earth-300 hover:text-white transition-colors text-sm">
                          <span className="w-1 h-1 bg-sage-500/50 rounded-full group-hover:bg-sage-400 transition-colors" />
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resources Column */}
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-sage-400 mb-5 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Resources
                  </h3>
                  <ul className="space-y-3">
                    {[
                      { href: '/symptom-checker', label: 'Symptom Checker' },
                      { href: '/practitioners', label: 'Find Practitioners' },
                      { href: '/clinics', label: 'Find Clinics' },
                      { href: '/search', label: 'Search Database' },
                      { href: '/faq', label: 'FAQ' },
                    ].map((link) => (
                      <li key={link.href}>
                        <a href={link.href} className="group flex items-center gap-2 text-earth-300 hover:text-white transition-colors text-sm">
                          <span className="w-1 h-1 bg-sage-500/50 rounded-full group-hover:bg-sage-400 transition-colors" />
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Company Column */}
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-sage-400 mb-5 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Company
                  </h3>
                  <ul className="space-y-3">
                    {[
                      { href: '/about', label: 'About Us' },
                      { href: '/contact', label: 'Contact' },
                      { href: '/privacy', label: 'Privacy Policy' },
                      { href: '/terms', label: 'Terms of Use' },
                    ].map((link) => (
                      <li key={link.href}>
                        <a href={link.href} className="group flex items-center gap-2 text-earth-300 hover:text-white transition-colors text-sm">
                          <span className="w-1 h-1 bg-sage-500/50 rounded-full group-hover:bg-sage-400 transition-colors" />
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Newsletter Column */}
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-sage-400 mb-5 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Stay Updated
                  </h3>
                  <p className="text-earth-400 text-sm mb-4">
                    Get wellness tips and new herb discoveries in your inbox.
                  </p>
                  <form className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Your email"
                      className="flex-1 px-3 py-2 bg-earth-800/50 border border-earth-600 rounded-lg text-sm text-white placeholder-earth-500 focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500 transition-all"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-sage-600 to-earth-600 hover:from-sage-500 hover:to-earth-500 rounded-lg text-sm font-semibold transition-all"
                    >
                      Join
                    </button>
                  </form>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="relative bg-earth-800/30 border border-earth-700/50 rounded-xl p-5 mb-8 backdrop-blur-sm">
                <div className="absolute top-0 left-6 w-10 h-10 bg-amber-500/10 rounded-full -translate-y-1/2 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-earth-400 text-xs leading-relaxed pl-8">
                  <strong className="text-amber-400/80">Medical Disclaimer:</strong> Information provided is for educational purposes only and is not intended to diagnose, treat, cure, or prevent any disease. Always consult with qualified healthcare professionals before making health decisions.
                </p>
              </div>

              {/* Bottom Bar */}
              <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-earth-700/50">
                <p className="text-earth-500 text-sm">&copy; {new Date().getFullYear()} Verscienta Health. All rights reserved.</p>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                  <span className="text-earth-600 text-xs flex items-center gap-2">
                    <svg viewBox="0 0 20 20" className="w-4 h-4 text-sage-500" fill="currentColor">
                      <path d="M10 2c-1 4-4 6-4 10a4 4 0 008 0c0-4-3-6-4-10z" />
                    </svg>
                    Built with ancient wisdom & modern technology
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
        </ToastProvider>
      </body>
    </html>
  );
}