/**
 * Grok AI Integration Library
 *
 * Ported from frontend/lib/grok.ts — uses xAI API.
 * Only change: import.meta.env instead of process.env.
 *
 * Note: This is server-side only. Never expose XAI_API_KEY to the client.
 */

const XAI_API_URL = import.meta.env.XAI_API_URL || "https://api.x.ai/v1";
const XAI_API_KEY = import.meta.env.XAI_API_KEY;

export interface SymptomAnalysisRequest {
  symptoms: string;
  followUpAnswers?: Record<string, string>;
  context?: {
    age?: number;
    gender?: string;
    existingConditions?: string[];
  };
}

export interface TcmPatternMatch {
  patternName: string;
  chineseName?: string;
  pinyinName?: string;
  matchReason: string;
  keySymptoms: string[];
  suggestedFormulas?: string[];
  suggestedPoints?: string[];
}

export interface SymptomAnalysisResponse {
  analysis: string;
  tcmPatterns?: TcmPatternMatch[];
  recommendations: {
    modalities: string[];
    herbs: string[];
    practitioners?: string[];
  };
  followUpQuestions?: FollowUpQuestion[];
  disclaimer: string;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  type: "text" | "choice" | "number";
  options?: string[];
}

export interface ExplainFormulaRequest {
  formulaName: string;
  herbs: Array<{ name: string; role?: string; amount?: string }>;
  description?: string;
  audience?: "patient" | "student" | "practitioner";
}

export interface HerbDrugInteractionResult {
  herb: string;
  medication: string;
  severity: "none" | "mild" | "moderate" | "severe";
  description: string;
  mechanism?: string;
  recommendation: string;
}

export interface HerbDrugCheckResponse {
  interactions: HerbDrugInteractionResult[];
  generalAdvice: string;
  disclaimer: string;
}

function getAgeRange(age: number): string {
  if (age < 18) return "0-17";
  if (age < 30) return "18-29";
  if (age < 45) return "30-44";
  if (age < 60) return "45-59";
  return "60+";
}

function anonymizeData(data: SymptomAnalysisRequest): string {
  return JSON.stringify({
    symptoms: data.symptoms,
    context: data.context
      ? {
          ageRange: data.context.age ? getAgeRange(data.context.age) : undefined,
          gender: data.context.gender,
          hasConditions: data.context.existingConditions && data.context.existingConditions.length > 0,
        }
      : undefined,
    followUpAnswers: data.followUpAnswers,
  });
}

const MODEL = () => import.meta.env.XAI_MODEL || "grok-4.3";

/**
 * Open a streaming chat completion against xAI. Returns the raw upstream
 * Response (SSE body); the caller is responsible for parsing.
 *
 * Throws if the API key is missing or the upstream returns non-2xx.
 */
export async function callGrokStream(systemPrompt: string, userPrompt: string): Promise<Response> {
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY is not configured");
  }
  const response = await fetch(`${XAI_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: MODEL(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    }),
  });
  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Grok API error ${response.status}: ${errorText}`);
  }
  return response;
}

