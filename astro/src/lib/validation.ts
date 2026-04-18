import { z } from 'zod';

/**
 * Zod Validation Schemas
 * Centralized validation for forms and API requests
 */

// Custom sanitization transforms
const sanitizeString = (val: string) =>
  val.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

// Regex patterns for validation
const SAFE_TEXT_PATTERN = /^[^<>]*$/; // No angle brackets (basic XSS prevention)
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const SAFE_IDENTIFIER_PATTERN = /^[a-zA-Z0-9_-]+$/;

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  accountType: z.enum(['patient', 'professional']).optional().default('patient'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Grok AI Schemas
export const symptomAnalysisSchema = z.object({
  symptoms: z
    .string()
    .min(10, 'Please provide more detailed symptom description (at least 10 characters)')
    .max(2000, 'Symptom description is too long (max 2000 characters)'),
  followUpAnswers: z.record(z.string()).optional(),
  context: z.object({
    age: z.number().min(0).max(120).optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    medical_history: z.string().max(500).optional(),
    current_medications: z.string().max(500).optional(),
  }).optional(),
});

export const herbDrugCheckSchema = z.object({
  medications: z
    .string()
    .min(2, 'Please enter at least one medication name')
    .max(500, 'Too many medications listed (max 500 characters)'),
});

// Contact/Communication Schemas
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

// Review Schema
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000),
  reviewedEntityType: z.enum(['herb', 'modality', 'practitioner', 'formula']),
  reviewedEntityId: z.string().uuid('Invalid entity ID'),
});

// Search Schema
export const searchQuerySchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters').max(200),
  filters: z.object({
    type: z.enum(['herbs', 'modalities', 'conditions', 'practitioners', 'formulas', 'all']).optional(),
    severity: z.enum(['mild', 'moderate', 'severe']).optional(),
    practiceType: z.enum(['solo', 'group', 'clinic', 'hospital']).optional(),
    acceptingPatients: z.boolean().optional(),
  }).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

// Practitioner Search Schema
export const practitionerSearchSchema = z.object({
  location: z.string().max(100).optional(),
  modality: z.string().max(100).optional(),
  practiceType: z.enum(['solo', 'group', 'clinic', 'hospital']).optional(),
  acceptingNewPatients: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(1).max(500).optional(), // in miles or km
});

