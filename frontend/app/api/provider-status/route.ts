import { NextResponse } from "next/server"
import { resolveProviderStatus } from "@/lib/provider-status"

export async function GET() {
  try {
    return NextResponse.json(resolveProviderStatus())
  } catch (error) {
    console.error("provider-status error", error)
    return NextResponse.json(
      {
        checkedAt: new Date().toISOString(),
        llm: {
          primary: "openai",
          geminiConfigured: false,
          openAiConfigured: false,
          mode: "fallback",
          reasonCode: "PROVIDER_STATUS_UNAVAILABLE",
        },
        voice: {
          elevenLabsConfigured: false,
          modelId: "unknown",
          modelFreeTierCompatible: false,
          mode: "fallback",
          reasonCode: "PROVIDER_STATUS_UNAVAILABLE",
          browserFallbackAvailable: true,
        },
      },
      { status: 200 },
    )
  }
}
