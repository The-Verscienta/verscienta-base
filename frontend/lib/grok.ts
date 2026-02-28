/**
 * Grok AI Integration Library
 * Uses xAI API for symptom analysis and recommendations
 */

const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1';
const XAI_API_KEY = process.env.XAI_API_KEY;

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
  type: 'text' | 'choice' | 'number';
  options?: string[];
}

/**
 * Anonymize user data before sending to xAI
 */
function anonymizeData(data: SymptomAnalysisRequest): string {
  // Remove any potentially identifying information
  const anonymized = {
    symptoms: data.symptoms,
    context: data.context ? {
      ageRange: data.context.age ? getAgeRange(data.context.age) : undefined,
      gender: data.context.gender,
      hasConditions: data.context.existingConditions && data.context.existingConditions.length > 0,
    } : undefined,
    followUpAnswers: data.followUpAnswers,
  };

  return JSON.stringify(anonymized);
}

function getAgeRange(age: number): string {
  if (age < 18) return '0-17';
  if (age < 30) return '18-29';
  if (age < 45) return '30-44';
  if (age < 60) return '45-59';
  return '60+';
}

/**
 * Call Grok AI for symptom analysis
 */
export async function analyzeSymptoms(
  request: SymptomAnalysisRequest
): Promise<SymptomAnalysisResponse> {
  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY is not configured');
  }

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
- chineseName: Hanzi characters (e.g. "心血虚")
- pinyinName: Romanized pronunciation with tone marks (e.g. "Xīn Xuè Xū")
- matchReason: 1-2 sentences explaining why this pattern fits the symptoms
- keySymptoms: 2-4 specific symptom keywords that match this pattern
- suggestedFormulas: 2-3 classical herbal formula names in Pinyin
- suggestedPoints: 2-3 acupuncture point codes (e.g. "HT 7", "SP 6", "LV 3")

Format your response as JSON with this structure:
{
  "analysis": "Brief analysis of symptoms",
  "tcmPatterns": [
    {
      "patternName": "Heart Blood Deficiency",
      "chineseName": "心血虚",
      "pinyinName": "Xīn Xuè Xū",
      "matchReason": "The insomnia and palpitations suggest insufficient Blood to nourish the Heart shen.",
      "keySymptoms": ["insomnia", "palpitations", "pale complexion"],
      "suggestedFormulas": ["Gui Pi Tang", "Tian Wang Bu Xin Dan"],
      "suggestedPoints": ["HT 7", "SP 6", "PC 6"]
    }
  ],
  "recommendations": {
    "modalities": ["modality1", "modality2"],
    "herbs": ["herb1", "herb2"]
  },
  "followUpQuestions": [
    {
      "id": "duration",
      "question": "How long have you been experiencing these symptoms?",
      "type": "choice",
      "options": ["Less than 1 week", "1-4 weeks", "1-3 months", "More than 3 months"]
    }
  ],
  "disclaimer": "Medical disclaimer text"
}`;

  const userPrompt = `User symptoms: ${request.symptoms}

${request.context ? `Additional context:
- Age range: ${request.context.age ? getAgeRange(request.context.age) : 'Not specified'}
- Gender: ${request.context.gender || 'Not specified'}
- Existing conditions: ${request.context.existingConditions?.join(', ') || 'None specified'}` : ''}

${request.followUpAnswers ? `
Follow-up answers:
${Object.entries(request.followUpAnswers).map(([q, a]) => `- ${q}: ${a}`).join('\n')}` : ''}

Please provide holistic health recommendations.`;

  try {
    const response = await fetch(`${XAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`xAI API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from Grok AI');
    }

    // Parse JSON response from Grok
    try {
      const parsed = JSON.parse(content);
      return parsed as SymptomAnalysisResponse;
    } catch (parseError) {
      // If Grok didn't return valid JSON, create structured response
      return {
        analysis: content,
        recommendations: {
          modalities: [],
          herbs: [],
        },
        disclaimer: 'This information is for educational purposes only and does not replace professional medical advice. Please consult with a qualified healthcare provider.',
      };
    }
  } catch (error) {
    console.error('Grok AI API error:', error);
    throw error;
  }
}

/**
 * Generate follow-up questions based on symptoms
 */
export async function generateFollowUpQuestions(
  symptoms: string,
  previousAnswers?: Record<string, string>
): Promise<FollowUpQuestion[]> {
  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY is not configured');
  }

  const systemPrompt = `You are a medical intake assistant. Generate 2-3 relevant follow-up questions to better understand the user's symptoms. Return ONLY a JSON array of questions.

Format:
[
  {
    "id": "unique_id",
    "question": "Question text?",
    "type": "choice" | "text" | "number",
    "options": ["option1", "option2"] // only for choice type
  }
]`;

  const userPrompt = `Symptoms: ${symptoms}

${previousAnswers ? `Previous answers: ${JSON.stringify(previousAnswers)}` : ''}

Generate follow-up questions to gather more information.`;

  try {
    const response = await fetch(`${XAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate follow-up questions');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    return JSON.parse(content) as FollowUpQuestion[];
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return [];
  }
}

