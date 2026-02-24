import Link from 'next/link';
import { HeroSearch } from '@/components/HeroSearch';
import {
  PageWrapper,
  BotanicalSeparator,
  Section,
  Tag,
  DisclaimerBox,
  GlowCard,
  TestimonialCard,
  GradientText,
  ScrollIndicator,
} from '@/components/ui/DesignSystem';

export default function Home() {
  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-earth-100 via-sage-50 to-cream-100" />

        {/* Botanical pattern overlay with grain effect */}
        <div className="absolute inset-0 grain-overlay opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10c0 20-15 40-15 60s15 20 15 20 15 0 15-20-15-40-15-60z' fill='%23527a5f'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }} />

        {/* Decorative blurred circles - enhanced with animation */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-sage-200/30 rounded-full blur-3xl breathe" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-earth-200/30 rounded-full blur-3xl breathe" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-100/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 text-center">
          {/* Eyebrow with enhanced styling */}
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm px-5 py-2.5 rounded-full border border-earth-200/50 shadow-sm mb-8 animate-fade-in">
            <span className="relative w-2 h-2">
              <span className="absolute inset-0 bg-sage-500 rounded-full animate-ping opacity-75" />
              <span className="relative block w-2 h-2 bg-sage-500 rounded-full" />
            </span>
            <span className="text-sm font-medium text-earth-700 tracking-wide">Bridging Ancient Wisdom & Modern Science</span>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-earth-900 mb-8 tracking-tight leading-[1.05] animate-slide-up">
            Your Guide to
            <span className="block mt-2">
              <GradientText variant="sage" className="text-shadow-sm">Holistic Wellness</GradientText>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
            Explore traditional herbal remedies, holistic healing modalities, and receive
            personalized wellness recommendations powered by AI.
          </p>

          {/* Search Bar - Enhanced */}
          <div className="max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <HeroSearch />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Link
              href="/symptom-checker"
              className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-earth-700 to-sage-700 hover:from-earth-800 hover:to-sage-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-earth-900/20 transition-all hover:-translate-y-0.5 overflow-hidden"
            >
              {/* Shine effect on hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <svg className="w-5 h-5 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="relative">Try Symptom Checker</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/practitioners"
              className="group inline-flex items-center justify-center gap-3 bg-white/80 backdrop-blur-sm hover:bg-white text-earth-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-earth-200 hover:border-sage-400 transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Find Practitioners
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:block animate-fade-in" style={{ animationDelay: '1s' }}>
            <ScrollIndicator />
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced with Glow Cards */}
      <section className="py-16 md:py-24 relative">
        <div className="max-w-6xl mx-auto px-4">
          {/* Section header with decorative elements */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sage-600 text-sm font-semibold tracking-wider uppercase mb-4">
              <span className="w-8 h-px bg-sage-300" />
              Our Platform
              <span className="w-8 h-px bg-sage-300" />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-earth-900 mb-6">
              Comprehensive Health <GradientText variant="earth">Resources</GradientText>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Explore our extensive database covering traditional Chinese medicine,
              Western herbalism, and various holistic healing modalities.
            </p>
          </div>

          <BotanicalSeparator pattern="leaves" className="mb-12" />

          {/* Feature cards with enhanced styling */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Materia Medica Card */}
            <GlowCard glowColor="sage" className="h-full">
              <Link href="/herbs" className="block p-8 h-full group">
                <div className="w-16 h-16 bg-gradient-to-br from-sage-100 to-earth-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-sm">
                  🌿
                </div>
                <h3 className="font-serif text-xl font-bold text-earth-800 mb-3 group-hover:text-sage-700 transition-colors">
                  Materia Medica
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Comprehensive botanical information covering TCM properties, active constituents, therapeutic uses, dosages, and safety guidelines for hundreds of medicinal herbs.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['TCM Properties', 'Active Compounds', 'Safety Data'].map((tag) => (
                    <Tag key={tag} variant="sage" size="sm">{tag}</Tag>
                  ))}
                </div>
                <span className="inline-flex items-center gap-2 text-sage-600 font-medium text-sm group-hover:gap-3 transition-all">
                  Explore Herbs
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
            </GlowCard>

            {/* Healing Modalities Card */}
            <GlowCard glowColor="earth" className="h-full">
              <Link href="/modalities" className="block p-8 h-full group">
                <div className="w-16 h-16 bg-gradient-to-br from-earth-100 to-gold-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-sm">
                  ☯️
                </div>
                <h3 className="font-serif text-xl font-bold text-earth-800 mb-3 group-hover:text-sage-700 transition-colors">
                  Healing Modalities
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Explore diverse holistic health practices from acupuncture and yoga to Reiki and Ayurveda, with detailed information on benefits, techniques, and applications.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Acupuncture', 'Yoga', 'Ayurveda'].map((tag) => (
                    <Tag key={tag} variant="earth" size="sm">{tag}</Tag>
                  ))}
                </div>
                <span className="inline-flex items-center gap-2 text-sage-600 font-medium text-sm group-hover:gap-3 transition-all">
                  Explore Modalities
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
            </GlowCard>

            {/* AI Analysis Card - Featured */}
            <GlowCard glowColor="gold" className="h-full">
              <Link href="/symptom-checker" className="block p-8 h-full group relative">
                {/* Featured badge */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-gold-400 to-gold-500 text-white text-xs font-bold rounded-full shadow-sm">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    AI Powered
                  </span>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-gold-100 to-amber-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-sm">
                  🤖
                </div>
                <h3 className="font-serif text-xl font-bold text-earth-800 mb-3 group-hover:text-sage-700 transition-colors">
                  AI-Powered Analysis
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Get personalized wellness recommendations based on your symptoms using advanced AI technology that considers your unique health profile.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Smart Analysis', 'Personalized', 'Evidence-Based'].map((tag) => (
                    <Tag key={tag} variant="amber" size="sm">{tag}</Tag>
                  ))}
                </div>
                <span className="inline-flex items-center gap-2 text-gold-600 font-medium text-sm group-hover:gap-3 transition-all">
                  Try Symptom Checker
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* TCM Special Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50/50 to-red-50/30" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='15' fill='none' stroke='%23c1272d' stroke-width='0.5'/%3E%3Cpath d='M20 5c0 7.5-7.5 15-7.5 22.5S20 35 20 35s7.5 0 7.5-7.5S20 12.5 20 5z' fill='%23c1272d' opacity='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-5xl">☯️</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-amber-900 mb-6">
              Traditional Chinese Medicine
            </h2>
            <p className="text-xl text-amber-800 max-w-3xl mx-auto">
              Honoring thousands of years of healing wisdom with modern scientific understanding.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Section title="TCM Herb Database" icon="🏮" variant="tcm" className="h-full">
              <p className="text-amber-800 mb-6">
                Complete information on traditional Chinese herbs including taste properties,
                temperature qualities, meridian affinities, and classical formulas.
              </p>
              <ul className="space-y-3">
                {['Five Tastes & Temperatures (味 Wèi / 性 Xìng)', 'Meridian Channel Associations (經絡 Jīngluò)', 'Classical Formula Combinations'].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-amber-900">
                    <svg className="w-5 h-5 text-tcm-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Modern Scientific Research" icon="🔬" variant="tcm" className="h-full">
              <p className="text-amber-800 mb-6">
                Bridging traditional knowledge with contemporary pharmacological research and
                clinical studies to validate efficacy and safety.
              </p>
              <ul className="space-y-3">
                {['Active Constituent Analysis', 'Clinical Trial Data', 'Safety & Interaction Studies'].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-amber-900">
                    <svg className="w-5 h-5 text-earth-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-earth-700 via-earth-800 to-sage-800" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-2 10-10 18-20 20 10 2 18 10 20 20 2-10 10-18 20-20-10-2-18-10-20-20z' fill='%23ffffff'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-sage-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-white mb-3">
              Trusted by Wellness Seekers Worldwide
            </h3>
            <p className="text-earth-200">Our growing database of natural healing wisdom</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '500+', label: 'Medicinal Herbs', icon: '🌿' },
              { value: '50+', label: 'Health Modalities', icon: '☯️' },
              { value: '200+', label: 'Classical Formulas', icon: '📜' },
              { value: '1000+', label: 'Practitioners', icon: '👨‍⚕️' },
            ].map((stat, idx) => (
              <div key={idx} className="relative group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center hover:bg-white/15 transition-all duration-300">
                  <span className="text-3xl md:text-4xl mb-3 block">{stat.icon}</span>
                  <div className="text-3xl md:text-4xl font-bold text-white font-serif mb-1">{stat.value}</div>
                  <div className="text-sm text-earth-200">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cream-50 to-white" />

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sage-600 text-sm font-semibold tracking-wider uppercase mb-4">
              <span className="w-8 h-px bg-sage-300" />
              What People Say
              <span className="w-8 h-px bg-sage-300" />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-earth-900 mb-6">
              Stories of <GradientText variant="sage">Healing</GradientText>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover how holistic approaches have transformed lives
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="The herb database helped me understand my TCM prescriptions better. The integration of traditional wisdom with scientific research is exactly what I was looking for."
              author="Sarah M."
              role="Wellness Enthusiast"
              avatarInitials="SM"
            />
            <TestimonialCard
              quote="As a practitioner, I recommend this platform to all my patients. The comprehensive information on herb interactions and safety is invaluable."
              author="Dr. James Chen"
              role="Licensed Acupuncturist"
              avatarInitials="JC"
              variant="featured"
            />
            <TestimonialCard
              quote="The symptom checker gave me insights I never expected. It helped me have a much more informed conversation with my healthcare provider."
              author="Maria K."
              role="Health-Conscious Mom"
              avatarInitials="MK"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-earth-800 via-earth-700 to-sage-800 text-white rounded-3xl p-12 md:p-16 text-center shadow-2xl">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sage-400/10 rounded-full blur-3xl" />

            <div className="absolute top-8 left-8 opacity-20">
              <svg viewBox="0 0 60 60" className="w-12 h-12">
                <path d="M30 5c-2 10-10 18-20 20 10 2 18 10 20 20 2-10 10-18 20-20-10-2-18-10-20-20z" fill="currentColor"/>
              </svg>
            </div>
            <div className="absolute bottom-8 right-8 opacity-20">
              <svg viewBox="0 0 60 60" className="w-16 h-16">
                <path d="M30 5c-2 10-10 18-20 20 10 2 18 10 20 20 2-10 10-18 20-20-10-2-18-10-20-20z" fill="currentColor"/>
              </svg>
            </div>

            <div className="relative">
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
                Ready to Start Your <br className="hidden sm:block" />Wellness Journey?
              </h2>
              <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-2xl mx-auto leading-relaxed">
                Discover holistic approaches to health tailored to your unique needs,
                backed by both ancient wisdom and modern science.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/symptom-checker"
                  className="group inline-flex items-center justify-center gap-3 bg-white text-earth-800 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-earth-50 transition-all hover:-translate-y-0.5"
                >
                  Get Started Now
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/practitioners"
                  className="inline-flex items-center justify-center gap-3 bg-transparent border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white transition-all"
                >
                  Find a Practitioner
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <DisclaimerBox>
            <p>
              The information provided on this website is for educational purposes only and is not
              intended to replace professional medical advice, diagnosis, or treatment. Always seek
              the advice of your physician or qualified healthcare provider with any questions you
              may have regarding a medical condition.
            </p>
          </DisclaimerBox>
        </div>
      </section>
    </PageWrapper>
  );
}