async function callGrok(systemPrompt: string, userPrompt: string, parseJson = true): Promise<any> {
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY is not configured");
  }

  const response = await fetch(`${XAI_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Grok API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from Grok");
  }

  if (parseJson) {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonStr);
  }

  return content;
}

/**
 * Analyze symptoms using Grok AI
 */
export async function analyzeSymptoms(request: SymptomAnalysisRequest): Promise<SymptomAnalysisResponse> {
  const systemPrompt = `You are a holistic health advisor assistant with expertise in Traditional Chinese Medicine (TCM). Analyze the user's symptoms and provide both Western holistic recommendations and TCM pattern differentiation.

IMPORTANT:
- Always include a medical disclaimer
- Recommend evidence-based holistic approaches
- Suggest 3-5 relevant modalities (e.g., acupuncture, yoga, massage)
- Suggest 3-5 herbs that may help
- Ask 2-3 relevant follow-up questions if needed
- Be empathetic and supportive
- Never diagnose medical conditions
- Always recommend consulting healthcare professionals for serious symptoms
- Identify 2-4 possible TCM patterns/syndromes that match the symptoms

For each TCM pattern provide:
- patternName: English name (e.g. "Heart Blood Deficiency")
- chineseName: Hanzi characters
- pinyinName: Romanized pronunciation with tone marks

Respond in JSON format:
{
  "analysis": "General analysis text",
  "tcmPatterns": [{ "patternName": "", "chineseName": "", "pinyinName": "", "matchReason": "", "keySymptoms": [], "suggestedFormulas": [], "suggestedPoints": [] }],
  "recommendations": { "modalities": [], "herbs": [], "practitioners": [] },
  "followUpQuestions": [{ "id": "", "question": "", "type": "text|choice|number", "options": [] }],
  "disclaimer": "This is for educational purposes only..."
}`;

  const userPrompt = `Patient data (anonymized): ${anonymizeData(request)}`;
  return callGrok(systemPrompt, userPrompt);
}

/**
 * Generate follow-up questions
 */
export async function generateFollowUpQuestions(
  symptoms: string,
  previousAnswers?: Record<string, string>
): Promise<FollowUpQuestion[]> {
  const systemPrompt = `Generate 2-3 follow-up questions to better understand the patient's condition for TCM pattern differentiation. Return as JSON array of { id, question, type, options }.`;

  const userPrompt = `Symptoms: ${symptoms}${previousAnswers ? `\nPrevious answers: ${JSON.stringify(previousAnswers)}` : ""}`;
  return callGrok(systemPrompt, userPrompt);
}

/** Build the system + user prompts used by both streaming and non-streaming explainFormula. */
export function buildExplainFormulaPrompts(req: ExplainFormulaRequest): { systemPrompt: string; userPrompt: string } {
  const audience = req.audience || "patient";
  const audienceGuide: Record<string, string> = {
    patient:
      "Use plain, warm, jargon-free language a non-medical reader can follow. Avoid technical pharmacology and untranslated Chinese terms unless you immediately explain them.",
    student:
      "Write for a TCM student. Explain the jun/chen/zuo/shi (chief/deputy/assistant/envoy) hierarchy explicitly, the underlying TCM pattern this formula treats, and how each herb's nature/flavor/meridian contributes.",
    practitioner:
      "Write for a clinical practitioner. Be concise and mechanism-rich: TCM differential indications, dose-response considerations, common modifications, contraindications, and any pharmacological evidence worth flagging.",
  };

  const systemPrompt = `You are a TCM educator who can adapt explanation depth to the reader. ${audienceGuide[audience]} Describe how the herbs work together as a formula, not just individually. Keep paragraphs short. Do not include disclaimers in the body — they are added separately.`;

  const userPrompt = `Formula: ${req.formulaName}\nHerbs: ${JSON.stringify(req.herbs)}${req.description ? `\nFormula description: ${req.description}` : ""}\n\nExplain this formula for a ${audience}.`;
  return { systemPrompt, userPrompt };
}

/**
 * Explain a formula in audience-appropriate language (non-streaming).
 */
export async function explainFormula(req: ExplainFormulaRequest): Promise<string> {
  const { systemPrompt, userPrompt } = buildExplainFormulaPrompts(req);
  return callGrok(systemPrompt, userPrompt, false);
}

// ─── Formula Constructor ───────────────────────────────────────────────────

export interface ConstructFormulaRequest {
  /** Free-text description of the patient/case the formula is for. */
  presentation: string;
  /** Tradition the formula should be rooted in. */
  tradition: "TCM" | "Western" | "Ayurvedic" | "Integrative";
  /** Optional: TCM pattern or Western diagnosis if known. */
  pattern?: string;
  /** Optional patient context. */
  patient?: {
    age?: number;
    sex?: string;
    weight_kg?: number;
    pregnant?: boolean;
    breastfeeding?: boolean;
    conditions?: string[];
    medications?: string[];
    allergies?: string[];
  };
  /** Restrict to these herbs only (e.g. dispensary inventory). */
  availableHerbs?: string[];
  /** Excluded herbs (allergy, prior reaction, philosophical). */
  excludedHerbs?: string[];
  /** Preferred form. */
  preferredForm?: "decoction" | "tincture" | "powder" | "tea" | "capsule";
}

