import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password - Verscienta Health',
  description:
    'Reset your Verscienta Health account password. Enter your email to receive a reset link.',
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
