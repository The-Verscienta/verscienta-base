/**
 * TypeScript interfaces for Drupal entities
 */

export interface DrupalNode {
  id: string;
  type: string;
  langcode: string;
  status: boolean;
  title: string;
  created: string;
  changed: string;
  path: {
    alias: string;
    langcode: string;
  };
  body?: {
    value: string;
    format: string;
    processed: string;
  };
}

// Drupal formatted text field (rich text from CKEditor)
export interface DrupalFormattedText {
  value: string;
  format?: string | null;
  processed?: string;
}

// Comprehensive Herb Entity
export interface HerbEntity extends DrupalNode {
  type: 'node--herb';

  // Unique identifier
  field_herb_id?: string;

  // TCM Database Fields (HERB 2.0)
  field_herb2_id?: number;
  field_pubchem_cid?: number;
  field_smiles?: string;
  field_molecular_weight?: number;
  field_herb_source_dbs?: string[];
  field_herb_latin_name?: string;
  field_herb_pinyin_name?: string;
  field_herb_chinese_name?: string;

  // Botanical Information
  field_scientific_name?: string;
  field_common_names?: Array<{
    field_name_text: string;
    field_language: string;
    field_region?: string;
  }>;
  field_family?: string;
  field_genus?: string;
  field_species?: string;
  field_synonyms?: string[];
  field_plant_type?: string;
  field_native_region?: string[];
  field_habitat?: string;
  field_parts_used?: string[];
  field_botanical_description?: string;
  field_conservation_status?: string;
  field_conservation_notes?: string;

  // TCM Properties
  field_tcm_properties?: {
    field_tcm_taste?: string[];
    field_tcm_temperature?: string;
    field_tcm_meridians?: string[];
    field_tcm_functions?: string;
    field_tcm_category?: string;
  };

  // Medicinal Information
  field_therapeutic_uses?: DrupalFormattedText;
  field_western_properties?: string[];
  field_active_constituents?: Array<{
    field_compound_name: string;
    field_compound_class?: string;
    field_compound_percentage?: number;
    field_compound_effects?: string;
  }>;
  field_pharmacological_effects?: DrupalFormattedText;
  field_dosage_forms?: string[];
  field_recommended_dosage?: Array<{
    field_dosage_form: string;
    field_dosage_amount: string;
    field_dosage_frequency?: string;
    field_dosage_population?: string;
    field_dosage_notes?: string;
  }>;
  field_contraindications?: DrupalFormattedText;
  field_drug_interactions?: Array<{
    field_drug_name: string;
    field_interaction_type: string;
    field_interaction_description: string;
  }>;
  field_side_effects?: DrupalFormattedText;
  field_toxicity_info?: {
    field_toxicity_level?: string;
    field_toxic_compounds?: string;
    field_toxic_symptoms?: string;
  };

  // Cultural & Historical
  field_traditional_american_uses?: DrupalFormattedText;
  field_traditional_chinese_uses?: DrupalFormattedText;
  field_native_american_uses?: DrupalFormattedText;
  field_cultural_significance?: DrupalFormattedText;
  field_ethnobotanical_notes?: DrupalFormattedText;
  field_folklore?: DrupalFormattedText;

  // Practical Information
  field_preparation_methods?: Array<{
    field_method_type: string;
    field_method_instructions: string;
    field_method_time?: string;
  }>;
  field_storage_requirements?: {
    field_storage_conditions?: string;
    field_shelf_life?: string;
    field_storage_temperature?: string;
  };
  field_sourcing_info?: {
    field_sourcing_type?: string;
    field_organic_available?: boolean;
    field_sustainable_harvest?: string;
  };
  field_commercial_availability?: string[];
  field_regulatory_status?: Array<{
    field_reg_country: string;
    field_reg_status: string;
    field_reg_notes?: string;
  }>;

  // Safety & Quality
  field_quality_standards?: Array<{
    field_standard_org: string;
    field_standard_specs: string;
  }>;
  field_adulteration_risks?: Array<{
    field_adulterant_name: string;
    field_risks: string;
  }>;
  field_safety_warnings?: Array<{
    field_warning_type: string;
    field_warning_severity: string;
    field_warning_description: string;
  }>;
  field_allergenic_potential?: string;