export interface ConstructedFormulaIngredient {
  name: string;
  scientific_name?: string;
  pinyin?: string;
  role: "chief" | "deputy" | "assistant" | "envoy";
  amount: string;
  rationale: string;
}

export interface ConstructedFormula {
  formulaName: string;
  tradition: string;
  pattern?: string;
  presentation: string;
  ingredients: ConstructedFormulaIngredient[];
  preparation: string;
  dosage: string;
  duration: string;
  modifications?: Array<{ for: string; change: string }>;
  contraindications: string[];
  cautions: string[];
  rationale: string;
  disclaimer: string;
}

export async function constructFormula(req: ConstructFormulaRequest): Promise<ConstructedFormula> {
  const systemPrompt = `You are a senior clinical herbalist with formal training in ${req.tradition}. Construct a custom herbal formula appropriate to the patient case described.

Principles:
- Use established herbs and traditional formula architecture (jun/chen/zuo/shi for TCM; primary/synergist/regulator/vehicle for Western).
- Doses must be within accepted clinical ranges for the chosen form.
- ALWAYS check the patient context for contraindications: pregnancy, breastfeeding, pediatric/geriatric age, medications, allergies, organ system concerns.
- If the case is ambiguous, contradicts safe practice, or lacks information critical to formulation, surface that in the "cautions" array — but still produce a best-effort formula unless the case is clearly unsafe.
- If availableHerbs is provided, ONLY use herbs from that list. If excludedHerbs is provided, do NOT use any of them.
- Provide concise rationale per ingredient (one sentence) and overall (one paragraph).

Return ONLY valid JSON in this exact shape:
{
  "formulaName": "Suggested name (descriptive, not a fake classical name)",
  "tradition": "${req.tradition}",
  "pattern": "TCM pattern or Western dx if applicable",
  "presentation": "One-sentence restatement of the case",
  "ingredients": [
    {
      "name": "Common name",
      "scientific_name": "Latin name",
      "pinyin": "Pinyin if TCM",
      "role": "chief|deputy|assistant|envoy",
      "amount": "e.g. 9g, 1:5 30%, 500mg",
      "rationale": "Why this herb at this dose"
    }
  ],
  "preparation": "Decoction/tincture/etc preparation method",
  "dosage": "How patient takes it (e.g. '1 cup BID, AC')",
  "duration": "Suggested course length and review point",
  "modifications": [{ "for": "if symptom X persists", "change": "add Y 6g, reduce Z to 3g" }],
  "contraindications": ["Pregnancy", "Concurrent warfarin", ...],
  "cautions": ["Monitor BP", ...],
  "rationale": "One-paragraph overall reasoning explaining how the formula addresses the case",
  "disclaimer": "Clinical use only..."
}`;

  const userPrompt = `Case presentation: ${req.presentation}
Tradition: ${req.tradition}
${req.pattern ? `Identified pattern/dx: ${req.pattern}\n` : ""}${req.preferredForm ? `Preferred form: ${req.preferredForm}\n` : ""}${req.patient ? `Patient context: ${JSON.stringify(req.patient)}\n` : ""}${req.availableHerbs?.length ? `Restrict to these herbs only: ${req.availableHerbs.join(", ")}\n` : ""}${req.excludedHerbs?.length ? `Exclude these herbs: ${req.excludedHerbs.join(", ")}\n` : ""}`;

  return callGrok(systemPrompt, userPrompt);
}

// ─── Safety Check ──────────────────────────────────────────────────────────

