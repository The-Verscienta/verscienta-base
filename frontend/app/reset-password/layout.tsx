import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password - Verscienta Health',
  description:
    'Set a new password for your Verscienta Health account using the reset link sent to your email.',
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