  // Tongue & Pulse Diagnosis
  field_tongue_indication?: string;
  field_pulse_indication?: string;

  // Cross-references
  field_related_species?: Array<{
    id: string;
    type: string;
    title?: string;
  }>;
  field_substitute_herbs?: Array<{
    id: string;
    type: string;
    title?: string;
  }>;
  field_conditions_treated?: Array<{
    id: string;
    type: string;
    title?: string;
  }>;

  // Images (Cloudflare Images via JSON:API file entities)
  field_images?: Array<{
    id: string;
    type: string;
    uri?: { url: string; value?: string };
    url?: string;
    filename?: string;
    meta?: { alt?: string; title?: string; width?: number; height?: number };
  }>;

  // Metadata
  field_peer_review_status?: string;
  field_average_rating?: number;
  field_review_count?: number;

  // Decision-Making Fields
  field_popularity?: 'staple' | 'common' | 'specialty' | 'rare' | 'obscure';
  field_beginner_friendly?: boolean;
  field_onset_speed?: 'fast_acting' | 'moderate' | 'cumulative';
  field_cost_tier?: 'budget' | 'moderate' | 'premium' | 'expensive';
  field_palatability?: 'pleasant' | 'neutral' | 'bitter' | 'very_bitter' | 'pungent';
  field_pregnancy_safety?: 'generally_safe' | 'use_caution' | 'avoid' | 'contraindicated';
  field_availability?: 'widely_available' | 'specialty_stores' | 'online_only' | 'hard_to_source' | 'practitioner_only';
  field_best_season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'year_round';
  field_evidence_strength?: 'strong' | 'moderate' | 'preliminary' | 'traditional_only';
  field_editors_pick?: boolean;

  // Herb Pairings
  field_herb_pairings?: HerbPairing[];
}

export interface ModalityEntity extends DrupalNode {
  type: 'node--modality';
  field_excels_at: string[];
  field_benefits: Record<string, any>;
  field_conditions?: {
    id: string;
    type: string;
  }[];

  // Decision-Making Fields
  field_session_cost_range?: string;
  field_self_practice?: boolean;
  field_sessions_needed?: string;
  field_pairs_well_with?: Array<{
    id: string;
    type: string;
    title?: string;
  }>;
  field_editors_pick?: boolean;
}

export interface ConditionEntity extends DrupalNode {
  type: 'node--condition';
  field_symptoms?: string[];
  field_severity?: string;
  field_modalities?: Array<{
    id: string;
    type: string;
    title?: string;
    body?: {
      value: string;
      format: string;
      processed: string;
    };
  }>;
  field_related_herbs?: Array<{
    id: string;
    type: string;
    title?: string;
  }>;

  // TCM Patterns linked to this condition
  field_related_patterns?: Array<{
    id: string;
    type: string;
    title?: string;
    field_pattern_name_chinese?: string;
    field_pattern_name_pinyin?: string;
  }>;

  // Decision-Making Fields
  field_self_treatable?: 'yes' | 'with_guidance' | 'professional_recommended' | 'professional_required';
  field_holistic_response_time?: 'days' | 'weeks' | 'months' | 'varies_widely';
  field_complementary_approaches?: DrupalFormattedText;
  field_quick_summary?: string;
  field_editors_pick?: boolean;
}

export interface PractitionerEntity extends DrupalNode {
  type: 'node--practitioner';
  field_name?: string;
  field_images?: Array<{
    id: string;
    type: string;
    uri?: { url: string; value?: string };
    url?: string;
    filename?: string;
    meta?: { alt?: string; title?: string; width?: number; height?: number };
  }>;
  field_practice_type?: 'solo' | 'group' | 'clinic' | 'hospital';
  field_address?: string;
  field_city?: string;
  field_state?: string;
  field_zip?: string;
  field_zip_code?: string;
  field_phone?: string;
  field_email?: string;
  field_website?: string;
  field_latitude?: number;
  field_longitude?: number;
  field_credentials?: string;
  field_bio?: string;
  field_years_experience?: number;
  field_accepting_patients?: boolean;
  field_accepting_new_patients?: boolean;
  field_modalities?: Array<{
    id: string;
    type: string;
    title?: string;
  }>;
  field_clinic?: {
    id: string;
    type: string;
    title?: string;
  };
}