export interface SafetyCheckRequest {
  /** What is being checked: a single herb, a list of herbs, or a formula. */
  subject: { kind: "herb" | "formula"; name: string; ingredients?: string[] };
  /** Patient context that determines the risk profile. */
  patient: {
    age?: number;
    sex?: string;
    weight_kg?: number;
    pregnant?: boolean;
    breastfeeding?: boolean;
    conditions?: string[];
    medications?: string[];
    allergies?: string[];
    pediatric?: boolean;
    geriatric?: boolean;
  };
  /** Specific concerns the practitioner wants verified. */
  concerns?: string[];
}

export interface SafetyCheckResponse {
  /** Single overall verdict. */
  verdict: "safe" | "caution" | "avoid";
  /** Short headline. */
  headline: string;
  /** Specific contraindications triggered by the patient context. */
  triggered: Array<{
    issue: string;
    severity: "mild" | "moderate" | "severe";
    mechanism?: string;
    recommendation: string;
  }>;
  /** Adjusted dosing recommendations if any. */
  doseAdjustments?: string[];
  /** Alternative herbs/formulas if avoid. */
  alternatives?: Array<{ name: string; rationale: string }>;
  /** Monitoring recommendations. */
  monitoring?: string[];
  /** General notes. */
  notes: string;
  disclaimer: string;
}

export async function safetyCheck(req: SafetyCheckRequest): Promise<SafetyCheckResponse> {
  const systemPrompt = `You are a clinical pharmacognosist evaluating the safety of an herbal product for a specific patient. Be rigorous and conservative — patient safety overrides therapeutic enthusiasm.

Checklist (evaluate every category):
1. Pregnancy / breastfeeding — known emmenagogues, abortifacients, hormonally active compounds.
2. Age — pediatric dosing differences, geriatric metabolism (especially CYP enzymes), polypharmacy risk.
3. Drug interactions — both pharmacokinetic (CYP450, P-gp, OATP) and pharmacodynamic (synergy/antagonism on coagulation, BP, glucose, sedation).
4. Existing conditions — hepatic, renal, cardiac, GI, autoimmune, bleeding disorders, hormone-sensitive cancers.
5. Allergies — Asteraceae cross-reactivity, etc.
6. Long-term use risks — hepatotoxicity, cumulative toxicity (e.g. aristolochic acid family), tolerance.

Verdict logic:
- "safe": no triggered concerns at standard dosing
- "caution": one or more concerns require dose adjustment, monitoring, or short course
- "avoid": one or more contraindications are absolute (pregnancy with abortifacient, severe drug interaction, etc.)

Return ONLY valid JSON in this exact shape:
{
  "verdict": "safe|caution|avoid",
  "headline": "One-line summary",
  "triggered": [{ "issue": "", "severity": "mild|moderate|severe", "mechanism": "", "recommendation": "" }],
  "doseAdjustments": ["string"],
  "alternatives": [{ "name": "", "rationale": "" }],
  "monitoring": ["string"],
  "notes": "Additional context",
  "disclaimer": "Clinical use only..."
}`;

  const subjectStr = req.subject.kind === "formula"
    ? `Formula: ${req.subject.name}${req.subject.ingredients?.length ? ` (ingredients: ${req.subject.ingredients.join(", ")})` : ""}`
    : `Herb: ${req.subject.name}`;

  const userPrompt = `${subjectStr}
Patient: ${JSON.stringify(req.patient)}
${req.concerns?.length ? `Specific concerns: ${req.concerns.join("; ")}` : ""}`;

  return callGrok(systemPrompt, userPrompt);
}

// ─── Consultation Prep ─────────────────────────────────────────────────────

export interface ConsultationPrepRequest {
  practitionerType: "TCM" | "Western Herbalist" | "Naturopath" | "Ayurvedic" | "Integrative" | "Other";
  primaryComplaint: string;
  duration?: string;
  goals?: string[];
  triedAlready?: string[];
  context?: {
    age?: number;
    sex?: string;
    medications?: string[];
    conditions?: string[];
  };
}

