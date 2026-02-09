import { generateLlmText } from './llm'
import { recoverJsonCandidate } from './json-recovery'

import { mockEvaluationResults, mockInterviewQuestions } from './mock-data'

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
  const prompt = parts.map((part) => part.text).join('\n\n')
  const result = await generateLlmText(prompt, {
    geminiModels: [
      process.env.GEMINI_MODEL || '',
      'gemini-2.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
    ].filter(Boolean),
    openAiModel: process.env.OPENAI_MODEL || 'gpt-5-mini',
    temperature: 0.2,
  })
  return result.text
}

function buildQuestionPrompt(config: PersonaConfig, resumeSummary?: string, jobSummary?: string): string {
  return [
    `You are configuring a mock interview for a candidate applying to ${config.company} as ${config.role}.`,
    `Focus areas: ${config.focusAreas.join(', ') || 'general behavioral fit'}.`,
    `Technical weighting: ${config.technicalWeight}%. Duration: ${config.duration}.`,
    resumeSummary ? `Candidate background: ${resumeSummary}.` : null,
    jobSummary ? `Job description summary: ${jobSummary}.` : null,
    'Return ONLY strict JSON (no markdown, no commentary).',
    'Provide a JSON array of 5-6 questions.',
    'Each question object must include: id (string), prompt (string), optional focusArea (string), optional followUps (array of 1-2 strings).',
    'Keep prompts concise and interview-realistic.',
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
    'Return ONLY strict JSON (no markdown, no commentary).',
    'JSON fields required: overallScore (0-100), strengths (array), weakAreas (array), jdCoverage (object with hit, partial, miss totaling 100), insights (array of coaching tips), evidenceSnippets (array of objects with type hit|partial|miss, skill, quote, optional matchedRequirement).',
  ]
    .filter(Boolean)
    .join('\n')
}

function safeParseJSON<T>(payload: string): T | null {
  const parsed = recoverJsonCandidate<T>(payload)
  if (!parsed) {
    console.error('Failed to parse model response as JSON')
    return null
  }
  return parsed
}

export async function generateInterviewPlan(
  config: PersonaConfig,
  resumeSummary?: string,
  jobSummary?: string,
): Promise<InterviewPlan> {
  const hasAnyProviderKey = Boolean(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY,
  )
  if (!hasAnyProviderKey) {
    console.warn('No LLM API key configured, falling back to mock interview questions.')
    return {
      persona: config,
      questions: mockInterviewQuestions.map((question) => ({
        id: String(question.id),
        prompt: question.question,
        focusArea: question.focusArea,
      })),
      guidance: 'Mock data in use. Supply GEMINI_API_KEY or OPENAI_API_KEY for live generation.',
    }
  }

  const prompt = buildQuestionPrompt(config, resumeSummary, jobSummary)

  try {
    const raw = await generateContentText([{ text: prompt }])

    const parsed = safeParseJSON<InterviewQuestion[]>(raw)
    if (!parsed || !Array.isArray(parsed)) {
      throw new Error('LLM returned invalid interview plan JSON')
    }

    return {
      persona: config,
      questions: parsed,
    }
  } catch (error) {
    console.error('Failed to generate interview plan via LLM. Using mock data.', error)
    return {
      persona: config,
      questions: mockInterviewQuestions.map((question) => ({
        id: String(question.id),
        prompt: question.question,
        focusArea: question.focusArea,
      })),
      guidance: 'Fallback mode active (LLM_PARSE_FAILED). Mock questions provided.',
    }
  }
}

export async function evaluateInterviewAnswer(input: EvaluationInput): Promise<EvaluationSummary> {
  const hasAnyProviderKey = Boolean(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY,
  )
  if (!hasAnyProviderKey) {
    console.warn('No LLM API key configured, falling back to mock evaluation data.')
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
      throw new Error('LLM returned invalid evaluation JSON')
    }

    return parsed
  } catch (error) {
    console.error('Failed to evaluate interview answer via LLM. Using mock evaluation.', error)
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
