import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account - Verscienta Health',
  description:
    'Join Verscienta Health to explore our herb database, healing modalities, and find practitioners near you.',
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
