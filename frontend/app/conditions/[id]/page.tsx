import { drupal } from '@/lib/drupal';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ConditionEntity, ModalityEntity, FormulaEntity } from '@/types/drupal';

// ISR: revalidate every 5 minutes
export const revalidate = 300;
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { getTextValue, hasTextContent } from '@/lib/drupal-helpers';
import {
  PageWrapper,
  LeafPattern,
  Section,
  BotanicalDivider,
  Tag,
  DisclaimerBox,
  BackLink,
} from '@/components/ui/DesignSystem';
import {
  selfTreatableMap,
  holisticResponseTimeMap,
  getFieldConfig,
} from '@/lib/decision-field-maps';

interface ConditionDetailProps {
  params: Promise<{
    id: string;
  }>;
}

async function getCondition(id: string) {
  try {
    const condition = await drupal.getResource<ConditionEntity>('node--condition', id, {
      params: {
        include: 'field_related_patterns',
        'fields[node--tcm_pattern]': 'id,title,field_pattern_name_chinese,field_pattern_name_pinyin',
      },
    });
    return condition;
  } catch (error) {
    console.error('Failed to fetch condition:', error);
    return null;
  }
}

async function getRelatedFormulas(conditionId: string): Promise<FormulaEntity[]> {
  // Formula content type may not exist yet - wrapped in Promise to ensure errors are caught
  return Promise.resolve()
    .then(async () => {
      const formulas = await drupal.getResourceCollection<FormulaEntity[]>('node--formula', {
        params: {
          'filter[status]': 1,
        },
      });

      if (!formulas || !Array.isArray(formulas)) {
        return [];
      }

      return formulas.filter((formula: FormulaEntity) =>
        formula.field_conditions?.some(condition => condition.id === conditionId)
      );
    })
    .catch(() => {
      // Silently return empty array if content type doesn't exist or any error
      return [];
    });
}

export async function generateMetadata({ params }: ConditionDetailProps): Promise<Metadata> {
  const { id } = await params;
  const condition = await getCondition(id);

  if (!condition) {
    return { title: 'Condition Not Found - Verscienta Health' };
  }

  const name = condition.title || 'Condition';
  const description = condition.body?.processed?.replace(/<[^>]*>/g, '').slice(0, 160)
    || `Learn about ${name} — symptoms, holistic approaches, and natural remedies.`;

  return {
    title: `${name} - Health Condition - Verscienta Health`,
    description,
  };
}

