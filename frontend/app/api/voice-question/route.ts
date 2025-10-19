import { NextResponse } from "next/server"

import {
  ELEVENLABS_MODEL_ID,
  hasElevenLabsApiKey,
  resolvePersonaVoice,
  type PersonaVoiceConfig,
} from "@/lib/voices"
import { sanitizeTextForTTS } from "@/lib/text-sanitizer"

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? ""
const ELEVENLABS_BASE_URL = process.env.ELEVENLABS_BASE_URL ?? "https://api.elevenlabs.io"

interface VoiceRequestPayload {
  questionText?: string
  personaId?: string
  voiceStyleId?: string
  preview?: boolean
}

function toBase64AudioUrl(buffer: ArrayBuffer, mimeType = "audio/mpeg"): string {
  const base64 = Buffer.from(buffer).toString("base64")
  return `data:${mimeType};base64,${base64}`
}

function resolveVoiceConfig(payload: VoiceRequestPayload): { text: string; voice: PersonaVoiceConfig } {
  const voice = resolvePersonaVoice(payload.personaId ?? "google-analyst", payload.voiceStyleId)
  const trimmed = payload.questionText?.trim()

  if (trimmed && trimmed.length > 0) {
    return { text: sanitizeTextForTTS(trimmed), voice }
  }

  if (payload.preview) {
    return { text: sanitizeTextForTTS(voice.previewText), voice }
  }

  return { text: sanitizeTextForTTS(voice.greetingText), voice }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VoiceRequestPayload
    const { text, voice } = resolveVoiceConfig(body)

    if (!text) {
      return NextResponse.json(
        { success: false, error: "No text provided for synthesis." },
        { status: 400 },
      )
    }

    if (!hasElevenLabsApiKey()) {
      return NextResponse.json({
        success: true,
        mocked: true,
        text,
        audioUrl: null,
        voiceStyleId: voice.styleId,
        voiceLabel: voice.label,
      })
    }

    const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/text-to-speech/${voice.elevenLabsVoiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: voice.voiceSettings?.stability ?? 0.5,
          similarity_boost: voice.voiceSettings?.similarityBoost ?? 0.75,
          style: voice.voiceSettings?.style ?? 0.15,
        },
      }),
    })

    if (!response.ok) {
      const message = await response.text().catch(() => "Failed to generate audio with ElevenLabs.")
      return NextResponse.json(
        {
          success: false,
          error: message || "Failed to generate audio with ElevenLabs.",
        },
        { status: 502 },
      )
    }

    const arrayBuffer = await response.arrayBuffer()

    return NextResponse.json({
      success: true,
      audioUrl: toBase64AudioUrl(arrayBuffer),
      voiceStyleId: voice.styleId,
      voiceLabel: voice.label,
      text,
    })
  } catch (error) {
    console.error("voice-question error", error)
    return NextResponse.json({ success: false, error: "Failed to generate voice" }, { status: 500 })
  }
}
