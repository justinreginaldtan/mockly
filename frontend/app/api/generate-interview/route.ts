import { NextResponse } from "next/server"

import {
  generateInterviewPlan,
  type InterviewPlan,
  type PersonaConfig,
  type InterviewSetupPayload,
} from "@/lib/gemini"

function validatePayload(body: unknown): InterviewSetupPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body")
  }

  const record = body as Record<string, unknown>
  const persona = record.persona as Record<string, unknown> | undefined
  const resumeSummary = record.resumeSummary
  const jobSummary = record.jobSummary

  if (!persona || typeof persona !== "object") {
    throw new Error("Missing persona configuration")
  }

  const requiredFields: Array<keyof PersonaConfig> = [
    "personaId",
    "company",
    "role",
    "focusAreas",
    "technicalWeight",
    "duration",
  ]

  for (const field of requiredFields) {
    if (persona[field] === undefined || persona[field] === null) {
      throw new Error(`Persona field "${field}" is required`)
    }
  }

  const payload: InterviewSetupPayload = {
    persona: {
      personaId: String(persona.personaId),
      company: String(persona.company),
      role: String(persona.role),
      focusAreas: Array.isArray(persona.focusAreas)
        ? persona.focusAreas.map((item) => String(item))
        : String(persona.focusAreas ?? "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
      voiceStyle: persona.voiceStyle ? String(persona.voiceStyle) : undefined,
      voiceStyleId: persona.voiceStyleId ? String(persona.voiceStyleId) : undefined,
      technicalWeight: Number(persona.technicalWeight),
      duration: persona.duration === "short" ? "short" : "standard",
      additionalContext: persona.additionalContext ? String(persona.additionalContext) : undefined,
    },
    resumeSummary: resumeSummary ? String(resumeSummary) : undefined,
    jobSummary: jobSummary ? String(jobSummary) : undefined,
  }

  if (payload.persona.focusAreas.length === 0) {
    payload.persona.focusAreas = []
  }

  return payload
}

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return new NextResponse(null, { status: 405, headers: { Allow: "POST" } })
  }

  try {
    const raw = await request.text()
    if (!raw) {
      return NextResponse.json(
        { success: false, error: "Request body is required." },
        { status: 400 },
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Request body must be valid JSON." },
        { status: 400 },
      )
    }

    const { persona, resumeSummary, jobSummary } = validatePayload(parsed)

    const plan: InterviewPlan = await generateInterviewPlan(persona, resumeSummary, jobSummary)

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error("generate-interview error", error)
    const message = error instanceof Error ? error.message : "Failed to generate interview questions"
    const status = message.toLowerCase().includes("persona") || message.toLowerCase().includes("invalid") ? 400 : 500

    return NextResponse.json({ success: false, error: message }, { status })
  }
}