// Formula Schema (for creating/editing formulas)
export const formulaIngredientSchema = z.object({
  herbId: z.string().uuid('Invalid herb ID'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.enum(['g', 'mg', 'oz', 'ml', 'tsp', 'tbsp', 'drops', 'parts']),
  percentage: z.number().min(0).max(100).optional(),
  role: z.enum(['chief', 'deputy', 'assistant', 'envoy']).optional(),
});

export const formulaSchema = z.object({
  title: z.string().min(1, 'Formula name is required').max(255),
  description: z.string().max(500).optional(),
  ingredients: z.array(formulaIngredientSchema).min(1, 'At least one herb is required'),
  totalWeight: z.number().positive().optional(),
  totalWeightUnit: z.enum(['g', 'mg', 'oz', 'ml']).optional(),
  preparationInstructions: z.string().max(1000).optional(),
  dosage: z.string().max(500).optional(),
  useCases: z.array(z.string().max(100)).optional(),
  relatedConditions: z.array(z.string().uuid()).optional(),
});

// Herb Modification Schema (for user-submitted formula modifications)
export const herbModificationSchema = z.object({
  herb_id: z.string()
    .min(1, 'Herb is required')
    .max(100)
    .regex(SAFE_IDENTIFIER_PATTERN, 'Invalid herb ID format'),
  herb_title: z.string()
    .min(1, 'Herb name is required')
    .max(200)
    .transform(sanitizeString)
    .refine(val => SAFE_TEXT_PATTERN.test(val), 'Invalid characters in herb name'),
  action: z.enum(['add', 'remove', 'modify']),
  quantity: z.number().positive('Quantity must be positive').max(10000).optional(),
  unit: z.enum(['g', 'mg', 'oz', 'ml', 'tsp', 'tbsp', 'drops', 'parts']).optional(),
  role: z.enum(['chief', 'deputy', 'assistant', 'envoy']).optional(),
  function: z.string()
    .max(500)
    .transform(sanitizeString)
    .refine(val => !val || SAFE_TEXT_PATTERN.test(val), 'Invalid characters')
    .optional(),
  rationale: z.string()
    .min(10, 'Please explain why this modification is beneficial')
    .max(1000)
    .transform(sanitizeString)
    .refine(val => SAFE_TEXT_PATTERN.test(val), 'Invalid characters in rationale'),
});

// Formula Contribution Schema (for clinical notes and modifications)
export const formulaContributionSchema = z.object({
  contribution_type: z.enum(['clinical_note', 'modification', 'addition']),
  formula_id: z.string()
    .min(1, 'Formula reference is required')
    .max(100)
    .regex(/^[a-f0-9-]+$/i, 'Invalid formula ID format'), // UUID format
  clinical_note: z.string()
    .max(2000)
    .transform(sanitizeString)
    .refine(val => !val || SAFE_TEXT_PATTERN.test(val), 'Invalid characters')
    .optional(),
  context: z.string()
    .max(500)
    .transform(sanitizeString)
    .refine(val => !val || SAFE_TEXT_PATTERN.test(val), 'Invalid characters')
    .optional(),
  modifications: z.array(herbModificationSchema).max(20, 'Maximum 20 modifications allowed').optional(),
}).refine((data) => {
  // Clinical notes require the clinical_note field
  if (data.contribution_type === 'clinical_note') {
    return data.clinical_note && data.clinical_note.length >= 20;
  }
  // Modifications require at least one modification
  if (data.contribution_type === 'modification' || data.contribution_type === 'addition') {
    return data.modifications && data.modifications.length > 0;
  }
  return true;
}, {
  message: 'Clinical notes require at least 20 characters. Modifications require at least one herb change.',
  path: ['clinical_note'],
});

// SymPy Compute Schemas
export const symbolicComputeSchema = z.object({
  operation: z.enum(['solve', 'simplify', 'diff', 'integrate', 'convert_units']),
  expression: z.string().min(1, 'Expression is required').max(500, 'Expression too long'),
  variables: z.record(z.string()).optional(),
  assumptions: z.record(z.boolean()).optional(),
});

export const dosageComputeSchema = z.object({
  herb_name: z.string().min(1, 'Herb name is required').max(100),
  body_weight_kg: z.number().positive('Weight must be positive').max(500),
  dose_per_kg_mg: z.number().positive('Dose must be positive').max(10000),
  constraints: z.object({
    max_daily_mg: z.number().positive().optional(),
    interaction_factor: z.number().min(0).max(1).optional(),
  }).optional(),
  age_years: z.number().min(0).max(120).optional(),
  form: z.enum(['powder', 'tincture', 'capsule', 'tea', 'decoction', 'extract']).optional(),
});

// Explain Formula Schema (Grok AI patient explanation)
export const explainFormulaSchema = z.object({
  formulaName: z.string().min(1).max(200),
  ingredients: z.array(z.string()).max(50),
  actions: z.string().max(500),
  indications: z.string().max(500),
});

// Utility function to validate and parse data
export function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

// Helper function to format Zod errors for display
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formattedErrors[path] = err.message;
  });

  return formattedErrors;
}

// Type exports for TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type SymptomAnalysisInput = z.infer<typeof symptomAnalysisSchema>;
export type HerbDrugCheckInput = z.infer<typeof herbDrugCheckSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type PractitionerSearchInput = z.infer<typeof practitionerSearchSchema>;
export type FormulaInput = z.infer<typeof formulaSchema>;
export type FormulaIngredientInput = z.infer<typeof formulaIngredientSchema>;
export type HerbModificationInput = z.infer<typeof herbModificationSchema>;
export type FormulaContributionInput = z.infer<typeof formulaContributionSchema>;
export type SymbolicComputeInput = z.infer<typeof symbolicComputeSchema>;
export type DosageComputeInput = z.infer<typeof dosageComputeSchema>;
export type ExplainFormulaInput = z.infer<typeof explainFormulaSchema>;
