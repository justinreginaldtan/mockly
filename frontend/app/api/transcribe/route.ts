import { NextResponse } from "next/server"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ""
const OPENAI_TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1"

type OpenAiTranscriptionResponse = {
  text?: string
}

export async function POST(request: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured for audio transcription." },
        { status: 503 },
      )
    }

    const incomingFormData = await request.formData()
    const audio = incomingFormData.get("audio")
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Field 'audio' is required." }, { status: 400 })
    }
    if (audio.size === 0) {
      return NextResponse.json({ error: "Uploaded audio is empty." }, { status: 400 })
    }

    const upstreamFormData = new FormData()
    upstreamFormData.append("file", audio, audio.name || "response.webm")
    upstreamFormData.append("model", OPENAI_TRANSCRIPTION_MODEL)
    upstreamFormData.append("language", "en")

    const upstreamResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: upstreamFormData,
    })

    const upstreamRaw = await upstreamResponse.text()
    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          error: "OpenAI transcription request failed.",
          detail: upstreamRaw.slice(0, 300),
        },
        { status: 502 },
      )
    }

    let parsed: OpenAiTranscriptionResponse | null = null
    try {
      parsed = JSON.parse(upstreamRaw) as OpenAiTranscriptionResponse
    } catch {
      return NextResponse.json({ error: "Transcription response could not be parsed." }, { status: 502 })
    }

    const text = typeof parsed.text === "string" ? parsed.text.trim() : ""
    if (!text) {
      return NextResponse.json({ error: "Transcription returned empty text." }, { status: 502 })
    }

    return NextResponse.json({ text, mode: "live" })
  } catch (error) {
    console.error("transcribe error", error)
    return NextResponse.json({ error: "Failed to transcribe audio." }, { status: 500 })
  }
}
