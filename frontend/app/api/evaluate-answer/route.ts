import { NextResponse } from "next/server"
import { generateLlmText } from "@/lib/llm"
import { recoverJsonCandidate } from "@/lib/json-recovery"

type EvaluationResult = {
  empathy: number
  clarity: number
  resolution: number
  tip: string
  summary: string
  tips: string[]
  idealResponse: string
}

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(100, Math.round(num)))
}

function generatePerfectAnswer(question: string): EvaluationResult {
  console.log("[Evaluate-Answer] Generating perfect answer for dev/test mode")
  
  return {
    empathy: 100,
    clarity: 100,
    resolution: 100,
    tip: "Perfect! Follow this structure exactly.",
    summary: "Excellent response demonstrating all key customer service principles.",
    tips: [
      "Perfect! Follow this structure exactly.",
      "This response shows ideal empathy, clarity, and resolution.",
      "Use this as your template for similar situations."
    ],
    idealResponse: generateIdealResponse(question)
  }
}

function generateIdealResponse(question: string): string {
  // Generate context-aware ideal responses based on common scenario types
  const lowerQuestion = question.toLowerCase()
  
  if (lowerQuestion.includes("refund") || lowerQuestion.includes("return")) {
    return "I completely understand your frustration with this issue, and I'm sorry for any inconvenience this has caused. Let me help you get this resolved right away. I'll process your refund immediately and you should see the credit back in your account within 3-5 business days. I'll also send you a confirmation email with all the details. Is there anything else I can help you with today?"
  }
  
  if (lowerQuestion.includes("delayed") || lowerQuestion.includes("late") || lowerQuestion.includes("shipping")) {
    return "I sincerely apologize for the delay with your order. I understand how frustrating it is when something doesn't arrive when expected. Let me check the status right now and get you an updated delivery timeline. I'll also expedite the shipping at no extra cost to you. You'll receive a tracking update within the hour. Thank you for your patience, and I want to make sure this gets resolved for you today."
  }
  
  if (lowerQuestion.includes("broken") || lowerQuestion.includes("defective") || lowerQuestion.includes("not working")) {
    return "I'm so sorry to hear that the product isn't working as expected. That's definitely not the experience we want you to have. Let me help you troubleshoot this right away, and if we can't get it working, I'll arrange for a replacement or full refund - whichever you prefer. Can you tell me what specific issues you're experiencing so I can provide the best solution?"
  }
  
  if (lowerQuestion.includes("billing") || lowerQuestion.includes("charge") || lowerQuestion.includes("payment")) {
    return "I understand your concern about the billing issue, and I want to make sure we get this sorted out for you right away. Let me review your account and the charges in question. I'll explain exactly what happened and work with you to resolve any discrepancies. Your satisfaction is our priority, and I'll make sure you're completely comfortable with the resolution before we end our conversation."
  }
  
  if (lowerQuestion.includes("cancel") || lowerQuestion.includes("subscription")) {
    return "I understand you'd like to cancel your subscription, and I want to make sure I understand your reasons so we can address any concerns you might have. While I can certainly help you cancel today, I'd also like to see if there's anything we can do to improve your experience. Let me walk you through your options, and then I'll respect whatever decision you make."
  }
  
  // Default ideal response for general customer service scenarios
  return "Thank you for bringing this to my attention. I completely understand your concern, and I want to make sure we get this resolved for you right away. Let me help you by [specific action based on their issue]. I'll follow up with you within [timeframe] to ensure everything is working properly and you're completely satisfied. Is there anything else I can help you with today?"
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
  
  const tips = [
    "Acknowledge the customer's frustration explicitly.",
    "Summarize their issue before suggesting a solution.",
    "Confirm the resolution before closing."
  ]
  
  const idealResponse = "Thank you for bringing this to my attention. I understand your frustration with [specific issue]. Let me help you resolve this by [specific action]. I'll follow up with you in [timeframe] to ensure everything is working properly."
  
  return { empathy, clarity, resolution, tip, summary, tips, idealResponse }
}