export interface ClinicEntity extends DrupalNode {
  type: 'node--clinic';
  field_images?: Array<{
    id: string;
    type: string;
    uri?: { url: string; value?: string };
    url?: string;
    filename?: string;
    meta?: { alt?: string; title?: string; width?: number; height?: number };
  }>;
  field_address?: string;
  field_city?: string;
  field_state?: string;
  field_zip?: string;
  field_latitude?: number;
  field_longitude?: number;
  field_phone?: string;
  field_email?: string;
  field_website?: string;
  field_google_place_id?: string;
  field_hours?: string;
  field_practitioners?: Array<{
    id: string;
    type: string;
    title?: string;
    field_name?: string;
    field_credentials?: string;
    field_images?: Array<{
      id: string;
      type: string;
      uri?: { url: string; value?: string };
      url?: string;
      filename?: string;
      meta?: { alt?: string; title?: string; width?: number; height?: number };
    }>;
  }>;
  field_modalities?: Array<{
    id: string;
    type: string;
    title?: string;
  }>;
  field_accepting_new_patients?: boolean;
  field_insurance_accepted?: string[];
}

export interface SymptomEntity extends DrupalNode {
  type: 'node--symptom';
  field_category?: string;
  field_related_conditions?: {
    id: string;
    type: string;
  }[];
}

export interface ReviewEntity extends DrupalNode {
  type: 'node--review';
  field_rating?: number;
  field_comment?: string;
  field_reviewed_entity?: {
    id: string;
    type: string;
  };
}

export interface GrokInsightEntity extends DrupalNode {
  type: 'node--grok_insight';
  field_analysis: {
    symptoms?: string[];
    recommendations?: Array<{
      modality: string;
      confidence: number;
      reasoning: string;
    }>;
    follow_up_questions?: string[];
  };
}

export type HerbRole = 'chief' | 'deputy' | 'assistant' | 'envoy';

export interface HerbIngredient {
  id: string;
  type: string;
  title: string;
  field_herb_pinyin_name?: string;
  field_herb_chinese_name?: string;
  field_quantity: number;
  field_unit: string;
  field_percentage?: number;
  field_role?: HerbRole;
  field_function?: DrupalTextField;  // What this herb does in the formula
  field_notes?: DrupalTextField;     // Additional notes about this ingredient
}

// Drupal text field types
export type DrupalTextField = string | {
  value: string;
  format: string | null;
  processed?: string;
} | null | undefined;

export interface FormulaEntity extends DrupalNode {
  type: 'node--formula';
  field_formula_description?: DrupalTextField;
  field_preparation_instructions?: DrupalTextField;
  field_dosage?: DrupalTextField;
  field_total_weight?: number;
  field_total_weight_unit?: string;
  field_use_cases?: string[];
  field_herb_ingredients?: HerbIngredient[];
  field_conditions?: {
    id: string;
    type: string;
    title?: string;
  }[];

  // Decision-Making Fields
  field_formula_popularity?: 'classic_staple' | 'commonly_prescribed' | 'specialty' | 'historical_rare';
  field_preparation_difficulty?: 'easy' | 'moderate' | 'advanced' | 'practitioner_only';
  field_available_premade?: boolean;
  field_commercial_forms?: string;
  field_treatment_duration?: 'acute_short' | 'weeks' | 'months' | 'seasonal' | 'constitutional_long';
  field_formula_era?: string;
  field_formula_category?: 'tonifying' | 'clearing_heat' | 'releasing_exterior' | 'regulating_qi' | 'blood_invigorating' | 'phlegm_resolving' | 'digestive' | 'calming' | 'warming_interior' | 'other';
  field_editors_pick?: boolean;
  field_evidence_strength?: 'strong' | 'moderate' | 'preliminary' | 'traditional_only';
  field_parent_formula?: {
    id: string;
    type: string;
    title?: string;
  };
  field_modification_notes?: DrupalTextField;

  // Formula identity
  field_formula_chinese_name?: string;
  field_classic_source?: string;
  field_source_dynasty?: string;
  field_source_author?: string;
  field_source_year?: string;

  // Biomedical cross-references
  field_biomedical_conditions?: string[];

