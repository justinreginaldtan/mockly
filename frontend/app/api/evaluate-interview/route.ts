import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export type InterviewEvaluationResult = {
  overallScore: number
  jdCoverage: {
    hit: number
    partial: number
    miss: number
  }
  strengths: string[]
  weakAreas: string[]
  evidenceSnippets: Array<{
    quote: string
    signal: string
    strength: boolean
  }>
  upgradePlan: string[]
  followUpQuestions: string[]
}

type QuestionResponse = {
  id: string
  text: string
  response: string
  duration?: number
}

type EvaluationRequest = {
  persona?: string
  questions: QuestionResponse[]
  jobSummary?: string
  resumeSummary?: string
}

function sanitizeJsonText(text: string): string {
  return text
    .replace(/^```[a-zA-Z]*\n?/g, "")
    .replace(/```\s*$/g, "")
    .trim()
}

function generateMockEvaluation(questions: QuestionResponse[]): InterviewEvaluationResult {
  console.log("[Evaluate-Interview] Using mock evaluation data (no Gemini API key)")

  // Calculate some basic stats from responses
  const avgResponseLength = questions.reduce((sum, q) => sum + (q.response?.length || 0), 0) / questions.length
  const baseScore = Math.min(85, 50 + Math.floor(avgResponseLength / 20))

  return {
    overallScore: baseScore,
    jdCoverage: {
      hit: 60,
      partial: 25,
      miss: 15
    },
    strengths: [
      "Good communication skills and clear articulation",
      "Structured thinking with logical approach to problems",
      "Technical depth in key areas"
    ],
    weakAreas: [
      "Could provide more specific examples and metrics",
      "Time management - some responses could be more concise"
    ],
    evidenceSnippets: questions.slice(0, 3).map((q, idx) => ({
      quote: q.response?.substring(0, 100) + "..." || "No response provided",
      signal: idx === 0 ? "Leadership" : idx === 1 ? "Technical Skills" : "Communication",
      strength: true
    })),
    upgradePlan: [
      "Practice the STAR method (Situation, Task, Action, Result) for behavioral questions",
      "Prepare specific metrics and quantifiable achievements from past experiences",
      "Work on being more concise while maintaining completeness in responses"
    ],
    followUpQuestions: [
      "Tell me about a time when you had to make a difficult trade-off decision",
      "How would you handle a situation where stakeholders disagree on priorities?",
      "Describe your approach to learning new technologies or domains quickly"
    ]
  }
}

