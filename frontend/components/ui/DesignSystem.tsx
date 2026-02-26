'use client';

import React from 'react';

// Decorative botanical SVG divider
export function BotanicalDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-6 ${className}`}>
      <svg viewBox="0 0 200 24" className="w-48 h-6 text-earth-300" fill="currentColor">
        <path d="M100 12c-8-8-20-10-30-8s-18 8-25 8-15-4-25-4-18 4-20 4v4c2 0 10-4 20-4s18 4 25 4 15-6 25-8 22 0 30 8c8-8 20-10 30-8s18 8 25 8 15-4 25-4 18 4 20 4v-4c-2 0-10 4-20 4s-18-4-25-4-15 6-25 8-22 0-30-8z" opacity="0.6"/>
        <circle cx="100" cy="12" r="4"/>
        <circle cx="85" cy="12" r="2"/>
        <circle cx="115" cy="12" r="2"/>
      </svg>
    </div>
  );
}

// Leaf pattern background component
export function LeafPattern({ opacity = 0.02 }: { opacity?: number }) {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-2 8-8 14-16 16 8 2 14 8 16 16 2-8 8-14 16-16-8-2-14-8-16-16z' fill='%23527a5f' fill-opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }}
    />
  );
}

// Page wrapper with gradient background
export function PageWrapper({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string
}) {
  return (
    <div className={`min-h-screen bg-gradient-to-b from-earth-50 via-white to-sage-50 ${className}`}>
      <LeafPattern />
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

// Section component with consistent styling
export function Section({
  id,
  title,
  icon,
  subtitle,
  variant = 'default',
  children,
  className = ''
}: {
  id?: string;
  title: string;
  icon?: string | React.ReactNode;
  subtitle?: string;
  variant?: 'default' | 'warning' | 'tcm' | 'cultural' | 'feature' | 'card' | 'botanical';
  children: React.ReactNode;
  className?: string;
}) {
  const variants = {
    default: 'bg-white border-earth-200',
    warning: 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200',
    tcm: 'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-amber-300',
    cultural: 'bg-gradient-to-br from-sage-50 via-earth-50 to-gold-50 border-sage-300',
    feature: 'bg-gradient-to-br from-earth-50 to-sage-50 border-earth-200',
    card: 'bg-white border-earth-100 shadow-sm',
    botanical: 'bg-gradient-to-br from-cream-50 via-sage-50/30 to-earth-50/20 border-sage-200',
  };

  const titleColors = {
    default: 'text-gray-900',
    warning: 'text-red-800',
    tcm: 'text-amber-900',
    cultural: 'text-gray-900',
    feature: 'text-gray-900',
    card: 'text-gray-900',
    botanical: 'text-gray-900',
  };

  return (
    <section id={id} className={`relative border rounded-2xl p-8 scroll-mt-24 ${variants[variant]} ${className}`}>
      {(title || icon) && (
        <div className="mb-6">
          <h2 className={`font-serif text-2xl md:text-3xl font-bold flex items-center gap-3 ${titleColors[variant]}`}>
            {icon && (
              typeof icon === 'string'
                ? <span className="text-3xl">{icon}</span>
                : <span className="flex-shrink-0">{icon}</span>
            )}
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 mt-2 text-lg">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

// Tag/Badge component with multiple variants
export function Tag({
  children,
  variant = 'sage',
  size = 'md'
}: {
  children: React.ReactNode;
  variant?: 'sage' | 'earth' | 'amber' | 'blue' | 'purple' | 'red' | 'cyan' | 'orange' | 'green' | 'gray' | 'gold' | 'warm' | 'muted';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    sage: 'bg-sage-100 text-sage-800 border-sage-200',
    earth: 'bg-earth-100 text-gray-800 border-earth-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    gold: 'bg-gold-100 text-gold-700 border-gold-200',
    warm: 'bg-warm-100 text-warm-700 border-warm-200',
    muted: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium border transition-all hover:scale-105 ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

// Feature card with hover effects
export function FeatureCard({
  icon,
  title,
  description,
  href,
  tags,
  variant = 'default'
}: {
  icon: string;
  title: string;
  description?: string;
  href?: string;
  tags?: string[];
  variant?: 'default' | 'featured';
}) {
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`group relative block bg-white rounded-2xl border border-earth-200 p-6 card-interactive hover:border-sage-300 ${href ? 'cursor-pointer' : ''} ${variant === 'featured' ? 'md:p-8' : ''}`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className={`font-serif font-bold text-gray-900 mb-2 group-hover:text-sage-700 transition-colors ${variant === 'featured' ? 'text-2xl' : 'text-xl'}`}>
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 text-sm leading-relaxed mb-4">{description}</p>
      )}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <Tag key={idx} variant="sage" size="sm">{tag}</Tag>
          ))}
        </div>
      )}
      {href && (
        <div className="mt-4 flex items-center gap-2 text-sage-600 font-medium text-sm group-hover:text-sage-700 group-hover:gap-3 transition-all">
          Learn more
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      )}
    </Wrapper>
  );
}

// Hero section component
export function HeroSection({
  title,
  subtitle,
  children,
  size = 'default'
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  size?: 'default' | 'large' | 'small';
}) {
  const sizes = {
    small: 'py-12 md:py-16',
    default: 'py-16 md:py-24',
    large: 'py-24 md:py-32',
  };

  return (
    <header className={`relative overflow-hidden ${sizes[size]}`}>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-earth-100 via-sage-50 to-earth-50" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10c0 20-15 40-15 60s15 20 15 20 15 0 15-20-15-40-15-60z' fill='%23527a5f'/%3E%3C/svg%3E")`,
        backgroundSize: '100px 100px'
      }} />

      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-sage-200/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-earth-200/20 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 text-center">
        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </header>
  );
}

