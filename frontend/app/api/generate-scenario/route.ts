import { NextResponse } from "next/server"
import { generateLlmText } from "@/lib/llm"
import { recoverJsonCandidate } from "@/lib/json-recovery"

type Difficulty = "easy" | "medium" | "hard" | "nightmare"

interface GenerateScenarioBody {
  difficulty?: Difficulty
}

interface ScenarioResponse {
  id: string
  prompt: string
  rubric: string
  difficulty: Difficulty
}

const FALLBACK_SCENARIOS: Record<Difficulty, Array<Omit<ScenarioResponse, "id" | "difficulty">>> = {
  easy: [
    {
      prompt:
        "Hi, I was charged twice for my monthly subscription and I’m not sure why. Can you help me fix this?",
      rubric:
        "Acknowledge concern, confirm account details, explain refund timeline, and share the exact next step.",
    },
    {
      prompt:
        "My order arrived one day late and I needed it for an event. What can you do to make this right?",
      rubric:
        "Show empathy, offer concrete remediation (refund/credit), and confirm follow-up details.",
    },
  ],
  medium: [
    {
      prompt:
        "I’ve spoken to support twice and my issue still isn’t resolved. I need a clear answer today.",
      rubric:
        "De-escalate calmly, summarize history, provide a definitive action plan, and set a clear callback window.",
    },
    {
      prompt:
        "Your app deleted part of my saved work after an update. I’m frustrated and need this recovered.",
      rubric:
        "Validate impact, investigate facts, propose immediate mitigation, and explain prevention/ownership.",
    },
  ],
  hard: [
    {
      prompt:
        "I’m a long-time customer and this is the third billing issue this quarter. Why should I stay?",
      rubric:
        "Acknowledge trust loss, take accountability, propose retention offer with specifics, and commit to proactive check-in.",
    },
    {
      prompt:
        "Your team promised this fix last week and it still isn’t done. I want a manager and a real deadline.",
      rubric:
        "Address urgency, avoid defensiveness, give transparent status, offer escalation path, and confirm delivery date.",
    },
  ],
  nightmare: [
    {
      prompt:
        "I’m canceling everything right now. This failure cost my business money and no one is taking responsibility.",
      rubric:
        "Stay composed, acknowledge business impact, outline immediate containment + escalation, and offer concrete restitution options.",
    },
    {
      prompt:
        "I already posted about this publicly and I’m getting legal involved if this isn’t fixed today.",
      rubric:
        "Maintain professionalism, avoid legal overpromises, route to proper escalation immediately, and set documented next milestones.",
    },
  ],
}

function isValidDifficulty(value: unknown): value is Difficulty {
  return value === "easy" || value === "medium" || value === "hard" || value === "nightmare"
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function fallbackScenario(difficulty: Difficulty): ScenarioResponse {
  const pool = FALLBACK_SCENARIOS[difficulty]
  const chosen = pool[Math.floor(Math.random() * pool.length)] ?? FALLBACK_SCENARIOS.easy[0]

  return {
    id: generateId(),
    prompt: chosen.prompt,
    rubric: chosen.rubric,
    difficulty,
  }
}

export async function POST(request: Request) {
  let difficulty: Difficulty = "easy"

  try {
    const raw = await request.text()

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as GenerateScenarioBody
        if (parsed && isValidDifficulty(parsed.difficulty)) {
          difficulty = parsed.difficulty
        }
      } catch {
        // Ignore body parse errors; fallback to default difficulty
      }
    }

    const hasAnyProviderKey = Boolean(
      process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY
    )
    if (!hasAnyProviderKey) {
      return NextResponse.json({ ...fallbackScenario(difficulty), mode: "fallback", reasonCode: "NO_LLM_API_KEY" }, { status: 200 })
    }

    const systemPrompt = [
      "Generate a short, realistic customer-service situation for training.",
      "Difficulty levels: easy, medium, hard, nightmare.",
      "Each prompt should be 1-3 sentences spoken by the customer, expressing emotion matching the difficulty.",
      "Return strictly JSON with keys: id, prompt, rubric, difficulty.",
      "- id: a short unique string identifier",
      "- prompt: the customer-spoken scenario (1-3 sentences)",
      "- rubric: a concise coaching rubric on how to respond (1-3 lines)",
      "- difficulty: echo the provided difficulty",
    ].join("\n")

    const userPrompt = `difficulty: ${difficulty}`

    const result = await generateLlmText(`${systemPrompt}\n\n${userPrompt}`, {
      geminiModels: [
        process.env.GEMINI_MODEL_ID || "",
        process.env.GEMINI_MODEL || "",
        "gemini-2.5-flash",
      ].filter(Boolean),
      openAiModel: process.env.OPENAI_MODEL || "gpt-5-mini",
      temperature: 0.2,
    })
    const parsed = recoverJsonCandidate<ScenarioResponse>(result.text)
    if (!parsed) {
      return NextResponse.json({ ...fallbackScenario(difficulty), mode: "fallback", reasonCode: "INVALID_MODEL_JSON" }, { status: 200 })
    }

    // Final validation and normalization
    const scenario: ScenarioResponse = {
      id: parsed.id && typeof parsed.id === "string" ? parsed.id : generateId(),
      prompt: typeof parsed.prompt === "string" ? parsed.prompt.trim() : "",
      rubric: typeof parsed.rubric === "string" ? parsed.rubric.trim() : "",
      difficulty: isValidDifficulty(parsed.difficulty) ? parsed.difficulty : difficulty,
    }

    if (!scenario.prompt) {
      return NextResponse.json({ ...fallbackScenario(difficulty), mode: "fallback", reasonCode: "INVALID_SCENARIO_CONTENT" }, { status: 200 })
    }

    return NextResponse.json({ ...scenario, mode: "live" })
  } catch (error) {
    console.error("generate-scenario error", error)
    return NextResponse.json(
      { ...fallbackScenario(difficulty), mode: "fallback", reasonCode: "GENERATION_FAILED" },
      { status: 200 },
    )
  }
}
