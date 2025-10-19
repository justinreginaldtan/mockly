import { GoogleGenerativeAI } from '@google/generative-ai'

import { mockEvaluationResults, mockInterviewQuestions } from './mock-data'

const DEFAULT_GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-latest',
].filter((value): value is string => Boolean(value && value.trim()))

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const geminiClient = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

export interface PersonaConfig {
  personaId: string
  company: string
  role: string
  focusAreas: string[]
  voiceStyle?: string
  voiceStyleId?: string
  technicalWeight: number
  duration: 'short' | 'standard'
  additionalContext?: string
}

export interface InterviewQuestion {
  id: string
  prompt: string
  focusArea?: string
  followUps?: string[]
}

export interface InterviewPlan {
  persona: PersonaConfig
  questions: InterviewQuestion[]
  guidance?: string
}

export interface EvaluationInput {
  transcript: string
  persona: PersonaConfig
  questionId?: string
}

export interface InterviewSetupPayload {
  persona: PersonaConfig
  resumeSummary?: string
  jobSummary?: string
}

export interface EvaluationSummary {
  overallScore: number
  strengths: string[]
  weakAreas: string[]
  jdCoverage: {
    hit: number
    partial: number
    miss: number
  }
  insights: string[]
  evidenceSnippets: Array<{
    type: 'hit' | 'partial' | 'miss'
    skill: string
    quote: string
    matchedRequirement?: string
  }>
}

async function generateContentText(parts: Array<{ text: string }>): Promise<string> {
  if (!geminiClient) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  let lastError: unknown

  for (const modelName of DEFAULT_GEMINI_MODELS) {
    try {
      const model = geminiClient.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      })
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
      })

      const text = result.response?.text()
      if (!text || text.trim().length === 0) {
        throw new Error('Empty Gemini response')
      }

      return text
    } catch (error) {
      lastError = error

      const status = typeof error === 'object' && error && 'status' in error ? (error as { status?: number }).status : undefined
      if (status !== 404) {
        break
      }
    }
  }

  throw lastError ?? new Error('Unable to generate Gemini response')
}

function buildQuestionPrompt(config: PersonaConfig, resumeSummary?: string, jobSummary?: string): string {
  return [
    `You are configuring a mock interview for a candidate applying to ${config.company} as ${config.role}.`,
    `Focus areas: ${config.focusAreas.join(', ') || 'general behavioral fit'}.`,
    `Technical weighting: ${config.technicalWeight}%. Duration: ${config.duration}.`,
    resumeSummary ? `Candidate background: ${resumeSummary}.` : null,
    jobSummary ? `Job description summary: ${jobSummary}.` : null,
    'Provide a JSON array of 5-6 questions. Each question should include: id, prompt, optional focusArea, optional followUps (array of 1-2 strings).',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildEvaluationPrompt(input: EvaluationInput): string {
  return [
    `Evaluate the following candidate response in the style of a structured mock interview coach.`,
    `Persona: ${input.persona.company} ${input.persona.role}. Focus areas: ${input.persona.focusAreas.join(', ') || 'general'}.`,
    input.questionId ? `Question ID: ${input.questionId}.` : null,
    `Transcript:\n${input.transcript}`,
    'Return JSON with overallScore (0-100), strengths (array), weakAreas (array), jdCoverage (object with hit, partial, miss as percentages totaling 100), insights (array of coaching tips), evidenceSnippets (array of objects with type hit|partial|miss, skill, quote, optional matchedRequirement).',
  ]
    .filter(Boolean)
    .join('\n')
}

function safeParseJSON<T>(payload: string): T | null {
  try {
    const trimmed = payload.trim()
    const markdownFencePattern = /^```(?:json)?\s*([\s\S]*?)\s*```$/i
    const match = trimmed.match(markdownFencePattern)
    const jsonContent = match ? match[1] : trimmed

    return JSON.parse(jsonContent) as T
  } catch (error) {
    console.error('Failed to parse Gemini response as JSON', error)
    return null
  }
}

export async function generateInterviewPlan(
  config: PersonaConfig,
  resumeSummary?: string,
  jobSummary?: string,
): Promise<InterviewPlan> {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY missing, falling back to mock interview questions.')
    return {
      persona: config,
      questions: mockInterviewQuestions.map((question) => ({
        id: String(question.id),
        prompt: question.question,
        focusArea: question.focusArea,
      })),
      guidance: 'Mock data in use. Supply GEMINI_API_KEY for live generation.',
    }
  }

  const prompt = buildQuestionPrompt(config, resumeSummary, jobSummary)

  try {
    const raw = await generateContentText([{ text: prompt }])

    const parsed = safeParseJSON<InterviewQuestion[]>(raw)
    if (!parsed || !Array.isArray(parsed)) {
      throw new Error('Gemini returned invalid interview plan JSON')
    }

    return {
      persona: config,
      questions: parsed,
    }
  } catch (error) {
    console.error('Failed to generate interview plan via Gemini. Using mock data.', error)
    return {
      persona: config,
      questions: mockInterviewQuestions.map((question) => ({
        id: String(question.id),
        prompt: question.question,
        focusArea: question.focusArea,
      })),
      guidance: 'Gemini generation failed. Mock questions provided instead.',
    }
  }
}

export async function evaluateInterviewAnswer(input: EvaluationInput): Promise<EvaluationSummary> {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY missing, falling back to mock evaluation data.')
    return {
      overallScore: mockEvaluationResults.overallScore,
      strengths: mockEvaluationResults.strengths,
      weakAreas: mockEvaluationResults.weakAreas,
      jdCoverage: mockEvaluationResults.jdCoverage,
      insights: mockEvaluationResults.upgradeLines,
      evidenceSnippets: mockEvaluationResults.evidenceSnippets.map((snippet) => ({
        type: snippet.type,
        skill: snippet.skill,
        quote: snippet.quote,
        matchedRequirement: snippet.matchedRequirement,
      })),
    }
  }

  const prompt = buildEvaluationPrompt(input)

  try {
    const raw = await generateContentText([{ text: prompt }])

    const parsed = safeParseJSON<EvaluationSummary>(raw)
    if (!parsed) {
      throw new Error('Gemini returned invalid evaluation JSON')
    }

    return parsed
  } catch (error) {
    console.error('Failed to evaluate interview answer via Gemini. Using mock evaluation.', error)
    return {
      overallScore: mockEvaluationResults.overallScore,
      strengths: mockEvaluationResults.strengths,
      weakAreas: mockEvaluationResults.weakAreas,
      jdCoverage: mockEvaluationResults.jdCoverage,
      insights: mockEvaluationResults.upgradeLines,
      evidenceSnippets: mockEvaluationResults.evidenceSnippets.map((snippet) => ({
        type: snippet.type,
        skill: snippet.skill,
        quote: snippet.quote,
        matchedRequirement: snippet.matchedRequirement,
      })),
    }
  }
}