export interface ConsultationPrepResponse {
  questionsToAsk: Array<{ question: string; why: string }>;
  symptomsToTrack: Array<{ symptom: string; how: string }>;
  topicsToMention: string[];
  whatToBring: string[];
  redFlags: string[];
  preparationTips: string[];
  disclaimer: string;
}

export async function consultationPrep(req: ConsultationPrepRequest): Promise<ConsultationPrepResponse> {
  const systemPrompt = `You are a patient-advocate preparing someone for a holistic health consultation. Help them get maximum value from the appointment by surfacing the right questions, observations, and information to bring.

The practitioner type matters — adapt suggestions accordingly:
- TCM practitioner will ask about pulse, tongue, energy patterns, sleep, digestion, emotions
- Naturopath will focus on root causes, lifestyle, labs
- Ayurvedic will assess dosha, prakriti, daily routine
- Western herbalist focuses on physiological systems

Make questions actionable and empowering, not adversarial. Help them be a good partner in their care.

Return ONLY valid JSON:
{
  "questionsToAsk": [{ "question": "", "why": "" }],
  "symptomsToTrack": [{ "symptom": "", "how": "for how long, what to note" }],
  "topicsToMention": ["string"],
  "whatToBring": ["medications list", "previous lab results", ...],
  "redFlags": ["symptoms that warrant urgent care, not just consultation"],
  "preparationTips": ["string"],
  "disclaimer": "Educational only..."
}`;

  const userPrompt = `Practitioner type: ${req.practitionerType}
Primary complaint: ${req.primaryComplaint}
${req.duration ? `Duration: ${req.duration}\n` : ""}${req.goals?.length ? `Patient's goals: ${req.goals.join("; ")}\n` : ""}${req.triedAlready?.length ? `Already tried: ${req.triedAlready.join("; ")}\n` : ""}${req.context ? `Context: ${JSON.stringify(req.context)}` : ""}`;

  return callGrok(systemPrompt, userPrompt);
}

/**
 * Check herb-drug interactions.
 * If `herbs` is provided, the analysis is scoped to those specific herbs.
 * Otherwise the model surveys commonly-used herbs against the medications.
 */
export async function checkHerbDrugInteractions(
  medications: string[],
  herbs?: string[]
): Promise<HerbDrugCheckResponse> {
  const scope = herbs && herbs.length > 0
    ? "Focus your analysis ONLY on interactions between the listed herbs and the listed medications."
    : "Survey commonly-used Western and Chinese herbs that are likely to interact with the listed medications.";

  const systemPrompt = `You are a clinical pharmacologist with deep expertise in herb-drug interactions, including pharmacokinetic (CYP450 enzymes, P-glycoprotein, OATP transporters) and pharmacodynamic mechanisms. Analyze potential interactions thoroughly.

${scope}

For every interaction you identify:
- Be specific about the molecular mechanism (cite the enzyme/transporter/receptor when known)
- Distinguish between theoretical, in vitro, and clinically documented interactions
- Provide actionable clinical recommendations (avoid, monitor, separate dosing by hours, dose adjust, etc.)
- Use severity calibrated to clinical impact: "severe" = avoid combination, "moderate" = monitor closely / consider alternatives, "mild" = minor / informational, "none" = no clinically significant interaction

Return ONLY valid JSON in this exact shape:
{
  "interactions": [
    {
      "herb": "Common name (Latin name)",
      "medication": "Drug name",
      "severity": "none|mild|moderate|severe",
      "description": "What happens",
      "mechanism": "Specific molecular/pharmacological mechanism",
      "recommendation": "Specific clinical action"
    }
  ],
  "generalAdvice": "Overall guidance for this patient situation",
  "disclaimer": "Always consult your healthcare provider..."
}

Do not include herbs that have no clinically meaningful interaction. If nothing relevant exists, return an empty interactions array with appropriate generalAdvice.`;

  const userPrompt = herbs && herbs.length > 0
    ? `Medications: ${medications.join(", ")}\nHerbs being taken: ${herbs.join(", ")}`
    : `Medications: ${medications.join(", ")}`;

  return callGrok(systemPrompt, userPrompt);
}