async function evaluateWithGemini(
  questions: QuestionResponse[],
  persona?: string,
  jobSummary?: string,
  resumeSummary?: string
): Promise<InterviewEvaluationResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured")
  }

  const modelId = process.env.GEMINI_MODEL || "gemini-1.5-pro-latest"
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      responseMimeType: "application/json"
    }
  })

  // Build comprehensive prompt
  const qaSection = questions.map((q, idx) =>
    `Q${idx + 1}: ${q.text}\nA${idx + 1}: ${q.response || "(no response provided)"}\nDuration: ${q.duration ? Math.round(q.duration / 1000) : 0}s`
  ).join("\n\n")

  const prompt = [
    "You are an expert interview evaluator. Analyze this complete job interview performance.",
    "",
    persona ? `Interviewer Persona: ${persona}` : "Interviewer: Professional interview context",
    jobSummary ? `Job Description: ${jobSummary}` : "Job: General role interview",
    resumeSummary ? `Candidate Background: ${resumeSummary}` : "Candidate Background: Not provided",
    "",
    "Interview Questions and Responses:",
    qaSection,
    "",
    "Provide a comprehensive evaluation in the following JSON format:",
    "{",
    '  "overallScore": <number 0-100>,',
    '  "jdCoverage": {',
    '    "hit": <percentage of requirements clearly demonstrated>,',
    '    "partial": <percentage partially demonstrated>,',
    '    "miss": <percentage not demonstrated>',
    '  },',
    '  "strengths": [<3-4 specific strength statements>],',
    '  "weakAreas": [<2-3 specific areas for improvement>],',
    '  "evidenceSnippets": [',
    '    {',
    '      "quote": <actual quote from candidate responses>,',
    '      "signal": <skill/competency demonstrated>,',
    '      "strength": <true if positive, false if negative>',
    '    }',
    '  ],',
    '  "upgradePlan": [<3 specific, actionable improvement tips>],',
    '  "followUpQuestions": [<3-4 practice questions for improvement>]',
    "}",
    "",
    "Ensure:",
    "- overallScore reflects actual performance quality",
    "- jdCoverage percentages sum to 100",
    "- evidenceSnippets include 5-6 actual quotes from the candidate's responses",
    "- strengths and weakAreas are specific and evidence-based",
    "- upgradePlan provides actionable, practical advice",
    "- followUpQuestions are relevant to weak areas identified"
  ].join("\n")

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const cleaned = sanitizeJsonText(text)

  let parsed: Partial<InterviewEvaluationResult>
  try {
    parsed = JSON.parse(cleaned)
  } catch (parseError) {
    console.error("[Evaluate-Interview] Failed to parse Gemini response:", parseError)
    throw new Error("Invalid response format from AI")
  }

  // Validate and construct response with defaults
  const evaluation: InterviewEvaluationResult = {
    overallScore: typeof parsed.overallScore === "number"
      ? Math.max(0, Math.min(100, Math.round(parsed.overallScore)))
      : 70,
    jdCoverage: {
      hit: typeof parsed.jdCoverage?.hit === "number" ? Math.round(parsed.jdCoverage.hit) : 60,
      partial: typeof parsed.jdCoverage?.partial === "number" ? Math.round(parsed.jdCoverage.partial) : 25,
      miss: typeof parsed.jdCoverage?.miss === "number" ? Math.round(parsed.jdCoverage.miss) : 15
    },
    strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0
      ? parsed.strengths.filter(s => typeof s === "string" && s.trim()).slice(0, 4)
      : ["Demonstrated clear communication", "Showed technical competence", "Good problem-solving approach"],
    weakAreas: Array.isArray(parsed.weakAreas) && parsed.weakAreas.length > 0
      ? parsed.weakAreas.filter(w => typeof w === "string" && w.trim()).slice(0, 3)
      : ["Could provide more specific examples", "Work on response structure"],
    evidenceSnippets: Array.isArray(parsed.evidenceSnippets) && parsed.evidenceSnippets.length > 0
      ? parsed.evidenceSnippets.filter(e => e && typeof e.quote === "string" && typeof e.signal === "string").slice(0, 6)
      : questions.slice(0, 3).map((q, idx) => ({
          quote: q.response?.substring(0, 80) + "..." || "Sample response",
          signal: idx === 0 ? "Communication" : idx === 1 ? "Technical" : "Problem Solving",
          strength: true
        })),
    upgradePlan: Array.isArray(parsed.upgradePlan) && parsed.upgradePlan.length > 0
      ? parsed.upgradePlan.filter(u => typeof u === "string" && u.trim()).slice(0, 3)
      : ["Practice STAR method", "Prepare specific metrics", "Work on conciseness"],
    followUpQuestions: Array.isArray(parsed.followUpQuestions) && parsed.followUpQuestions.length > 0
      ? parsed.followUpQuestions.filter(q => typeof q === "string" && q.trim()).slice(0, 4)
      : ["Tell me about a challenging project", "How do you handle feedback?", "Describe your leadership style"]
  }

  return evaluation
}

export async function POST(request: Request) {
  try {
    const raw = await request.text()
    if (!raw) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      )
    }

    let body: Partial<EvaluationRequest>
    try {
      body = JSON.parse(raw)
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 }
      )
    }

    // Validate questions array
    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json(
        { error: "Field 'questions' must be a non-empty array" },
        { status: 400 }
      )
    }

    // Validate each question has required fields
    for (const q of body.questions) {
      if (!q.text || typeof q.text !== "string") {
        return NextResponse.json(
          { error: "Each question must have a 'text' field" },
          { status: 400 }
        )
      }
    }

    // Try to evaluate with Gemini, fall back to mock if unavailable
    let evaluation: InterviewEvaluationResult
    try {
      evaluation = await evaluateWithGemini(
        body.questions,
        body.persona,
        body.jobSummary,
        body.resumeSummary
      )
    } catch (geminiError) {
      console.warn("[Evaluate-Interview] Gemini evaluation failed, using mock data:", geminiError)
      evaluation = generateMockEvaluation(body.questions)
    }

    return NextResponse.json({ evaluation })
  } catch (error) {
    console.error("[Evaluate-Interview] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to evaluate interview" },
      { status: 500 }
    )
  }
}