  // Actions & Indications (clinical)
  field_actions?: DrupalTextField;
  field_indications?: DrupalTextField;
  field_contraindications?: DrupalTextField;

  // Formula Modifications (加减)
  field_jia_jian?: FormulaModification[];
}

// TCM Database Entities

export interface TcmIngredientEntity extends DrupalNode {
  type: 'node--tcm_ingredient';
  field_ingredient_id?: number;
  field_pubchem_cid?: number;
  field_cas_number?: string;
  field_smiles?: string;
  field_molecular_weight?: number;
  field_herb_sources?: Array<{
    id: string;
    type: string;
    title?: string;
  }>;
  field_source_db?: string;
}

export interface TcmTargetInteractionEntity extends DrupalNode {
  type: 'node--tcm_target_interaction';
  field_ingredient_ref?: {
    id: string;
    type: string;
    title?: string;
  };
  field_herb_ref?: {
    id: string;
    type: string;
    title?: string;
  };
  field_target_name?: string;
  field_uniprot_id?: string;
  field_gene_name?: string;
  field_score?: number;
  field_evidence_type?: string[];
  field_source_db?: string;
}

export interface TcmClinicalEvidenceEntity extends DrupalNode {
  type: 'node--tcm_clinical_evidence';
  field_evidence_id?: string;
  field_herb_refs?: Array<{
    id: string;
    type: string;
    title?: string;
  }>;
  field_formula_ref?: {
    id: string;
    type: string;
    title?: string;
  };
  field_study_type?: string[];
  field_summary?: DrupalFormattedText;
  field_outcome?: DrupalFormattedText;
  field_source_url?: {
    uri: string;
    title?: string;
  };
  field_source_db?: string;
}

export interface ImportLogEntity extends DrupalNode {
  type: 'node--import_log';
  field_source_db?: string;
  field_records_processed?: number;
  field_records_created?: number;
  field_records_updated?: number;
  field_records_skipped?: number;
  field_errors?: DrupalFormattedText;
  field_duration_seconds?: number;
}

export type ContributionType = 'clinical_note' | 'modification' | 'addition';
export type ContributionStatus = 'pending' | 'approved' | 'rejected';
export type ModificationAction = 'add' | 'remove' | 'modify';

export interface HerbModification {
  herb_id: string;
  herb_title: string;
  action: ModificationAction;
  quantity?: number;
  unit?: string;
  role?: HerbRole;
  function?: string;
  rationale: string;  // Why this modification
}

export interface FormulaContribution extends DrupalNode {
  type: 'node--formula_contribution';
  field_contribution_type: ContributionType;
  field_formula_reference: { id: string; type: string };
  field_status: ContributionStatus;
  field_clinical_note?: string;
  field_context?: string;  // Context/indication for modifications
  field_modifications?: HerbModification[];
  uid: { id: string; name: string };
}

export function isFormulaContribution(entity: DrupalNode): entity is FormulaContribution {
  return entity.type === 'node--formula_contribution';
}

// ─── Acupuncture Point ────────────────────────────────────────────────────────

export type PointSpecialProperty =
  | 'yuan_source'
  | 'luo_connecting'
  | 'xi_cleft'
  | 'command_point'
  | 'influential_point'
  | 'five_element_wood'
  | 'five_element_fire'
  | 'five_element_earth'
  | 'five_element_metal'
  | 'five_element_water'
  | 'confluent_point'
  | 'alarm_mu'
  | 'back_shu'
  | 'window_of_sky'
  | 'sea_of_blood'
  | 'lower_sea';

export type NeedlingAngle = 'perpendicular' | 'oblique' | 'transverse';

export interface AcupointEntity extends DrupalNode {
  type: 'node--acupuncture_point';

  // Identity
  field_point_code?: string;            // e.g. "ST 36"
  field_point_chinese_name?: string;    // e.g. "足三里"
  field_point_pinyin_name?: string;     // e.g. "Zu San Li"

  // Location
  field_location_description?: string;  // Prose anatomical location
  field_location_anatomical?: string;   // Anatomical landmark

  // Needling technique
  field_needling_depth?: string;        // e.g. "1–2 cun"
  field_needling_angle?: NeedlingAngle;
  field_needling_method?: string;
  field_moxa_suitable?: boolean;
  field_moxa_cones?: number;
  field_press_needle_suitable?: boolean;

