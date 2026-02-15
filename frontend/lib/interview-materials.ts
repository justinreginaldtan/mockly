export type PersonaId = "google-analyst" | "amazon-pm" | "meta-swe" | "cisco-soc"

export type FocusAreaId =
  | "leadership"
  | "adaptability"
  | "teamwork"
  | "timeManagement"
  | "systemDesign"
  | "productThinking"
  | "communication"

export type ResumeFileType = "pdf" | "docx" | "txt"

export interface ResumeParseResult {
  fileName: string
  fileType: ResumeFileType
  summary: string
  skills: string[]
  experienceSignals: string[]
}

export interface JobListingInput {
  jobText: string
  jobUrl?: string
  summary: string
}

export interface TailoringRecommendation {
  recommendedPersonaId: PersonaId
  recommendedFocusAreas: FocusAreaId[]
  recommendedTechnicalWeight: number
  additionalContext: string
  reasoningBullets: string[]
  roleHint?: string
  companyHint?: string
}

export interface MaterialsSessionPayload {
  version: "v1"
  createdAt: number
  resume: ResumeParseResult
  job: JobListingInput
  tailoring: TailoringRecommendation
}

export interface MaterialsHistoryItem {
  id: string
  createdAt: number
  resumeFileName: string
  resumeSummary: string
  jobSummary: string
  jobUrl?: string
  roleHint?: string
  companyHint?: string
  recommendedPersonaId: PersonaId
  recommendedFocusAreas: FocusAreaId[]
  recommendedTechnicalWeight: number
  additionalContext: string
}

export const PERSONA_IDS: readonly PersonaId[] = ["google-analyst", "amazon-pm", "meta-swe", "cisco-soc"]

export const FOCUS_AREA_IDS: readonly FocusAreaId[] = [
  "leadership",
  "adaptability",
  "teamwork",
  "timeManagement",
  "systemDesign",
  "productThinking",
  "communication",
]

export const PERSONA_FOCUS_DEFAULTS: Record<PersonaId, FocusAreaId[]> = {
  "google-analyst": ["communication", "productThinking", "adaptability"],
  "amazon-pm": ["leadership", "productThinking", "communication"],
  "meta-swe": ["systemDesign", "leadership", "communication"],
  "cisco-soc": ["timeManagement", "leadership", "communication"],
}

export const PERSONA_TECHNICAL_WEIGHT_DEFAULTS: Record<PersonaId, number> = {
  "google-analyst": 40,
  "amazon-pm": 45,
  "meta-swe": 65,
  "cisco-soc": 60,
}

export function clampTechnicalWeight(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return 50
  return Math.max(0, Math.min(100, Math.round(num)))
}

export function normalizeText(value: string, maxLength = 6000): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength)
}

export function dedupeNonEmpty(values: string[], limit = 8): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const clean = value.trim()
    const key = clean.toLowerCase()
    if (!clean || seen.has(key)) continue
    seen.add(key)
    out.push(clean)
    if (out.length >= limit) break
  }
  return out
}

export function coercePersonaId(value: string | undefined | null): PersonaId {
  const candidate = String(value ?? "").trim() as PersonaId
  if (PERSONA_IDS.includes(candidate)) {
    return candidate
  }
  return "google-analyst"
}

export function coerceFocusAreas(values: string[] | undefined, fallbackPersonaId: PersonaId): FocusAreaId[] {
  if (!Array.isArray(values) || values.length === 0) {
    return PERSONA_FOCUS_DEFAULTS[fallbackPersonaId]
  }

  const filtered = dedupeNonEmpty(values, 7).filter((value): value is FocusAreaId =>
    FOCUS_AREA_IDS.includes(value as FocusAreaId),
  )
  return filtered.length > 0 ? filtered : PERSONA_FOCUS_DEFAULTS[fallbackPersonaId]
}

export function toHistoryItem(payload: MaterialsSessionPayload): MaterialsHistoryItem {
  return {
    id: `${payload.createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: payload.createdAt,
    resumeFileName: payload.resume.fileName,
    resumeSummary: payload.resume.summary,
    jobSummary: payload.job.summary,
    jobUrl: payload.job.jobUrl,
    roleHint: payload.tailoring.roleHint,
    companyHint: payload.tailoring.companyHint,
    recommendedPersonaId: payload.tailoring.recommendedPersonaId,
    recommendedFocusAreas: payload.tailoring.recommendedFocusAreas,
    recommendedTechnicalWeight: payload.tailoring.recommendedTechnicalWeight,
    additionalContext: payload.tailoring.additionalContext,
  }
}

export function historyItemToSession(item: MaterialsHistoryItem): MaterialsSessionPayload {
  const personaId = coercePersonaId(item.recommendedPersonaId)
  return {
    version: "v1",
    createdAt: item.createdAt,
    resume: {
      fileName: item.resumeFileName,
      fileType: "txt",
      summary: normalizeText(item.resumeSummary, 1200),
      skills: [],
      experienceSignals: [],
    },
    job: {
      jobText: item.jobSummary,
      jobUrl: item.jobUrl,
      summary: normalizeText(item.jobSummary, 1200),
    },
    tailoring: {
      recommendedPersonaId: personaId,
      recommendedFocusAreas: coerceFocusAreas(item.recommendedFocusAreas, personaId),
      recommendedTechnicalWeight: clampTechnicalWeight(item.recommendedTechnicalWeight),
      additionalContext: normalizeText(item.additionalContext, 400),
      reasoningBullets: [],
      roleHint: item.roleHint,
      companyHint: item.companyHint,
    },
  }
}
