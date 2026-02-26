'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageWrapper, LeafPattern, BackLink } from '@/components/ui/DesignSystem';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // General
  {
    category: 'General',
    question: 'What is Verscienta Health?',
    answer: 'Verscienta Health is a comprehensive platform for exploring holistic health information. We provide evidence-based information about medicinal herbs, holistic modalities, health conditions, and connect users with qualified practitioners in their area.',
  },
  {
    category: 'General',
    question: 'Is the information on Verscienta Health medically reviewed?',
    answer: 'Our content is compiled from reputable sources and undergoes a peer review process. However, the information is for educational purposes only and should not replace professional medical advice. Always consult with a qualified healthcare provider before making health decisions.',
  },
  {
    category: 'General',
    question: 'Is Verscienta Health free to use?',
    answer: 'Yes, browsing our herb database, modality information, and general health content is completely free. Some premium features like personalized recommendations and practitioner booking may require an account.',
  },
  // Herbs & Formulas
  {
    category: 'Herbs & Formulas',
    question: 'Are the herbs listed safe to use?',
    answer: 'Each herb listing includes safety information, contraindications, and potential drug interactions. However, herbs can have powerful effects and may interact with medications. Always consult with a qualified herbalist or healthcare provider before using any herb, especially if you are pregnant, nursing, or taking medications.',
  },
  {
    category: 'Herbs & Formulas',
    question: 'Where can I purchase the herbs listed?',
    answer: 'Verscienta Health is an informational resource and does not sell herbs directly. We recommend purchasing herbs from reputable suppliers who provide quality testing and certification. Look for organic certification and third-party testing when possible.',
  },
  {
    category: 'Herbs & Formulas',
    question: 'What is TCM and why do some herbs have TCM properties listed?',
    answer: 'TCM stands for Traditional Chinese Medicine, a comprehensive medical system that has been practiced for thousands of years. TCM properties like temperature, taste, and meridian associations provide additional context for how herbs have been traditionally used in Chinese medicine.',
  },
  {
    category: 'Herbs & Formulas',
    question: 'Can I create my own herbal formulas using your information?',
    answer: 'While we provide formula information for educational purposes, creating herbal formulas requires expertise. We strongly recommend working with a qualified herbalist or TCM practitioner who can create personalized formulas based on your individual constitution and health needs.',
  },
  // Practitioners
  {
    category: 'Practitioners',
    question: 'How are practitioners verified?',
    answer: 'Practitioners listed on our platform provide their credentials and practice information. We encourage users to verify credentials independently and read reviews from other patients. We recommend checking with relevant professional licensing boards in your area.',
  },
  {
    category: 'Practitioners',
    question: 'Can I book appointments through Verscienta Health?',
    answer: 'Currently, we provide contact information for practitioners so you can reach out to them directly. We are working on an integrated booking system that will be available in a future update.',
  },
  {
    category: 'Practitioners',
    question: 'How can I become a listed practitioner?',
    answer: 'If you are a qualified holistic health practitioner, you can create a profile through our practitioner registration process. You will need to provide your credentials, practice information, and agree to our terms of service.',
  },
  // Symptom Checker
  {
    category: 'Symptom Checker',
    question: 'How does the symptom checker work?',
    answer: 'Our symptom checker uses AI to analyze your symptoms and suggest potential holistic approaches that may be helpful. It considers various factors including symptom severity, duration, and related conditions to provide personalized suggestions.',
  },
  {
    category: 'Symptom Checker',
    question: 'Can the symptom checker diagnose my condition?',
    answer: 'No. The symptom checker is an educational tool only and cannot diagnose any medical condition. It provides general information about holistic approaches that others have found helpful for similar symptoms. Always consult with a qualified healthcare provider for proper diagnosis and treatment.',
  },
  // Account & Privacy
  {
    category: 'Account & Privacy',
    question: 'What data do you collect about me?',
    answer: 'We collect only the information necessary to provide our services, including account information and usage data. We do not sell your personal information to third parties. Please review our Privacy Policy for complete details.',
  },
  {
    category: 'Account & Privacy',
    question: 'Can I delete my account and data?',
    answer: 'Yes, you can request deletion of your account and associated data at any time. Contact us at privacy@verscienta.health or use the account deletion option in your profile settings.',
  },
  {
    category: 'Account & Privacy',
    question: 'Is my health information secure?',
    answer: 'We implement industry-standard security measures to protect your data, including encryption and secure data storage. We do not share your personal health information with third parties without your explicit consent.',
  },
];

const categories = ['All', ...Array.from(new Set(faqs.map(faq => faq.category)))];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageWrapper>
    <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 border-b border-sage-200/50">
      <LeafPattern opacity={0.04} />
      <div className="absolute top-20 right-20 w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-earth-300/15 rounded-full blur-3xl" />
      <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-earth-200/50 mb-6">
          <svg className="w-4 h-4 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-600 font-medium text-sm">Help Center</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions about Verscienta Health, our services, and holistic health information.
        </p>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-4 pl-12 border border-earth-200 rounded-xl focus:ring-2 focus:ring-earth-500 focus:border-earth-500 transition"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeCategory === category
                ? 'bg-earth-600 text-white'
                : 'bg-earth-100 text-gray-700 hover:bg-earth-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-earth-50/50 rounded-xl">
            <p className="text-gray-600">No questions found matching your search.</p>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => {
            const originalIndex = faqs.indexOf(faq);
            const isOpen = openItems.has(originalIndex);

            return (
              <div
                key={originalIndex}
                className="bg-white rounded-xl shadow-sm border border-earth-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(originalIndex)}
                  className="w-full px-6 py-5 text-left flex items-start justify-between gap-4 hover:bg-gray-50 transition"
                >
                  <div>
                    <span className="text-xs font-medium text-sage-600 bg-sage-100 px-2 py-1 rounded mb-2 inline-block">
                      {faq.category}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {faq.question}
                    </h3>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 mt-1 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Contact CTA */}
      <div className="mt-12 bg-gradient-to-r from-earth-600 to-sage-600 text-white p-8 rounded-2xl text-center">
        <h2 className="text-2xl font-bold mb-4">
          Still have questions?
        </h2>
        <p className="mb-6 opacity-90">
          Can't find what you're looking for? We're here to help.
        </p>
        <Link
          href="/contact"
          className="inline-block bg-white text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-earth-50 transition shadow-lg"
        >
          Contact Us
        </Link>
      </div>

      <div className="mt-8">
        <BackLink href="/" label="Return to Home" />
      </div>
    </div>
    </PageWrapper>
  );
}
