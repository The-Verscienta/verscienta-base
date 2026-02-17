import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Symptom Checker - Verscienta Health',
  description:
    'Describe your symptoms and get personalized holistic health recommendations powered by Grok AI. Discover herbs, modalities, and natural approaches to support your wellness.',
};

export default function SymptomCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
