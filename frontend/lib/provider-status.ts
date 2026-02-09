import { ELEVENLABS_MODEL_ID, hasElevenLabsApiKey } from "@/lib/voices"

export type ProviderMode = "live" | "fallback"

export type ProviderStatusPayload = {
  checkedAt: string
  llm: {
    primary: "gemini" | "openai"
    geminiConfigured: boolean
    openAiConfigured: boolean
    mode: ProviderMode
    reasonCode?: string
  }
  voice: {
    elevenLabsConfigured: boolean
    modelId: string
    modelFreeTierCompatible: boolean
    mode: ProviderMode
    reasonCode?: string
    browserFallbackAvailable: true
  }
}

const LEGACY_FREE_TIER_MODELS = new Set([
  "eleven_monolingual_v1",
  "eleven_multilingual_v1",
])

export function resolveProviderStatus(): ProviderStatusPayload {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY)
  const llmPrimary = (process.env.AI_PRIMARY_PROVIDER === "gemini" ? "gemini" : "openai") as
    | "gemini"
    | "openai"
  const llmMode: ProviderMode = geminiConfigured || openAiConfigured ? "live" : "fallback"

  const modelId = ELEVENLABS_MODEL_ID
  const modelFreeTierCompatible = !LEGACY_FREE_TIER_MODELS.has(modelId)
  const elevenLabsConfigured = hasElevenLabsApiKey()
  const voiceMode: ProviderMode = elevenLabsConfigured && modelFreeTierCompatible ? "live" : "fallback"

  return {
    checkedAt: new Date().toISOString(),
    llm: {
      primary: llmPrimary,
      geminiConfigured,
      openAiConfigured,
      mode: llmMode,
      reasonCode: llmMode === "fallback" ? "NO_LLM_API_KEY" : undefined,
    },
    voice: {
      elevenLabsConfigured,
      modelId,
      modelFreeTierCompatible,
      mode: voiceMode,
      reasonCode:
        !elevenLabsConfigured
          ? "NO_ELEVENLABS_KEY"
          : !modelFreeTierCompatible
            ? "ELEVENLABS_MODEL_FREE_TIER_INCOMPATIBLE"
            : undefined,
      browserFallbackAvailable: true,
    },
  }
}
