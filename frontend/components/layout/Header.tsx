'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { UserMenu } from '@/components/auth/UserMenu';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

// Decorative leaf SVG for the logo
function LogoLeaf() {
  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
      <defs>
        <linearGradient id="logoLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a9c2b1" />
          <stop offset="50%" stopColor="#6b9279" />
          <stop offset="100%" stopColor="#426650" />
        </linearGradient>
        <linearGradient id="logoLeafAccent" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d4a574" />
          <stop offset="100%" stopColor="#e0b589" />
        </linearGradient>
      </defs>
      {/* Main leaf shape */}
      <path
        d="M20 4c-3 10-12 16-12 24a12 12 0 0024 0c0-8-9-14-12-24z"
        fill="url(#logoLeafGrad)"
      />
      {/* Vein lines */}
      <path
        d="M20 10v20M16 16c2 2 4 6 4 10M24 16c-2 2-4 6-4 10"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      {/* Small accent dot */}
      <circle cx="20" cy="34" r="2" fill="url(#logoLeafAccent)" />
    </svg>
  );
}

// Dropdown arrow icon
function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const pathname = usePathname();

  // Track scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const primaryLinks = [
    { href: '/', label: 'Home' },
    { href: '/symptom-checker', label: 'Symptom Checker', highlight: true },
    { href: '/herbs', label: 'Herbs' },
    { href: '/formulas', label: 'Formulas' },
    { href: '/points', label: 'Points' },
    { href: '/patterns', label: 'Patterns' },
    { href: '/concepts', label: 'Concepts' },
    { href: '/modalities', label: 'Modalities' },
    { href: '/conditions', label: 'Conditions' },
  ];

  const resourceLinks = [
    { href: '/practitioners', label: 'Find Practitioners', icon: '👨‍⚕️' },
    { href: '/clinics', label: 'Find Clinics', icon: '🏥' },
    { href: '/search', label: 'Search Database', icon: '🔍' },
    { href: '/about', label: 'About Us', icon: '📖' },
    { href: '/contact', label: 'Contact', icon: '✉️' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-earth-800/95 backdrop-blur-md shadow-lg shadow-earth-900/20 dark:bg-earth-950/95'
          : 'bg-gradient-to-r from-earth-800 via-earth-700 to-sage-800 dark:from-earth-900 dark:via-earth-850 dark:to-sage-900'
      }`}
    >
      {/* Decorative top border */}
      <div className="h-0.5 bg-sage-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <LogoLeaf />
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 bg-sage-400/0 group-hover:bg-sage-400/20 rounded-full blur-xl transition-all duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight">
                Verscienta
              </span>
              <span className="text-[10px] md:text-xs text-sage-300 font-medium tracking-widest uppercase -mt-0.5">
                Health
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`relative px-3 xl:px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isActive(link.href)
                    ? 'bg-white/15 text-white'
                    : 'text-earth-100 hover:text-white hover:bg-white/10'
                } ${link.highlight ? 'bg-gradient-to-r from-sage-600/80 to-earth-600/80 hover:from-sage-500 hover:to-earth-500 text-white shadow-sm' : ''}`}
              >
                {link.label}
                {isActive(link.href) && !link.highlight && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold-400 rounded-full" />
                )}
              </Link>
            ))}

            {/* Resources Dropdown */}
            <div className="relative">
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                onBlur={() => setTimeout(() => setResourcesOpen(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setResourcesOpen(false);
                }}
                aria-expanded={resourcesOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 px-3 xl:px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  resourcesOpen
                    ? 'bg-white/15 text-white'
                    : 'text-earth-100 hover:text-white hover:bg-white/10'
                }`}
              >
                Resources
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${resourcesOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {resourcesOpen && (
                <div
                  role="menu"
                  className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-earth-900 rounded-xl shadow-xl shadow-earth-900/20 border border-earth-100 dark:border-earth-700 overflow-hidden animate-fade-in"
                >
                  <div className="p-2">
                    {resourceLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-earth-200 hover:bg-earth-50 dark:hover:bg-earth-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <span className="text-lg" aria-hidden="true">{link.icon}</span>
                        <span className="font-medium text-sm">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-earth-100 dark:border-earth-700 bg-earth-50/50 dark:bg-earth-950/50 px-4 py-3">
                    <p className="text-xs text-earth-500 dark:text-earth-400">
                      Explore our complete wellness database
                    </p>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search Button (Desktop) */}
            <Link
              href="/search"
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Language Switcher */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* User Menu (Desktop) */}
            <div className="hidden lg:block">
              <UserMenu />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? 'opacity-0 scale-0' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-out ${
          mobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-earth-800/95 backdrop-blur-md border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Primary Links */}
            <nav aria-label="Mobile navigation" className="space-y-1 mb-4">
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive(link.href)
                      ? 'bg-white/15 text-white'
                      : 'text-earth-100 hover:text-white hover:bg-white/10'
                  } ${link.highlight ? 'bg-gradient-to-r from-sage-600/80 to-earth-600/80' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="ml-auto w-2 h-2 bg-gold-400 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Divider with botanical element */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <svg viewBox="0 0 20 20" className="w-4 h-4 text-sage-400">
                <path d="M10 2c-1 4-4 6-4 10a4 4 0 008 0c0-4-3-6-4-10z" fill="currentColor" opacity="0.5" />
              </svg>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Resource Links */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {resourceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-earth-200 hover:text-white transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{link.icon}</span>
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="pt-2 border-t border-white/10">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
