import { NextResponse } from "next/server"
import { ELEVENLABS_MODEL_ID, getVoiceStyleOption } from "@/lib/voices"
import { sanitizeTextForTTS } from "@/lib/text-sanitizer"

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? ""
const ELEVENLABS_BASE_URL = process.env.ELEVENLABS_BASE_URL ?? "https://api.elevenlabs.io"

interface SayRequestPayload {
  text?: string
  voice?: string // maps to VoiceStyleOption id
}


async function synthesizeOnce(text: string, voiceId: string): Promise<Response> {
  return fetch(`${ELEVENLABS_BASE_URL}/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL_ID,
    }),
  })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as SayRequestPayload
    const rawText = (body?.text ?? "").trim()
    const voiceStyleId = (body?.voice ?? "").trim() || undefined

    if (!rawText) {
      return NextResponse.json({ error: "Field 'text' is required." }, { status: 400 })
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "ElevenLabs API key missing" }, { status: 503 })
    }

    // Sanitize text for TTS
    const text = sanitizeTextForTTS(rawText)
    
    // Log sanitization for debugging
    if (text !== rawText) {
      console.log("[Voice-Say] Text sanitized:", {
        original: rawText.substring(0, 100) + (rawText.length > 100 ? "..." : ""),
        sanitized: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        lengthChange: rawText.length - text.length
      })
    }

    if (!text) {
      return NextResponse.json({ error: "Text became empty after sanitization" }, { status: 400 })
    }

    const style = getVoiceStyleOption(voiceStyleId)

    const maxAttempts = 3
    let lastError: string | null = null

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const res = await synthesizeOnce(text, style.elevenLabsVoiceId)
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer()
        return new Response(Buffer.from(arrayBuffer), {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        })
      }
      lastError = await res.text().catch(() => `HTTP ${res.status}`)
      // Exponential backoff: 200ms, 400ms
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 200 * attempt))
      }
    }

    return NextResponse.json({ error: lastError || "Failed to synthesize speech" }, { status: 502 })
  } catch (error) {
    console.error("voice-say error", error)
    return NextResponse.json({ error: "Failed to synthesize speech" }, { status: 500 })
  }
}