export default async function ConditionDetailPage({ params }: ConditionDetailProps) {
  const { id } = await params;
  const condition = await getCondition(id);

  if (!condition) {
    notFound();
  }

  const relatedFormulas = await getRelatedFormulas(id);
  const name = condition.title || 'Condition';

  const severityVariant = condition.field_severity === 'mild' ? 'sage' : condition.field_severity === 'moderate' ? 'gold' : 'warm';

  return (
    <PageWrapper>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 dark:from-earth-950 dark:via-sage-950 dark:to-earth-900 border-b border-sage-200/50 dark:border-earth-700/50">
        <LeafPattern opacity={0.04} />
        <div className="absolute top-20 left-10 w-64 h-64 bg-sage-300/20 dark:bg-sage-800/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-earth-300/15 dark:bg-earth-800/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Conditions', href: '/conditions' },
              { label: name },
            ]}
            className="mb-8"
          />

          <div className="bg-white dark:bg-earth-900 rounded-3xl shadow-xl border border-earth-200 dark:border-earth-700 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-64 h-64 opacity-5 pointer-events-none">
              <div className="text-8xl">🏥</div>
            </div>
            <div className="relative p-8 md:p-12">
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-gray-900 dark:text-earth-100 mb-4 tracking-tight">
                {name}
              </h1>

              {(condition.field_severity || condition.field_editors_pick || condition.field_self_treatable || condition.field_holistic_response_time) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {condition.field_severity && (
                    <Tag variant={severityVariant} size="md">
                      Severity: {condition.field_severity.charAt(0).toUpperCase() + condition.field_severity.slice(1)}
                    </Tag>
                  )}
                  {condition.field_editors_pick && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700/50">
                      &#9733; Editor&apos;s Pick
                    </span>
                  )}
                  {condition.field_self_treatable && (() => { const c = getFieldConfig(selfTreatableMap, condition.field_self_treatable); return c ? (
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                  ) : null; })()}
                  {condition.field_holistic_response_time && (() => { const c = getFieldConfig(holisticResponseTimeMap, condition.field_holistic_response_time); return c ? (
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>Response: {c.label}</span>
                  ) : null; })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {condition.body?.value && (
          <Section
            id="overview"
            variant="default"
            title="Overview"
            icon={
              <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            <div className="prose max-w-none text-gray-700 dark:text-earth-300">
              <SafeHtml html={condition.body.value} />
            </div>
          </Section>
        )}

        {condition.field_symptoms && condition.field_symptoms.length > 0 && (
          <Section
            id="symptoms"
            variant="default"
            title="Common Symptoms"
            icon={
              <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          >
            <ul className="grid md:grid-cols-2 gap-2">
              {condition.field_symptoms.map((symptom, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-sage-600 dark:text-sage-400 mt-1">•</span>
                  <span className="text-gray-700 dark:text-earth-300">{symptom}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {condition.field_related_patterns && condition.field_related_patterns.length > 0 && (
          <>
            <BotanicalDivider />
            <Section
              id="tcm-patterns"
              variant="tcm"
              title="Common TCM Patterns"
              icon={
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              }
            >
              <p className="text-sm text-gray-600 dark:text-earth-400 mb-4">
                In Traditional Chinese Medicine, {name} is often associated with these underlying patterns:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {condition.field_related_patterns.map(pattern => (
                  <Link
                    key={pattern.id}
                    href={`/patterns/${pattern.id}`}
                    className="block border border-amber-200 dark:border-amber-800/50 rounded-xl p-4
                      hover:shadow-lg hover:border-amber-400 dark:hover:border-amber-600 transition
                      bg-amber-50/50 dark:bg-amber-950/20"
                  >
                    <h3 className="font-bold text-gray-800 dark:text-earth-100 text-base mb-1">
                      {pattern.title}
                    </h3>
                    {(pattern.field_pattern_name_chinese || pattern.field_pattern_name_pinyin) && (
                      <p className="text-sm text-amber-700 dark:text-amber-400 font-serif mb-2">
                        {pattern.field_pattern_name_chinese}
                        {pattern.field_pattern_name_chinese && pattern.field_pattern_name_pinyin && ' · '}
                        {pattern.field_pattern_name_pinyin && <span className="italic">{pattern.field_pattern_name_pinyin}</span>}
                      </p>
                    )}
                    <div className="text-amber-600 dark:text-amber-500 text-sm font-medium">
                      Explore Pattern →
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          </>
        )}

        {condition.field_modalities && condition.field_modalities.length > 0 && (
          <>
            <BotanicalDivider />
            <Section
              id="modalities"
              variant="default"
              title="Recommended Holistic Modalities"
              icon={
                <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            }
            >
              <p className="text-gray-600 dark:text-earth-400 mb-4">
                These holistic health modalities may be beneficial for managing {name}:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {condition.field_modalities.map((modality: any) => (
                  <Link
                    key={modality.id}
                    href={`/modalities/${modality.id}`}
                    className="block border border-earth-200 dark:border-earth-700 rounded-xl p-4 hover:shadow-lg hover:border-sage-400 dark:hover:border-sage-600 transition dark:bg-earth-800/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-earth-100 text-lg mb-1">
                          {modality.title || 'Modality'}
                        </h3>
                        {modality.field_excels_at && modality.field_excels_at.length > 0 && (
                          <p className="text-sm text-gray-600 dark:text-earth-400">
                            Excels at: {modality.field_excels_at.slice(0, 2).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="text-sage-600 dark:text-sage-400 text-sm font-medium">
                        Learn More →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          </>
        )}

        {relatedFormulas.length > 0 && (
          <>
            <BotanicalDivider />
            <Section
              id="formulas"
              variant="default"
              title={`Herbal Formulas for ${name}`}
              icon={
                <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            }
            >
              <p className="text-gray-600 dark:text-earth-400 mb-4">
                Traditional herbal formulas that may help with this condition:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {relatedFormulas.map((formula) => (
                  <Link
                    key={formula.id}
                    href={`/formulas/${formula.id}`}
                    className="block border border-earth-200 dark:border-earth-700 rounded-xl p-4 hover:shadow-lg hover:border-sage-400 dark:hover:border-sage-600 transition dark:bg-earth-800/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-800 dark:text-earth-100 text-lg">
                        {formula.title}
                      </h3>
                      <Tag variant="sage" size="sm">
                        {formula.field_herb_ingredients?.length || 0} herbs
                      </Tag>
                    </div>
                    {hasTextContent(formula.field_formula_description) && (
                      <p className="text-sm text-gray-600 dark:text-earth-400 mb-3 line-clamp-2">
                        {getTextValue(formula.field_formula_description)}
                      </p>
                    )}
                    <div className="text-sage-600 dark:text-sage-400 text-sm font-medium">
                      View Formula →
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          </>
        )}

        <BotanicalDivider />
        <Section
          id="approach"
          variant="feature"
          title="Holistic Management Approach"
          icon={
            <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <div className="space-y-4 text-gray-700 dark:text-earth-300">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-earth-200 mb-2 flex items-center gap-2">
                <span>🧘</span>
                Mind-Body Practices
              </h3>
              <p className="text-sm">
                Consider incorporating stress reduction techniques, meditation, and gentle movement
                practices to support overall well-being.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-earth-200 mb-2 flex items-center gap-2">
                <span>🥗</span>
                Dietary Considerations
              </h3>
              <p className="text-sm">
                A whole-foods, nutrient-dense diet can support the body's natural healing processes.
                Consider consulting with a nutritionist for personalized guidance.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-earth-200 mb-2 flex items-center gap-2">
                <span>💚</span>
                Lifestyle Modifications
              </h3>
              <p className="text-sm">
                Adequate sleep, regular physical activity, and stress management are foundational
                to managing most health conditions holistically.
              </p>
            </div>
            {condition.field_complementary_approaches && (typeof condition.field_complementary_approaches === 'string' ? condition.field_complementary_approaches : condition.field_complementary_approaches?.value) && (
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-earth-200 mb-2 flex items-center gap-2">
                  <span>🌱</span>
                  Complementary Approaches
                </h3>
                <div className="prose prose-sm max-w-none text-earth-700 dark:text-earth-400">
                  <SafeHtml html={typeof condition.field_complementary_approaches === 'string' ? condition.field_complementary_approaches : (condition.field_complementary_approaches?.value || '')} />
                </div>
              </div>
            )}
          </div>
        </Section>

        <DisclaimerBox />

        <div className="bg-gradient-to-r from-earth-700 via-sage-700 to-earth-800 text-white p-8 rounded-2xl shadow-xl text-center">
          <h2 className="text-2xl font-serif font-bold mb-4">
            Need Professional Guidance?
          </h2>
          <p className="mb-6 opacity-90 max-w-2xl mx-auto">
            Connect with qualified holistic health practitioners who can provide personalized care.
          </p>
          <Link
            href="/practitioners"
            className="inline-block bg-white text-gray-800 dark:text-gray-900 px-8 py-3 rounded-xl font-semibold hover:bg-earth-50 transition shadow-lg"
          >
            Find a Practitioner
          </Link>
        </div>

        <BackLink href="/conditions" label="Back to All Conditions" />
      </div>
    </PageWrapper>
  );
}
