export type VoiceErrorCode =
  | "VOICE_TEXT_REQUIRED"
  | "VOICE_PROVIDER_UNAVAILABLE"
  | "VOICE_PROVIDER_RATE_LIMIT"
  | "VOICE_PROVIDER_PAYMENT_REQUIRED"
  | "VOICE_PROVIDER_MODEL_UNAVAILABLE"
  | "VOICE_REQUEST_FAILED"

export type VoiceApiError = {
  success: false
  provider: "elevenlabs"
  code: VoiceErrorCode
  message: string
  fallbackAvailable: true
}

type ElevenLabsErrorShape = {
  detail?: {
    status?: string
    message?: string
  }
}

function readJsonError(text: string): ElevenLabsErrorShape | null {
  try {
    return JSON.parse(text) as ElevenLabsErrorShape
  } catch {
    return null
  }
}

export function mapElevenLabsError(status: number, rawBody: string): VoiceApiError {
  const parsed = readJsonError(rawBody)
  const providerStatus = parsed?.detail?.status || ""
  const providerMessage = parsed?.detail?.message || rawBody || "Voice provider request failed."

  if (status === 429 || providerStatus === "rate_limit_exceeded") {
    return {
      success: false,
      provider: "elevenlabs",
      code: "VOICE_PROVIDER_RATE_LIMIT",
      message: "Voice service is being rate-limited right now. Using browser voice fallback.",
      fallbackAvailable: true,
    }
  }

  if (status === 402 || providerStatus === "payment_required") {
    return {
      success: false,
      provider: "elevenlabs",
      code: "VOICE_PROVIDER_PAYMENT_REQUIRED",
      message: "Current ElevenLabs plan cannot use this voice. Using browser voice fallback.",
      fallbackAvailable: true,
    }
  }

  if (providerStatus === "model_deprecated_free_tier") {
    return {
      success: false,
      provider: "elevenlabs",
      code: "VOICE_PROVIDER_MODEL_UNAVAILABLE",
      message: "Configured ElevenLabs model is unavailable on free tier. Using browser voice fallback.",
      fallbackAvailable: true,
    }
  }

  return {
    success: false,
    provider: "elevenlabs",
    code: "VOICE_REQUEST_FAILED",
    message: providerMessage.slice(0, 300),
    fallbackAvailable: true,
  }
}
