import { GoogleGenerativeAI } from "@google/generative-ai"

export type LlmProvider = "gemini" | "openai"

type GenerateTextOptions = {
  primaryProvider?: LlmProvider
  geminiModels?: string[]
  openAiModel?: string
  systemPrompt?: string
  temperature?: number
}

type LlmTextResult = {
  provider: LlmProvider
  text: string
}

const DEFAULT_GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  process.env.GEMINI_MODEL_ID,
  "gemini-2.5-flash",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash-latest",
].filter((value): value is string => Boolean(value && value.trim()))

const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini"

function providerOrder(primaryProvider?: LlmProvider): LlmProvider[] {
  const configuredPrimary: LlmProvider =
    primaryProvider || (process.env.AI_PRIMARY_PROVIDER === "gemini" ? "gemini" : "openai")
  return configuredPrimary === "openai" ? ["openai", "gemini"] : ["gemini", "openai"]
}

function sanitizeJsonishText(text: string): string {
  return text
    .replace(/^```[a-zA-Z]*\n?/g, "")
    .replace(/```\s*$/g, "")
    .trim()
}

async function runGemini(prompt: string, options: GenerateTextOptions): Promise<LlmTextResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error("gemini key unavailable")
  }
  const client = new GoogleGenerativeAI(apiKey)
  const models = options.geminiModels && options.geminiModels.length > 0 ? options.geminiModels : DEFAULT_GEMINI_MODELS

  let lastError: unknown
  for (const modelName of models) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: options.temperature ?? 0.2 },
      })
      const fullPrompt = options.systemPrompt
        ? `${options.systemPrompt}\n\n${prompt}`
        : prompt
      const result = await model.generateContent(fullPrompt)
      const text = sanitizeJsonishText(result.response.text())
      if (!text) {
        throw new Error("empty gemini response")
      }
      return { provider: "gemini", text }
    } catch (error) {
      lastError = error
      const status = typeof error === "object" && error && "status" in error ? (error as { status?: number }).status : undefined
      if (status !== 404) {
        break
      }
    }
  }

  throw lastError ?? new Error("gemini request failed")
}

async function runOpenAi(prompt: string, options: GenerateTextOptions): Promise<LlmTextResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("openai key unavailable")
  }

  const fullPrompt = options.systemPrompt
    ? `${options.systemPrompt}\n\n${prompt}`
    : prompt

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.openAiModel || DEFAULT_OPENAI_MODEL,
      temperature: options.temperature ?? 0.2,
      messages: [{ role: "user", content: fullPrompt }],
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`openai request failed: ${response.status} ${text}`.slice(0, 300))
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = sanitizeJsonishText(payload.choices?.[0]?.message?.content || "")
  if (!text) {
    throw new Error("empty openai response")
  }

  return { provider: "openai", text }
}

export async function generateLlmText(prompt: string, options: GenerateTextOptions = {}): Promise<LlmTextResult> {
  const errors: string[] = []

  for (const provider of providerOrder(options.primaryProvider)) {
    try {
      if (provider === "gemini") {
        return await runGemini(prompt, options)
      }
      return await runOpenAi(prompt, options)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${provider}: ${message}`)
    }
  }

  throw new Error(`No LLM provider succeeded (${errors.join(" | ")})`)
}