  // Clinical content (same DrupalTextField shape as FormulaEntity)
  field_actions?: DrupalTextField;
  field_indications?: DrupalTextField;
  field_contraindications?: DrupalTextField;
  field_classical_notes?: DrupalTextField;
  field_clinical_notes?: DrupalTextField;
  field_combinations?: DrupalTextField;

  // Special point categories
  field_special_properties?: PointSpecialProperty[];
  field_five_element?: 'wood' | 'fire' | 'earth' | 'metal' | 'water';

  // Meridian taxonomy reference
  field_meridian?: {
    id: string;
    type: string;
    name?: string;
    description?: string;
  };
  field_meridian_number?: number;

  // Cross-references
  field_related_conditions?: Array<{ id: string; type: string; title?: string }>;
  field_related_herbs?: Array<{ id: string; type: string; title?: string; field_herb_pinyin_name?: string }>;
  field_related_formulas?: Array<{ id: string; type: string; title?: string }>;

  // Decision-making fields (mirrors HerbEntity)
  field_popularity?: 'staple' | 'common' | 'specialty' | 'rare';
  field_editors_pick?: boolean;
  field_beginner_friendly?: boolean;
}

export function isAcupointEntity(entity: DrupalNode): entity is AcupointEntity {
  return entity.type === 'node--acupuncture_point';
}

// Lightweight list item used on the /points listing page
export interface AcupointListItem {
  id: string;
  title: string;
  pointCode: string;
  pinyinName?: string;
  chineseName?: string;
  meridianName?: string;
  specialProperties?: PointSpecialProperty[];
  popularity?: string;
  editorsPick?: boolean;
  beginnerFriendly?: boolean;
}

export interface DrupalJsonApiResponse<T = DrupalNode> {
  data: T | T[];
  included?: DrupalNode[];
  links?: {
    self: {
      href: string;
    };
    next?: {
      href: string;
    };
    prev?: {
      href: string;
    };
  };
  meta?: {
    count: number;
  };
}

export interface DrupalMenuLink {
  id: string;
  title: string;
  url: string;
  enabled: boolean;
  weight: number;
  menu_name: string;
  parent?: string;
}

// Additional types needed for exports
export interface TaxonomyTerm {
  id: string;
  type: string;
  name: string;
  description?: string;
  weight?: number;
  parent?: {
    id: string;
    type: string;
  };
}

export interface UserEntity {
  id: string;
  uid?: string;
  name: string;
  mail?: string;
  roles?: string[];
  status?: boolean;
  created?: string;
  access?: string;
  field_first_name?: string;
  field_last_name?: string;
}

// JSON:API response types
export interface JsonApiResponse<T = DrupalNode> {
  data: T;
  included?: DrupalNode[];
  links?: {
    self: { href: string };
    next?: { href: string };
    prev?: { href: string };
  };
  meta?: Record<string, unknown>;
}

export interface JsonApiCollectionResponse<T = DrupalNode> {
  data: T[];
  included?: DrupalNode[];
  links?: {
    self: { href: string };
    next?: { href: string };
    prev?: { href: string };
  };
  meta?: {
    count?: number;
  };
}

export interface JsonApiError {
  status: string;
  title: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
}

export interface EntityCollection<T = DrupalNode> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

// Type guards
export function isHerbEntity(entity: DrupalNode): entity is HerbEntity {
  return entity.type === 'node--herb';
}

export function isModalityEntity(entity: DrupalNode): entity is ModalityEntity {
  return entity.type === 'node--modality';
}

export function isConditionEntity(entity: DrupalNode): entity is ConditionEntity {
  return entity.type === 'node--condition';
}

export function isPractitionerEntity(entity: DrupalNode): entity is PractitionerEntity {
  return entity.type === 'node--practitioner';
}

export function isClinicEntity(entity: DrupalNode): entity is ClinicEntity {
  return entity.type === 'node--clinic';
}

export function isReviewEntity(entity: DrupalNode): entity is ReviewEntity {
  return entity.type === 'node--review';
}

export function isTcmIngredientEntity(entity: DrupalNode): entity is TcmIngredientEntity {
  return entity.type === 'node--tcm_ingredient';
}