export interface ExplainFormulaRequest {
  formulaName: string;
  ingredients: string[];
  actions: string;
  indications: string;
}

/**
 * Explain a TCM formula in plain English for patients
 */
export async function explainFormula(req: ExplainFormulaRequest): Promise<string> {
  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY is not configured');
  }

  const systemPrompt = `You are a friendly health educator who explains Traditional Chinese Medicine (TCM) formulas in plain English for patients with no medical training.

Guidelines:
- Write 2-3 short paragraphs, no jargon
- When you must use a TCM term, immediately explain it in plain language
- Use warm, reassuring language
- End with a note to always follow their practitioner's guidance
- Do not diagnose or prescribe
- Return only the explanation text, no JSON`;

  const userPrompt = `Please explain this TCM formula in plain English for a patient:

Formula Name: ${req.formulaName}
Contains: ${req.ingredients.join(', ')}
Main Actions: ${req.actions || 'Not specified'}
Used For: ${req.indications || 'Not specified'}`;

  const response = await fetch(`${XAI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`xAI API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('No response from Grok AI');
  return content;
}

export interface HerbDrugInteractionResult {
  herbName: string;
  herbChineseName?: string;
  herbPinyinName?: string;
  medicationName: string;
  severity: 'contraindicated' | 'caution' | 'monitor';
  mechanism: string;
  clinicalEffect: string;
  evidenceLevel: 'strong' | 'moderate' | 'preliminary' | 'theoretical';
}

export interface HerbDrugCheckResponse {
  interactions: HerbDrugInteractionResult[];
  summary: string;
  checkedMedications: string[];
  disclaimer: string;
}

/**
 * Check TCM herb-drug interactions for a list of pharmaceutical medications
 */
export async function checkHerbDrugInteractions(
  medications: string[]
): Promise<HerbDrugCheckResponse> {
  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY is not configured');
  }

  const systemPrompt = `You are a clinical pharmacology and Traditional Chinese Medicine (TCM) safety expert. Identify known or theoretically significant interactions between conventional pharmaceutical drugs and commonly used TCM herbs.

GUIDELINES:
- Only report clinically meaningful interactions with a pharmacological basis
- Severity levels:
  - "contraindicated": Should NOT be combined; serious risk of harm
  - "caution": May be combined with close monitoring; moderate risk
  - "monitor": Potential interaction; requires awareness but low immediate risk
- Evidence levels:
  - "strong": Multiple published clinical trials or case reports
  - "moderate": Some clinical evidence or well-established pharmacological basis
  - "preliminary": Limited studies; theoretical but plausible
  - "theoretical": Based on known pharmacology; not well-studied clinically
- Include Chinese name (Hanzi) and Pinyin for each herb when known
- Focus on commonly used TCM herbs (Ginkgo, Dang Gui, Ren Shen, Dan Shen, etc.)
- Err on the side of caution — flag potential interactions rather than miss dangerous ones
- Never diagnose or treat; always recommend consulting healthcare professionals

Format response as JSON:
{
  "interactions": [
    {
      "herbName": "Dang Gui",
      "herbChineseName": "当归",
      "herbPinyinName": "Dāng Guī",
      "medicationName": "Warfarin",
      "severity": "contraindicated",
      "mechanism": "Contains coumarins that inhibit platelet aggregation and may enhance anticoagulant effects via CYP2C9 inhibition.",
      "clinicalEffect": "Increased bleeding risk; INR elevation",
      "evidenceLevel": "strong"
    }
  ],
  "summary": "Brief 2-3 sentence overall assessment",
  "checkedMedications": ["warfarin"],
  "disclaimer": "Safety disclaimer text"
}`;

  const userPrompt = `Check the following medications for interactions with TCM herbs:

Medications: ${medications.join(', ')}

Identify all clinically significant herb-drug interactions for these medications.`;

  const response = await fetch(`${XAI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`xAI API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('No response from Grok AI');

  try {
    return JSON.parse(content) as HerbDrugCheckResponse;
  } catch {
    return {
      interactions: [],
      summary: content,
      checkedMedications: medications,
      disclaimer: 'This information is for educational purposes only. Always consult your healthcare provider before combining medications with herbal products.',
    };
  }
}

/**
 * Summarize content (for modality/herb descriptions)
 */
export async function summarizeContent(
  content: string,
  maxLength: number = 200
): Promise<string> {
  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY is not configured');
  }

  try {
    const response = await fetch(`${XAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: `Summarize the following content in ${maxLength} characters or less. Be concise and informative.`,
          },
          { role: 'user', content },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to summarize content');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || content.substring(0, maxLength);
  } catch (error) {
    console.error('Error summarizing content:', error);
    return content.substring(0, maxLength) + '...';
  }
}
