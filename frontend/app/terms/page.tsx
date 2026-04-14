import {
  PageWrapper,
  LeafPattern,
  BackLink,
} from '@/components/ui/DesignSystem';

export default function TermsPage() {
  return (
    <PageWrapper>
    <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 dark:from-earth-950 dark:via-earth-900 dark:to-earth-950 border-b border-sage-200/50 dark:border-earth-700">
      <LeafPattern opacity={0.04} />
      <div className="absolute top-20 right-20 w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-earth-300/15 rounded-full blur-3xl" />
      <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-earth-900/60 backdrop-blur-sm rounded-full px-4 py-2 border border-earth-200/50 dark:border-earth-700 mb-6">
          <svg className="w-4 h-4 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-gray-600 dark:text-earth-300 font-medium text-sm">Legal</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-earth-100 mb-2">
          Terms of Service
        </h1>
        <p className="text-gray-600 dark:text-earth-300">
          Last updated: January 2025
        </p>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-earth-900 rounded-2xl shadow-lg border border-earth-200 dark:border-earth-700 p-8 md:p-12">
        <div className="prose prose-earth dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed">
              By accessing or using Verscienta Health (&quot;the Service&quot;), you agree to be bound
              by these Terms of Service. If you do not agree to these terms, please do not
              use our Service.
            </p>
          </section>

          <section className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h2 className="text-xl font-serif font-bold text-yellow-800 mb-4 flex items-center gap-2">
              <span>⚠️</span> Medical Disclaimer
            </h2>
            <p className="text-yellow-800 leading-relaxed">
              <strong>IMPORTANT:</strong> The information provided on Verscienta Health is for
              educational and informational purposes only. It is NOT intended to be a substitute
              for professional medical advice, diagnosis, or treatment. Always seek the advice
              of your physician or other qualified health provider with any questions you may
              have regarding a medical condition. Never disregard professional medical advice
              or delay in seeking it because of something you have read on this website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">Use of Service</h2>

            <h3 className="text-lg font-semibold text-gray-700 dark:text-earth-200 mt-4 mb-2">Permitted Use</h3>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed mb-3">
              You may use the Service for lawful purposes only. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-earth-200 space-y-2">
              <li>Use the Service only for personal, non-commercial purposes</li>
              <li>Provide accurate information when creating an account</li>
              <li>Maintain the security of your account credentials</li>
              <li>Respect the intellectual property rights of others</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-700 dark:text-earth-200 mt-4 mb-2">Prohibited Activities</h3>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed mb-3">
              You may not:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-earth-200 space-y-2">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Scrape, harvest, or collect user data without consent</li>
              <li>Impersonate another person or entity</li>
              <li>Upload malicious code or content</li>
              <li>Use the Service to provide medical advice to others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed mb-3">
              All content on Verscienta Health, including but not limited to text, graphics,
              logos, images, and software, is the property of Verscienta Health or its content
              suppliers and is protected by copyright and other intellectual property laws.
            </p>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed">
              You may not reproduce, distribute, modify, or create derivative works from any
              content without our prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">User Content</h2>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed mb-3">
              By submitting content (reviews, comments, feedback) to our Service, you:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-earth-200 space-y-2">
              <li>Grant us a non-exclusive, royalty-free license to use, display, and distribute your content</li>
              <li>Confirm that you own or have the right to submit the content</li>
              <li>Agree that your content does not violate any third-party rights</li>
              <li>Accept that we may remove content that violates these terms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">Third-Party Links</h2>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed">
              Our Service may contain links to third-party websites or services. We are not
              responsible for the content, privacy policies, or practices of any third-party
              sites. You access such links at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed mb-3">
              To the fullest extent permitted by law, Verscienta Health shall not be liable for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-earth-200 space-y-2">
              <li>Any indirect, incidental, special, or consequential damages</li>
              <li>Any loss or damage arising from your reliance on information provided</li>
              <li>Any health-related outcomes resulting from use of our Service</li>
              <li>Service interruptions or data loss</li>
              <li>Errors or omissions in content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">Disclaimer of Warranties</h2>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed">
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
              either express or implied, including but not limited to warranties of merchantability,
              fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">Indemnification</h2>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed">
              You agree to indemnify and hold harmless Verscienta Health and its officers,
              directors, employees, and agents from any claims, damages, or expenses arising
              from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">Termination</h2>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed">
              We reserve the right to terminate or suspend your access to the Service at any
              time, without notice, for any reason, including violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed">
              We may modify these Terms at any time. We will notify users of significant changes
              by posting a notice on our website. Your continued use of the Service after changes
              constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">Governing Law</h2>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws,
              without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-earth-200 leading-relaxed">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-earth-50 dark:bg-earth-950 rounded-lg p-4 mt-4">
              <p className="text-gray-800 dark:text-earth-100">
                <strong>Verscienta Health</strong><br />
                Email: <a href="mailto:legal@verscienta.health" className="text-gray-600 dark:text-earth-300 hover:text-gray-800 dark:hover:text-earth-100">legal@verscienta.health</a>
              </p>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8">
        <BackLink href="/" label="Return to Home" />
      </div>
    </div>
    </PageWrapper>
  );
}
