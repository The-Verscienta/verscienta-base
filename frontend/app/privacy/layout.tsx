import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Verscienta Health',
  description: 'Privacy Policy for Verscienta Health - Learn how we collect, use, and protect your data.',
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