export async function POST(request: Request) {
  try {
    const raw = await request.text()
    if (!raw) {
      return NextResponse.json({ error: "Request body is required." }, { status: 400 })
    }
    
    let question = ""
    let answer = ""
    let demoPerfect = false
    
    try {
      const parsed = JSON.parse(raw) as { 
        question?: unknown
        answer?: unknown
        demoPerfect?: unknown
      }
      question = typeof parsed.question === "string" ? parsed.question : ""
      answer = typeof parsed.answer === "string" ? parsed.answer : ""
      demoPerfect = Boolean(parsed.demoPerfect)
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
    }

    if (!answer.trim()) {
      return NextResponse.json({ error: "Field 'answer' is required." }, { status: 400 })
    }

    // Check for dev/test mode via query params or demoPerfect flag
    const url = new URL(request.url)
    const queryDemoPerfect = url.searchParams.get('demoPerfect') === 'true'
    const isDevMode = demoPerfect || queryDemoPerfect
    
    if (isDevMode) {
      console.log("[Evaluate-Answer] Dev/test mode detected - returning perfect scores")
      const perfectAnswer = generatePerfectAnswer(question)
      return NextResponse.json(perfectAnswer, { status: 200 })
    }

    const hasAnyProviderKey = Boolean(
      process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY
    )
    if (!hasAnyProviderKey) {
      const fallback = heuristicFallback(question, answer)
      return NextResponse.json(fallback, { status: 200 })
    }

    const prompt = [
      "You are a customer-service trainer. Evaluate the trainee's spoken reply to a customer.",
      "Score empathy, clarity, and resolution 0-100. Provide detailed feedback with specific tips and an ideal response example.",
      "Respond ONLY in strict JSON with keys: empathy, clarity, resolution, tip, summary, tips, idealResponse.",
      "Do not include any preamble or code fences.",
      "",
      "JSON structure:",
      "{",
      '  "empathy": 60,',
      '  "clarity": 70,',
      '  "resolution": 50,',
      '  "tip": "Main actionable advice",',
      '  "summary": "Overall assessment",',
      '  "tips": ["Tip 1", "Tip 2", "Tip 3"],',
      '  "idealResponse": "Example of ideal response..."',
      "}",
      "",
      `Customer question: ${question || "(not provided)"}`,
      `Trainee answer: ${answer}`,
    ].join("\n")

    try {
      const result = await generateLlmText(prompt, {
        geminiModels: [
          process.env.GEMINI_MODEL_ID || "",
          process.env.GEMINI_MODEL || "",
          "gemini-2.5-flash",
        ].filter(Boolean),
        openAiModel: process.env.OPENAI_MODEL || "gpt-5-mini",
        temperature: 0.2,
      })
      const parsed = recoverJsonCandidate<Partial<EvaluationResult>>(result.text)
      if (!parsed) {
        const fallback = heuristicFallback(question, answer)
        return NextResponse.json({ ...fallback, mode: "fallback", reasonCode: "INVALID_MODEL_JSON" }, { status: 200 })
      }

      const evaluation: EvaluationResult = {
        empathy: clampScore(parsed.empathy),
        clarity: clampScore(parsed.clarity),
        resolution: clampScore(parsed.resolution),
        tip: typeof parsed.tip === "string" && parsed.tip.trim() ? parsed.tip.trim() : "Acknowledge their concern and propose a clear next step.",
        summary: typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : "Clear, empathetic structure recommended.",
        tips: Array.isArray(parsed.tips) && parsed.tips.length > 0
          ? parsed.tips.filter((tip) => typeof tip === "string" && tip.trim()).slice(0, 3)
          : ["Acknowledge the customer's feelings", "Be specific about next steps", "Confirm understanding"],
        idealResponse: typeof parsed.idealResponse === "string" && parsed.idealResponse.trim()
          ? parsed.idealResponse.trim()
          : "Thank you for bringing this to my attention. I understand your concern and will help you resolve this issue.",
      }

      return NextResponse.json({ ...evaluation, mode: "live" })
    } catch (error) {
      console.error("[Evaluate-Answer] LLM evaluation failed, using heuristic fallback", error)
      const fallback = heuristicFallback(question, answer)
      return NextResponse.json({ ...fallback, mode: "fallback", reasonCode: "EVALUATION_FAILED" }, { status: 200 })
    }
  } catch (error) {
    console.error("evaluate-answer error", error)
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 })
  }
}
