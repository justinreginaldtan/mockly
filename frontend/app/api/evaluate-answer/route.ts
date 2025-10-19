import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

type EvaluationResult = {
  empathy: number
  clarity: number
  resolution: number
  tip: string
  summary: string
}

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(100, Math.round(num)))
}

function sanitizeJsonText(text: string): string {
  return text
    .replace(/^```[a-zA-Z]*\n?/g, "")
    .replace(/```\s*$/g, "")
    .trim()
}

function heuristicFallback(question: string, answer: string): EvaluationResult {
  const lengthScore = Math.max(0, Math.min(100, Math.floor((answer.trim().split(/\s+/).length / 120) * 100)))
  const hasApology = /sorry|apologize|apologies/i.test(answer) ? 15 : 0
  const hasPlan = /I can|I'll|let me|next|step|plan|here's/i.test(answer) ? 20 : 0
  const hasClarityMarkers = /first|second|finally|summary|in summary|to clarify/i.test(answer) ? 15 : 0

  const empathy = clampScore(40 + hasApology)
  const clarity = clampScore(35 + hasClarityMarkers)
  const resolution = clampScore(30 + hasPlan + Math.floor(lengthScore * 0.2))
  const tip = hasApology === 0 ? "Acknowledge the customer's feelings before outlining your plan." : "State a concise step-by-step plan with clear next actions."
  const summary = "Constructive baseline feedback generated due to temporary evaluator unavailability."
  return { empathy, clarity, resolution, tip, summary }
}

export async function POST(request: Request) {
  try {
    const raw = await request.text()
    if (!raw) {
      return NextResponse.json({ error: "Request body is required." }, { status: 400 })
    }
    let question = ""
    let answer = ""
    try {
      const parsed = JSON.parse(raw) as { question?: unknown; answer?: unknown }
      question = typeof parsed.question === "string" ? parsed.question : ""
      answer = typeof parsed.answer === "string" ? parsed.answer : ""
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
    }

    if (!answer.trim()) {
      return NextResponse.json({ error: "Field 'answer' is required." }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      const fallback = heuristicFallback(question, answer)
      return NextResponse.json(fallback, { status: 200 })
    }

    const modelId = process.env.GEMINI_MODEL_ID || "gemini-2.5-flash"
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelId })

    const prompt = [
      "You are a customer-service trainer. Evaluate the trainee’s spoken reply to a customer.",
      "Score empathy, clarity, and resolution 0-100. Give one-sentence summary and one actionable tip.",
      "Respond ONLY in strict JSON with keys: empathy, clarity, resolution, tip, summary.",
      "Do not include any preamble or code fences.",
      "",
      `Customer question: ${question || "(not provided)"}`,
      `Trainee answer: ${answer}`,
    ].join("\n")

    const result = await model.generateContent(prompt)

    const text = result.response.text()
    const cleaned = sanitizeJsonText(text)

    let parsed: Partial<EvaluationResult>
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      const fallback = heuristicFallback(question, answer)
      return NextResponse.json(fallback, { status: 200 })
    }

    const evaluation: EvaluationResult = {
      empathy: clampScore(parsed.empathy),
      clarity: clampScore(parsed.clarity),
      resolution: clampScore(parsed.resolution),
      tip: typeof parsed.tip === "string" && parsed.tip.trim() ? parsed.tip.trim() : "Acknowledge their concern and propose a clear next step.",
      summary: typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : "Clear, empathetic structure recommended.",
    }

    return NextResponse.json(evaluation)
  } catch (error) {
    console.error("evaluate-answer error", error)
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 })
  }
}


