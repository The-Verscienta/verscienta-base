import Link from 'next/link';
import {
  PageWrapper,
  LeafPattern,
  BotanicalDivider,
  Section,
  DisclaimerBox,
  BackLink,
} from '@/components/ui/DesignSystem';

export const metadata = {
  title: 'About Us - Verscienta Health',
  description: 'Learn about Verscienta Health and our mission to bridge ancient healing wisdom with modern science.',
};

// Feature card component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-earth-100 hover:shadow-md hover:border-sage-200 transition-all">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sage-100 to-earth-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-serif font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// Value item component
function ValueItem({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-gradient-to-br from-earth-100 to-sage-100 rounded-full flex items-center justify-center flex-shrink-0 border border-earth-200">
        <span className="text-earth-700 font-bold">{number}</span>
      </div>
      <div>
        <h3 className="font-serif font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <PageWrapper>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 border-b border-earth-200/50">
        <LeafPattern opacity={0.04} />

        {/* Decorative blurred circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-earth-300/15 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-earth-200/50 mb-6">
            <svg className="w-4 h-4 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-sage-700 font-medium text-sm">Our Story</span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            About Verscienta Health
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Bridging ancient healing wisdom with modern scientific understanding
            to empower your wellness journey.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission Section */}
        <Section
          icon={
            <svg className="w-5 h-5 text-earth-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
          title="Our Mission"
          variant="card"
          className="mb-8"
        >
          <p className="text-gray-700 leading-relaxed mb-4">
            At Verscienta Health, we believe that true wellness comes from understanding
            both traditional healing practices and modern medical science. Our mission is
            to create a comprehensive, accessible resource that helps individuals make
            informed decisions about their health using the best of both worlds.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We are dedicated to preserving and sharing the knowledge of Traditional Chinese
            Medicine, Western herbalism, and various holistic healing modalities while
            maintaining rigorous standards for accuracy and safety.
          </p>
        </Section>

        {/* What We Offer */}
        <Section
          icon={
            <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
          title="What We Offer"
          variant="botanical"
          className="mb-8"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              title="Comprehensive Herb Database"
              description="Detailed information on hundreds of medicinal herbs, including TCM properties, active constituents, dosages, and safety guidelines."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              title="Healing Modalities"
              description="Explore diverse holistic practices from acupuncture and yoga to energy healing and Ayurveda."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              title="AI-Powered Insights"
              description="Our symptom checker uses advanced AI to provide personalized wellness recommendations based on your unique needs."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              title="Practitioner Directory"
              description="Connect with qualified holistic health practitioners in your area who can provide personalized guidance."
            />
          </div>
        </Section>

        {/* Our Values */}
        <Section
          icon={
            <svg className="w-5 h-5 text-earth-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          title="Our Values"
          variant="card"
          className="mb-8"
        >
          <div className="space-y-5">
            <ValueItem
              number={1}
              title="Accuracy & Integrity"
              description="We rigorously verify all information and clearly distinguish between traditional use and scientific evidence."
            />
            <ValueItem
              number={2}
              title="Respect for Tradition"
              description="We honor the wisdom of traditional healing systems while presenting them in accessible, practical ways."
            />
            <ValueItem
              number={3}
              title="Safety First"
              description="We emphasize safety information, contraindications, and always recommend consulting healthcare professionals."
            />
            <ValueItem
              number={4}
              title="Accessibility"
              description="We strive to make holistic health information accessible to everyone, regardless of background or experience."
            />
          </div>
        </Section>

        <BotanicalDivider className="mb-8" />

        {/* Disclaimer */}
        <DisclaimerBox className="mb-8" />

        {/* CTA */}
        <div className="relative bg-gradient-to-r from-earth-700 via-earth-800 to-sage-800 rounded-2xl p-8 md:p-12 text-white text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <LeafPattern opacity={0.3} />
          </div>
          <div className="relative">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
              Start Your Wellness Journey Today
            </h2>
            <p className="mb-8 text-white/80 max-w-xl mx-auto leading-relaxed">
              Explore our comprehensive database and discover holistic approaches to health
              that have been trusted for generations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/herbs"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-cream-50 transition-all shadow-lg"
              >
                Explore Herbs
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/symptom-checker"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/50 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 hover:border-white transition-all"
              >
                Try Symptom Checker
              </Link>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <BackLink href="/" label="Return to Home" />
        </div>
      </div>
    </PageWrapper>
  );
}