// Stats display component
export function StatsBar({ stats }: { stats: { label: string; value: string | number; icon?: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-xl border border-earth-200 p-4 text-center">
          {stat.icon && <span className="text-2xl mb-2 block">{stat.icon}</span>}
          <div className="text-3xl font-bold text-gray-800 font-serif">{stat.value}</div>
          <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// Empty state component
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = ''
}: {
  icon: string | React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-center py-16 ${className}`}>
      <div className="text-6xl mb-4 opacity-50">
        {typeof icon === 'string' ? icon : <div className="flex justify-center">{icon}</div>}
      </div>
      <h3 className="font-serif text-2xl font-bold text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 max-w-md mx-auto mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}

// Disclaimer box component
export function DisclaimerBox({
  title = 'Important Disclaimer',
  children,
  className = ''
}: {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const defaultContent = (
    <p className="text-sm leading-relaxed">
      The information provided is for educational purposes only and is not intended to replace
      professional medical advice, diagnosis, or treatment. Always consult with qualified
      healthcare professionals before making health decisions.
    </p>
  );

  return (
    <div className={`bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 md:p-8 shadow-sm ${className}`}>
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-amber-900 text-lg mb-2">{title}</h3>
          <div className="text-amber-800 leading-relaxed">{children || defaultContent}</div>
        </div>
      </div>
    </div>
  );
}

// Grid layouts
export function CardGrid({
  children,
  columns = 3,
  className = ''
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid gap-6 ${colClasses[columns]} ${className}`}>
      {children}
    </div>
  );
}

// Back link component
export function BackLink({
  href,
  children,
  label,
  className = ''
}: {
  href: string;
  children?: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <a
        href={href}
        className="inline-flex items-center gap-3 text-earth-600 hover:text-gray-800 font-semibold text-lg transition-colors group"
      >
        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        {children || label || 'Go Back'}
      </a>
    </div>
  );
}

// Table of contents sidebar
export function TableOfContents({
  items,
  className = ''
}: {
  items: { id: string; label: string }[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-earth-200 p-6 shadow-lg ${className}`}>
      <h3 className="text-sm font-bold text-earth-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h12"/>
        </svg>
        Contents
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block py-2 px-3 text-sm text-earth-600 hover:text-gray-900 hover:bg-earth-50 rounded-lg transition-colors font-medium"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Icon wrapper for consistent styling
export function IconBox({
  children,
  variant = 'sage',
  size = 'md'
}: {
  children: React.ReactNode;
  variant?: 'sage' | 'earth' | 'amber' | 'red' | 'blue';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    sage: 'bg-sage-100 text-sage-600',
    earth: 'bg-earth-100 text-earth-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`rounded-xl flex items-center justify-center ${variants[variant]} ${sizes[size]}`}>
      {children}
    </div>
  );
}

// Animated gradient border card
export function GlowCard({
  children,
  className = '',
  glowColor = 'sage'
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'sage' | 'earth' | 'gold' | 'tcm';
}) {
  const glowColors = {
    sage: 'from-sage-400/20 via-sage-500/30 to-sage-400/20',
    earth: 'from-earth-400/20 via-earth-500/30 to-earth-400/20',
    gold: 'from-gold-400/20 via-gold-500/30 to-gold-400/20',
    tcm: 'from-red-400/20 via-amber-500/30 to-red-400/20',
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Animated glow effect */}
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${glowColors[glowColor]} rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500`}
      />
      <div className="relative bg-white rounded-2xl border border-earth-100 shadow-sm group-hover:shadow-xl transition-all duration-300">
        {children}
      </div>
    </div>
  );
}

