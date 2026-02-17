import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In - Verscienta Health',
  description:
    'Sign in to your Verscienta Health account to access personalized wellness content and practitioner resources.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
