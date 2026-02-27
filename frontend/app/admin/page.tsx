'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageWrapper, Section } from '@/components/ui/DesignSystem';

interface ContentStats {
  herbs: number;
  formulas: number;
  conditions: number;
  modalities: number;
  practitioners: number;
  reviews: number;
  tcm_ingredients: number;
  tcm_interactions: number;
  tcm_evidence: number;
  import_logs: number;
}

function StatCard({ label, count, href, icon }: { label: string; count: number; href: string; icon: string }) {
  return (
    <Link
      href={href}
      className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-700 rounded-xl p-6 hover:shadow-lg hover:border-sage-300 dark:hover:border-sage-700 hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        <span className="text-3xl font-bold text-gray-800 dark:text-earth-100">{count}</span>
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-earth-300">{label}</p>
    </Link>
  );
}

function QuickAction({ label, href, description }: { label: string; href: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-700 rounded-xl hover:bg-earth-50 dark:hover:bg-earth-800 hover:border-sage-300 dark:hover:border-sage-700 transition-all"
    >
      <div className="flex-1">
        <p className="font-semibold text-gray-800 dark:text-earth-100">{label}</p>
        <p className="text-sm text-earth-500 dark:text-earth-400">{description}</p>
      </div>
      <svg className="w-5 h-5 text-earth-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<ContentStats>({
    herbs: 0, formulas: 0, conditions: 0, modalities: 0, practitioners: 0, reviews: 0,
    tcm_ingredients: 0, tcm_interactions: 0, tcm_evidence: 0, import_logs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || '';
      const types = [
        'herb', 'formula', 'condition', 'modality', 'practitioner', 'review',
        'tcm_ingredient', 'tcm_target_interaction', 'tcm_clinical_evidence', 'import_log',
      ] as const;
      const counts: Record<string, number> = {};

      await Promise.all(
        types.map(async (type) => {
          try {
            const res = await fetch(`${baseUrl}/jsonapi/node/${type}?page[limit]=1`, {
              headers: { Accept: 'application/vnd.api+json' },
            });
            if (res.ok) {
              const data = await res.json();
              counts[type] = data.meta?.count ?? data.data?.length ?? 0;
            } else {
              counts[type] = 0;
            }
          } catch {
            counts[type] = 0;
          }
        })
      );

      setStats({
        herbs: counts.herb || 0,
        formulas: counts.formula || 0,
        conditions: counts.condition || 0,
        modalities: counts.modality || 0,
        practitioners: counts.practitioner || 0,
        reviews: counts.review || 0,
        tcm_ingredients: counts.tcm_ingredient || 0,
        tcm_interactions: counts.tcm_target_interaction || 0,
        tcm_evidence: counts.tcm_clinical_evidence || 0,
        import_logs: counts.import_log || 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const drupalAdminUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || 'https://backend.ddev.site';

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-earth-300">Content overview and quick actions for Verscienta Health.</p>
      </div>

      <Section title="Content Overview">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-earth-100 dark:bg-earth-800 rounded-xl p-6 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Herbs" count={stats.herbs} href="/herbs" icon="🌿" />
            <StatCard label="Formulas" count={stats.formulas} href="/formulas" icon="⚗️" />
            <StatCard label="Conditions" count={stats.conditions} href="/conditions" icon="🩺" />
            <StatCard label="Modalities" count={stats.modalities} href="/modalities" icon="☯️" />
            <StatCard label="Practitioners" count={stats.practitioners} href="/practitioners" icon="👨‍⚕️" />
            <StatCard label="Reviews" count={stats.reviews} href="#" icon="⭐" />
          </div>
        )}
      </Section>

      <Section title="TCM Data Pipeline">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-earth-100 dark:bg-earth-800 rounded-xl p-6 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="TCM Ingredients" count={stats.tcm_ingredients} href="#" icon="🧪" />
            <StatCard label="Target Interactions" count={stats.tcm_interactions} href="#" icon="🎯" />
            <StatCard label="Clinical Evidence" count={stats.tcm_evidence} href="#" icon="📋" />
            <StatCard label="Import Logs" count={stats.import_logs} href="#" icon="📊" />
          </div>
        )}
      </Section>

      <Section title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickAction
            label="Drupal Admin Panel"
            href={`${drupalAdminUrl}/admin`}
            description="Access the full Drupal backend administration"
          />
          <QuickAction
            label="Content Management"
            href={`${drupalAdminUrl}/admin/content`}
            description="Manage all content nodes"
          />
          <QuickAction
            label="User Management"
            href={`${drupalAdminUrl}/admin/people`}
            description="Manage users and roles"
          />
          <QuickAction
            label="Taxonomy Management"
            href={`${drupalAdminUrl}/admin/structure/taxonomy`}
            description="Manage vocabulary terms and categories"
          />
          <QuickAction
            label="Knowledge Graph"
            href="/admin/knowledge-graph"
            description="Explore herb-ingredient-target-condition relationships"
          />
          <QuickAction
            label="Search Index"
            href="/search"
            description="View the search interface and test queries"
          />
          <QuickAction
            label="Symptom Checker"
            href="/symptom-checker"
            description="Test the AI symptom analysis feature"
          />
        </div>
      </Section>

      <Section title="System Info">
        <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-700 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-earth-500 dark:text-earth-400">Backend URL:</span>
              <span className="ml-2 font-mono text-gray-800 dark:text-earth-200">{drupalAdminUrl}</span>
            </div>
            <div>
              <span className="text-earth-500 dark:text-earth-400">Frontend:</span>
              <span className="ml-2 font-mono text-gray-800 dark:text-earth-200">Next.js 15 + React 19</span>
            </div>
            <div>
              <span className="text-earth-500 dark:text-earth-400">Backend:</span>
              <span className="ml-2 font-mono text-gray-800 dark:text-earth-200">Drupal 11 + JSON:API</span>
            </div>
            <div>
              <span className="text-earth-500 dark:text-earth-400">Search:</span>
              <span className="ml-2 font-mono text-gray-800 dark:text-earth-200">Algolia</span>
            </div>
          </div>
        </div>
      </Section>
    </PageWrapper>
  );
}
