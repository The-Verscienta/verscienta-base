import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile - Verscienta Health',
  description:
    'Manage your Verscienta Health account, personal information, and password.',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