// Testimonial/Quote card with decorative elements
export function TestimonialCard({
  quote,
  author,
  role,
  avatarInitials,
  variant = 'default'
}: {
  quote: string;
  author: string;
  role?: string;
  avatarInitials?: string;
  variant?: 'default' | 'featured';
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-8 ${
        variant === 'featured'
          ? 'bg-gradient-to-br from-earth-700 via-earth-800 to-sage-800 text-white'
          : 'bg-white border border-earth-100 shadow-sm'
      }`}
    >
      {/* Decorative quote mark */}
      <div className={`absolute top-4 right-4 text-6xl font-serif leading-none ${
        variant === 'featured' ? 'text-white/10' : 'text-sage-200'
      }`}>
        &ldquo;
      </div>

      {/* Decorative botanical element */}
      <div className={`absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-3xl ${
        variant === 'featured' ? 'bg-sage-500/20' : 'bg-sage-100'
      }`} />

      <div className="relative">
        <p className={`text-lg leading-relaxed mb-6 ${
          variant === 'featured' ? 'text-earth-100' : 'text-gray-700'
        }`}>
          {quote}
        </p>

        <div className="flex items-center gap-4">
          {avatarInitials && (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
              variant === 'featured'
                ? 'bg-white/20 text-white'
                : 'bg-gradient-to-br from-sage-500 to-earth-600 text-white'
            }`}>
              {avatarInitials}
            </div>
          )}
          <div>
            <p className={`font-semibold ${
              variant === 'featured' ? 'text-white' : 'text-gray-800'
            }`}>
              {author}
            </p>
            {role && (
              <p className={`text-sm ${
                variant === 'featured' ? 'text-earth-300' : 'text-sage-600'
              }`}>
                {role}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Decorative floating element with parallax effect
export function FloatingLeaf({
  position = 'top-left',
  size = 'md',
  delay = 0
}: {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
}) {
  const positions = {
    'top-left': 'top-8 left-8',
    'top-right': 'top-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'bottom-right': 'bottom-8 right-8',
  };

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };

  return (
    <div
      className={`absolute ${positions[position]} ${sizes[size]} opacity-20 pointer-events-none`}
      style={{
        animation: `float 6s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <svg viewBox="0 0 60 60" className="w-full h-full text-sage-600" fill="currentColor">
        <path d="M30 5c-2 10-10 18-20 20 10 2 18 10 20 20 2-10 10-18 20-20-10-2-18-10-20-20z" />
      </svg>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}

// Animated counter component
export function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  duration = 2000
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing function for smooth animation
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.floor(eased * value));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`counter-${value}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return (
    <span id={`counter-${value}`} className="tabular-nums">
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// Progress indicator with botanical styling
export function BotanicalProgress({
  value,
  max = 100,
  label,
  showValue = true,
  variant = 'sage'
}: {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'sage' | 'earth' | 'gold';
}) {
  const percentage = Math.min((value / max) * 100, 100);

  const variants = {
    sage: 'from-sage-400 to-sage-600',
    earth: 'from-earth-400 to-earth-600',
    gold: 'from-gold-400 to-gold-600',
  };

  return (
    <div className="space-y-2">
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-earth-700 font-medium">{label}</span>}
          {showValue && <span className="text-sage-600 font-semibold">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="relative h-3 bg-earth-100 rounded-full overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="h-full"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 16px)`,
            }}
          />
        </div>
        {/* Progress bar */}
        <div
          className={`h-full bg-gradient-to-r ${variants[variant]} rounded-full transition-all duration-700 ease-out relative`}
          style={{ width: `${percentage}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Accordion component for FAQs or collapsible content
export function Accordion({
  items,
  className = ''
}: {
  items: { title: string; content: React.ReactNode }[];
  className?: string;
}) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-earth-100 overflow-hidden shadow-sm"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-earth-50/50 transition-colors"
          >
            <span className="font-serif font-semibold text-gray-800">{item.title}</span>
            <svg
              className={`w-5 h-5 text-sage-600 transition-transform duration-300 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              openIndex === index ? 'max-h-96' : 'max-h-0'
            }`}
          >
            <div className="px-6 pb-4 text-gray-600 leading-relaxed border-t border-earth-100 pt-4">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Info tooltip with botanical styling
export function InfoTooltip({
  content,
  children
}: {
  content: string;
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <span className="relative inline-flex">
      <span
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </span>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-earth-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap animate-fade-in z-50">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-earth-800" />
        </div>
      )}
    </span>
  );
}

// Gradient text component
export function GradientText({
  children,
  variant = 'earth',
  className = ''
}: {
  children: React.ReactNode;
  variant?: 'earth' | 'sage' | 'tcm' | 'gold';
  className?: string;
}) {
  const gradients = {
    earth: 'from-earth-600 via-earth-700 to-sage-700',
    sage: 'from-sage-500 via-sage-600 to-earth-600',
    tcm: 'from-red-600 via-amber-600 to-orange-600',
    gold: 'from-gold-500 via-gold-600 to-amber-700',
  };

  return (
    <span className={`bg-gradient-to-r ${gradients[variant]} bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

// Pill navigation component
export function PillNav({
  items,
  activeIndex,
  onChange,
  className = ''
}: {
  items: { label: string; icon?: string }[];
  activeIndex: number;
  onChange: (index: number) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex bg-earth-100 rounded-full p-1 ${className}`}>
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => onChange(index)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeIndex === index
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-earth-600 hover:text-gray-800'
          }`}
        >
          {item.icon && <span>{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// Decorative corner flourish
export function CornerFlourish({
  position = 'top-right',
  variant = 'sage'
}: {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  variant?: 'sage' | 'earth' | 'gold';
}) {
  const positions = {
    'top-left': 'top-0 left-0 rotate-0',
    'top-right': 'top-0 right-0 rotate-90',
    'bottom-left': 'bottom-0 left-0 -rotate-90',
    'bottom-right': 'bottom-0 right-0 rotate-180',
  };

  const colors = {
    sage: 'text-sage-200',
    earth: 'text-earth-200',
    gold: 'text-gold-200',
  };

  return (
    <div className={`absolute ${positions[position]} w-24 h-24 pointer-events-none ${colors[variant]}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
        <path d="M0 0h100v10c-20 0-30 10-40 20s-20 30-30 40-20 20-30 30v-100z" opacity="0.5" />
        <path d="M0 0h80v8c-16 0-24 8-32 16s-16 24-24 32-16 16-24 24v-80z" opacity="0.3" />
      </svg>
    </div>
  );
}

// Animated scroll indicator
export function ScrollIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <span className="text-xs text-earth-400 uppercase tracking-widest font-medium">Scroll</span>
      <div className="w-6 h-10 border-2 border-earth-300 rounded-full flex justify-center pt-2">
        <div className="w-1.5 h-3 bg-sage-500 rounded-full animate-bounce" />
      </div>
    </div>
  );
}

// Numbered list with botanical styling
export function NumberedList({
  items,
  className = ''
}: {
  items: { title: string; description: string }[];
  className?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-sage-500 to-earth-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
            {index + 1}
          </div>
          <div className="pt-1">
            <h4 className="font-serif font-bold text-gray-800 mb-1">{item.title}</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Botanical separator with customizable pattern
export function BotanicalSeparator({
  pattern = 'dots',
  className = ''
}: {
  pattern?: 'dots' | 'leaves' | 'wave';
  className?: string;
}) {
  const patterns = {
    dots: (
      <div className="flex items-center justify-center gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-sage-300 rounded-full"
            style={{ opacity: 1 - Math.abs(i - 2) * 0.25 }}
          />
        ))}
      </div>
    ),
    leaves: (
      <div className="flex items-center justify-center gap-4">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-earth-200" />
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-sage-400" fill="currentColor">
          <path d="M12 2c-2 6-6 10-6 16a6 6 0 0012 0c0-6-4-10-6-16z" />
        </svg>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-earth-200" />
      </div>
    ),
    wave: (
      <svg viewBox="0 0 200 24" className="w-48 h-6 text-earth-200" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M0 12c20 0 20-8 40-8s20 16 40 16 20-16 40-16 20 8 40 8 20 0 40 0" />
      </svg>
    ),
  };

  return (
    <div className={`py-8 ${className}`}>
      {patterns[pattern]}
    </div>
  );
}

// Badge with pulse animation for notifications
export function PulseBadge({
  children,
  variant = 'sage',
  pulse = true
}: {
  children: React.ReactNode;
  variant?: 'sage' | 'earth' | 'gold' | 'red';
  pulse?: boolean;
}) {
  const variants = {
    sage: 'bg-sage-500',
    earth: 'bg-earth-500',
    gold: 'bg-gold-500',
    red: 'bg-red-500',
  };

  return (
    <span className="relative inline-flex">
      <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white rounded-full ${variants[variant]}`}>
        {children}
      </span>
      {pulse && (
        <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 ${variants[variant]} rounded-full animate-ping`} />
      )}
    </span>
  );
}
