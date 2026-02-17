import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search - Verscienta Health',
  description:
    'Search our database of medicinal herbs, healing modalities, health conditions, practitioners, and traditional formulas.',
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
