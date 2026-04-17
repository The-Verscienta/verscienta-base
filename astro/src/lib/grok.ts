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
      model: "grok-beta",
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

/**
 * Explain a formula in patient-friendly language
 */
export async function explainFormula(req: ExplainFormulaRequest): Promise<string> {
  const systemPrompt = `You are a TCM educator. Explain the herbal formula in clear, ${req.audience || "patient"}-friendly language. Describe each herb's role (jun/chen/zuo/shi) and how they work together. Keep it warm, clear, and educational.`;

  const userPrompt = `Formula: ${req.formulaName}\nHerbs: ${JSON.stringify(req.herbs)}${req.description ? `\nDescription: ${req.description}` : ""}`;
  return callGrok(systemPrompt, userPrompt, false);
}

/**
 * Check herb-drug interactions
 */
export async function checkHerbDrugInteractions(medications: string[]): Promise<HerbDrugCheckResponse> {
  const systemPrompt = `You are a pharmacology expert specializing in herb-drug interactions. Analyze potential interactions between common herbs and the given medications. Return JSON:
{
  "interactions": [{ "herb": "", "medication": "", "severity": "none|mild|moderate|severe", "description": "", "mechanism": "", "recommendation": "" }],
  "generalAdvice": "",
  "disclaimer": "Always consult your healthcare provider..."
}`;

  const userPrompt = `Medications: ${medications.join(", ")}`;
  return callGrok(systemPrompt, userPrompt);
}
