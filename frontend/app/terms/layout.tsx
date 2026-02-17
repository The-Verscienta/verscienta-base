import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Verscienta Health',
  description: 'Terms of Service for Verscienta Health - Read our terms and conditions for using our platform.',
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
