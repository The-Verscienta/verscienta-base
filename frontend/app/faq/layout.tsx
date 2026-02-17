import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - Verscienta Health',
  description:
    'Frequently asked questions about Verscienta Health, holistic health information, herbs, modalities, and practitioner services.',
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
