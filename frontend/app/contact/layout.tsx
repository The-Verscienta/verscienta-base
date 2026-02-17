import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - Verscienta Health',
  description:
    'Get in touch with the Verscienta Health team. We welcome questions, feedback, and partnership inquiries.',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
