export interface VoiceStyleOption {
  id: string
  label: string
  elevenLabsVoiceId: string
  previewText: string
  greetingText: string
  description?: string
  badge?: string
  voiceSettings?: {
    stability?: number
    similarityBoost?: number
    style?: number
  }
}

export interface PersonaVoiceConfig extends VoiceStyleOption {
  styleId: string
}

export const VOICE_STYLE_OPTIONS: VoiceStyleOption[] = [
  {
    id: "mentor",
    label: "Mentor · Calm guidance",
    elevenLabsVoiceId: "1t1EeRixsJrKbiF1zwM6",
    previewText: "Hey there! I'm Avery, your calm technical mentor. Let's walk through your stories together and dig into the impact you drove.",
    greetingText: "Hey there! I'm Avery, your Google mentor for today. Take a breath and get ready to walk me through your proudest work.",
    description: "Measured pace, warm tone. Great for easing nerves before day-of interview.",
    badge: "Avery · Mentor",
    voiceSettings: {
      stability: 0.45,
      similarityBoost: 0.75,
      style: 0.2,
    },
  },
  {
    id: "recruiter",
    label: "Recruiter · Energetic",
    elevenLabsVoiceId: "kPzsL2i3teMYv0FxEYQ6",
    previewText: "Hi! I'm Britney, your high-energy recruiter. I'm here to keep the pace up and get you ready for that first-round screen.",
    greetingText: "Hi there! Britney here—I'm running this mock screen like a fast-paced recruiter. Ready when you are!",
    description: "Upbeat, keeps momentum high to mirror real phone-screens.",
    badge: "Britney · Recruiter",
    voiceSettings: {
      stability: 0.3,
      similarityBoost: 0.85,
      style: 0.45,
    },
  },
  {
    id: "principal",
    label: "Principal Engineer · Direct",
    elevenLabsVoiceId: "xMagNCpMgZ83QOEsHNre",
    previewText: "This is Arjun, your principal engineer mock interviewer. Expect direct questions and thoughtful follow-ups.",
    greetingText: "Arjun here. I'm treating this like a principal engineer loop—let's focus on clarity and depth in your answers.",
    description: "Fast-paced and analytical, tests your confidence under pressure.",
    badge: "Arjun · Principal",
    voiceSettings: {
      stability: 0.55,
      similarityBoost: 0.6,
      style: 0.1,
    },
  },
  {
    id: "security-coach",
    label: "Security Coach · Measured",
    elevenLabsVoiceId: "xMagNCpMgZ83QOEsHNre",
    previewText: "Hi, I’m your Cisco SOC lead today. Let’s walk through your containment calls and automation wins together.",
    greetingText: "Thanks for joining. I’ll treat this like a Cisco escalation—walk me through the incident and what you recommended.",
    description: "Calm, analytical cadence that mirrors incident-review debriefs.",
    badge: "Cisco SOC mentor",
    voiceSettings: {
      stability: 0.6,
      similarityBoost: 0.55,
      style: 0.18,
    },
  },
]

export const PERSONA_VOICE_DEFAULTS: Record<string, VoiceStyleOption["id"]> = {
  "google-analyst": "mentor",
  "amazon-pm": "recruiter",
  "meta-swe": "principal",
  "cisco-soc": "security-coach",
}

const voiceLookup = new Map(VOICE_STYLE_OPTIONS.map((option) => [option.id, option]))

export const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? "eleven_monolingual_v1"

export function getVoiceStyleOption(id: string | undefined | null): VoiceStyleOption {
  if (!id) {
    return VOICE_STYLE_OPTIONS[0]
  }
  return voiceLookup.get(id) ?? VOICE_STYLE_OPTIONS[0]
}

export function resolvePersonaVoice(personaId: string, overrideStyleId?: string): PersonaVoiceConfig {
  const styleId = overrideStyleId ?? PERSONA_VOICE_DEFAULTS[personaId] ?? VOICE_STYLE_OPTIONS[0].id
  const style = getVoiceStyleOption(styleId)
  return {
    ...style,
    styleId,
  }
}

export function hasElevenLabsApiKey(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim().length > 0)
}