export function isTcmTargetInteractionEntity(entity: DrupalNode): entity is TcmTargetInteractionEntity {
  return entity.type === 'node--tcm_target_interaction';
}

export function isTcmClinicalEvidenceEntity(entity: DrupalNode): entity is TcmClinicalEvidenceEntity {
  return entity.type === 'node--tcm_clinical_evidence';
}

export function isImportLogEntity(entity: DrupalNode): entity is ImportLogEntity {
  return entity.type === 'node--import_log';
}

// ─── TCM Pattern / Syndrome ───────────────────────────────────────────────────

export type PatternCategory = 'deficiency' | 'excess' | 'mixed';
export type PatternTemperature = 'cold' | 'heat' | 'neutral';

export interface TcmPatternEntity extends DrupalNode {
  type: 'node--tcm_pattern';
  field_pattern_name_chinese?: string;
  field_pattern_name_pinyin?: string;
  field_organ_system?: { id: string; type: string; name?: string; description?: string };
  field_etiology?: DrupalTextField;
  field_pathomechanism?: DrupalTextField;
  field_signs_symptoms?: DrupalTextField;
  field_tongue_criteria?: DrupalTextField;
  field_pulse_criteria?: DrupalTextField;
  field_treatment_principle?: DrupalTextField;
  field_differential_diagnosis?: DrupalTextField;
  field_pattern_category?: PatternCategory;
  field_temperature?: PatternTemperature;
  field_related_formulas?: Array<{ id: string; type: string; title?: string }>;
  field_related_herbs?: Array<{ id: string; type: string; title?: string; field_herb_pinyin_name?: string }>;
  field_related_points?: Array<{ id: string; type: string; title?: string; field_point_code?: string }>;
  field_related_conditions?: Array<{ id: string; type: string; title?: string }>;
  field_popularity?: 'staple' | 'common' | 'specialty' | 'rare';
  field_editors_pick?: boolean;
}

export function isTcmPatternEntity(entity: DrupalNode): entity is TcmPatternEntity {
  return entity.type === 'node--tcm_pattern';
}

// ─── Herb Pairings ────────────────────────────────────────────────────────────

export interface HerbPairing {
  id: string;
  type: string;
  field_partner_herb?: { id: string; type: string; title?: string; field_herb_pinyin_name?: string; field_herb_chinese_name?: string };
  field_synergistic_action?: DrupalTextField;
  field_example_formula?: { id: string; type: string; title?: string };
}

// ─── Formula Modifications (加减) ─────────────────────────────────────────────

export type JiaJianAction = 'add' | 'remove' | 'increase' | 'decrease';

export interface FormulaModification {
  id: string;
  type: string;
  field_modification_condition?: string;
  field_modification_action?: JiaJianAction;
  field_modification_herb?: { id: string; type: string; title?: string; field_herb_pinyin_name?: string };
  field_modification_amount?: string;
  field_modification_note?: DrupalTextField;
}

// ─── TCM Concepts ─────────────────────────────────────────────────────────────

export interface TcmConceptEntity extends DrupalNode {
  type: 'node--tcm_concept';
  field_concept_chinese_name?: string;
  field_concept_pinyin_name?: string;
  field_concept_category?: { id: string; type: string; name?: string };
  field_clinical_relevance?: DrupalTextField;
  field_related_patterns?: Array<{ id: string; type: string; title?: string }>;
  field_related_herbs?: Array<{ id: string; type: string; title?: string; field_herb_pinyin_name?: string }>;
  field_related_formulas?: Array<{ id: string; type: string; title?: string }>;
  field_editors_pick?: boolean;
  field_popularity?: 'staple' | 'common' | 'specialty' | 'rare';
}

export function isTcmConceptEntity(entity: DrupalNode): entity is TcmConceptEntity {
  return entity.type === 'node--tcm_concept';
}

export interface TcmConceptListItem {
  id: string;
  title: string;
  chineseName?: string;
  pinyinName?: string;
  category?: string;
  popularity?: string;
  editorsPick?: boolean;
}

export interface TcmPatternListItem {
  id: string;
  title: string;
  chineseName?: string;
  pinyinName?: string;
  organSystem?: string;
  category?: PatternCategory;
  temperature?: PatternTemperature;
  popularity?: string;
  editorsPick?: boolean;
}