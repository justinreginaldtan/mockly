import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

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

function sanitizeJsonText(text: string): string {
  // Remove common code-fence wrappers and trim
  return text
    .replace(/^```[a-zA-Z]*\n?/g, "")
    .replace(/```\s*$/g, "")
    .trim()
}

function isValidDifficulty(value: unknown): value is Difficulty {
  return value === "easy" || value === "medium" || value === "hard" || value === "nightmare"
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function POST(request: Request) {
  try {
    const raw = await request.text()
    let difficulty: Difficulty = "easy"

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

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key missing. Set GEMINI_API_KEY or GOOGLE_API_KEY." }, { status: 503 })
    }

    const modelId = process.env.GEMINI_MODEL_ID || "gemini-2.5-flash"
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelId })

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

    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`)

    const text = result.response.text()
    const cleaned = sanitizeJsonText(text)

    let parsed: ScenarioResponse
    try {
      parsed = JSON.parse(cleaned) as ScenarioResponse
    } catch (err) {
      return NextResponse.json({ error: "Gemini returned non-JSON content" }, { status: 503 })
    }

    // Final validation and normalization
    const scenario: ScenarioResponse = {
      id: parsed.id && typeof parsed.id === "string" ? parsed.id : generateId(),
      prompt: typeof parsed.prompt === "string" ? parsed.prompt.trim() : "",
      rubric: typeof parsed.rubric === "string" ? parsed.rubric.trim() : "",
      difficulty: isValidDifficulty(parsed.difficulty) ? parsed.difficulty : difficulty,
    }

    if (!scenario.prompt) {
      return NextResponse.json({ error: "Invalid scenario content" }, { status: 503 })
    }

    return NextResponse.json(scenario)
  } catch (error) {
    console.error("generate-scenario error", error)
    return NextResponse.json({ error: "Failed to generate scenario" }, { status: 503 })
  }
}


