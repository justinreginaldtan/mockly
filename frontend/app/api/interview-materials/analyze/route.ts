import { NextResponse } from "next/server"
import mammoth from "mammoth"
import pdfParse from "pdf-parse/lib/pdf-parse.js"
import { generateLlmText } from "@/lib/llm"
import { recoverJsonCandidate } from "@/lib/json-recovery"
import {
  clampTechnicalWeight,
  coerceFocusAreas,
  coercePersonaId,
  dedupeNonEmpty,
  normalizeText,
  PERSONA_FOCUS_DEFAULTS,
  PERSONA_IDS,
  PERSONA_TECHNICAL_WEIGHT_DEFAULTS,
  type FocusAreaId,
  type MaterialsSessionPayload,
  type PersonaId,
  type ResumeFileType,
} from "@/lib/interview-materials"

export const runtime = "nodejs"

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MIN_RESUME_TEXT_LENGTH = 80

type LlmTailoringResult = {
  resumeSummary?: string
  jobSummary?: string
  skills?: string[]
  experienceSignals?: string[]
  recommendedPersonaId?: string
  recommendedFocusAreas?: string[]
  recommendedTechnicalWeight?: number
  additionalContext?: string
  reasoningBullets?: string[]
  roleHint?: string
  companyHint?: string
}

function detectResumeFileType(file: File): ResumeFileType | null {
  const name = file.name.toLowerCase()
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf"
  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx"
  }
  if (name.endsWith(".txt") || file.type === "text/plain") return "txt"
  return null
}

async function parseResumeText(file: File, fileType: ResumeFileType): Promise<string> {
  const rawBuffer = Buffer.from(await file.arrayBuffer())

  if (fileType === "txt") {
    return rawBuffer.toString("utf-8")
  }

  if (fileType === "pdf") {
    const parsed = await pdfParse(rawBuffer)
    return parsed.text || ""
  }

  const parsedDocx = await mammoth.extractRawText({ buffer: rawBuffer })
  return parsedDocx.value || ""
}

function summarizeText(input: string, fallback: string): string {
  const clean = normalizeText(input, 1800)
  if (!clean) return fallback
  if (clean.length <= 420) return clean
  return `${clean.slice(0, 417)}...`
}

function inferPersonaId(text: string): PersonaId {
  const lower = text.toLowerCase()
  if (
    /\bsecurity\b|\bsoc\b|\bincident\b|\bthreat\b|\bsiem\b|\bcyber\b|\bforensics\b/.test(lower)
  ) {
    return "cisco-soc"
  }
  if (
    /\bproduct manager\b|\bproduct management\b|\broadmap\b|\bgtm\b|\bstakeholder\b|\bamazon\b/.test(lower)
  ) {
    return "amazon-pm"
  }
  if (/\bdata\b|\banalyst\b|\bsql\b|\bdashboard\b|\bmetrics\b|\bexperiment\b/.test(lower)) {
    return "google-analyst"
  }
  if (
    /\bsoftware\b|\bengineer\b|\bsystem design\b|\bbackend\b|\bfrontend\b|\bdistributed\b/.test(lower)
  ) {
    return "meta-swe"
  }
  return "google-analyst"
}

function inferRoleHint(jobText: string): string | undefined {
  const clean = normalizeText(jobText, 600)
  if (!clean) return undefined

  const explicitMatch = clean.match(
    /(role|position|title)\s*[:\-]\s*([A-Za-z0-9/,+&().\-\s]{3,80})/i,
  )
  if (explicitMatch?.[2]) {
    return explicitMatch[2].trim()
  }

  const atMatch = clean.match(/([A-Z][a-zA-Z0-9&/+\-\s]{2,50})\s+at\s+([A-Z][a-zA-Z0-9&/+\-\s]{2,50})/)
  if (atMatch?.[1]) {
    return atMatch[1].trim()
  }

  const lines = clean.split(/[.!?\n]/).map((line) => line.trim()).filter(Boolean)
  return lines[0]?.slice(0, 80)
}

function inferCompanyHint(jobText: string): string | undefined {
  const clean = normalizeText(jobText, 600)
  if (!clean) return undefined

  const explicitMatch = clean.match(/company\s*[:\-]\s*([A-Za-z0-9&/,+().\-\s]{2,80})/i)
  if (explicitMatch?.[1]) return explicitMatch[1].trim()

  const atMatch = clean.match(/at\s+([A-Z][a-zA-Z0-9&/+\-\s]{2,60})/)
  if (atMatch?.[1]) return atMatch[1].trim()

  return undefined
}

function extractSkills(text: string): string[] {
  const lower = text.toLowerCase()
  const candidates = [
    "Python",
    "JavaScript",
    "TypeScript",
    "SQL",
    "React",
    "Next.js",
    "Node.js",
    "Data Analysis",
    "A/B Testing",
    "System Design",
    "Product Strategy",
    "Incident Response",
    "Automation",
    "Stakeholder Communication",
  ]
  return dedupeNonEmpty(
    candidates.filter((skill) => lower.includes(skill.toLowerCase())),
    8,
  )
}

function extractExperienceSignals(text: string): string[] {
  const lower = text.toLowerCase()
  const picks: string[] = []

  if (/\bled\b|\bleadership\b|\bmentored\b/.test(lower)) picks.push("Leadership experience")
  if (/\bmetric\b|\bkpi\b|\bdashboard\b/.test(lower)) picks.push("Metrics-driven impact")
  if (/\bcustomer\b|\buser\b/.test(lower)) picks.push("Customer-focused mindset")
  if (/\bshipped\b|\blaunched\b|\bdelivery\b/.test(lower)) picks.push("Execution and delivery ownership")
  if (/\bincident\b|\bon-call\b|\bproduction\b/.test(lower)) picks.push("Operational rigor")

  return dedupeNonEmpty(picks, 5)
}

function fallbackRecommendation(resumeText: string, jobText: string, jobUrl?: string): MaterialsSessionPayload {
  const combined = `${resumeText}\n${jobText}`
  const personaId = inferPersonaId(combined)
  const focusAreas = PERSONA_FOCUS_DEFAULTS[personaId]
  const technicalWeight = PERSONA_TECHNICAL_WEIGHT_DEFAULTS[personaId]

  return {
    version: "v1",
    createdAt: Date.now(),
    resume: {
      fileName: "resume",
      fileType: "txt",
      summary: summarizeText(resumeText, "Candidate background provided."),
      skills: extractSkills(resumeText),
      experienceSignals: extractExperienceSignals(resumeText),
    },
    job: {
      jobText,
      jobUrl: jobUrl || undefined,
      summary: summarizeText(jobText, "No job listing supplied."),
    },
    tailoring: {
      recommendedPersonaId: personaId,
      recommendedFocusAreas: focusAreas,
      recommendedTechnicalWeight: technicalWeight,
      additionalContext: normalizeText(
        `Tailor questions to highlight ${focusAreas.join(", ")} while connecting answers to concrete impact.`,
        320,
      ),
      reasoningBullets: [
        "Detected role and skills keywords from uploaded materials.",
        "Selected persona and focus areas to match likely interview style.",
      ],
      roleHint: inferRoleHint(jobText),
      companyHint: inferCompanyHint(jobText),
    },
  }
}

function buildPrompt(resumeText: string, jobText: string): string {
  return [
    "You are configuring a mock interview setup from candidate materials.",
    `Choose ONE persona ID from: ${PERSONA_IDS.join(", ")}`,
    "Choose focus area IDs only from: leadership, adaptability, teamwork, timeManagement, systemDesign, productThinking, communication",
    "Return ONLY strict JSON with keys:",
    "{",
    '  "resumeSummary": "string",',
    '  "jobSummary": "string",',
    '  "skills": ["string"],',
    '  "experienceSignals": ["string"],',
    '  "recommendedPersonaId": "string",',
    '  "recommendedFocusAreas": ["string"],',
    '  "recommendedTechnicalWeight": 0,',
    '  "additionalContext": "string",',
    '  "reasoningBullets": ["string"],',
    '  "roleHint": "string",',
    '  "companyHint": "string"',
    "}",
    "Keep resumeSummary/jobSummary concise (max 2 sentences each).",
    "additionalContext should be a compact prompt fragment for interview generation.",
    "",
    `Resume text:\n${resumeText.slice(0, 7000)}`,
    "",
    `Job listing text:\n${jobText.slice(0, 7000)}`,
  ].join("\n")
}

async function generateRecommendation(
  resumeText: string,
  jobText: string,
  fileName: string,
  fileType: ResumeFileType,
  jobUrl?: string,
): Promise<{ payload: MaterialsSessionPayload; mode: "live" | "fallback" }> {
  const hasAnyProviderKey = Boolean(
    process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  )
  if (!hasAnyProviderKey) {
    const fallback = fallbackRecommendation(resumeText, jobText, jobUrl)
    fallback.resume.fileName = fileName
    fallback.resume.fileType = fileType
    return { payload: fallback, mode: "fallback" }
  }

  const prompt = buildPrompt(resumeText, jobText)
  try {
    const result = await generateLlmText(prompt, {
      geminiModels: [
        process.env.GEMINI_MODEL_ID || "",
        process.env.GEMINI_MODEL || "",
        "gemini-2.5-flash",
        "gemini-1.5-pro-latest",
      ].filter(Boolean),
      openAiModel: process.env.OPENAI_MODEL || "gpt-5-mini",
      temperature: 0.2,
    })

    const parsed = recoverJsonCandidate<LlmTailoringResult>(result.text)
    if (!parsed) {
      throw new Error("invalid tailoring JSON")
    }

    const personaId = coercePersonaId(parsed.recommendedPersonaId)
    const focusAreas = coerceFocusAreas(parsed.recommendedFocusAreas, personaId)
    const payload: MaterialsSessionPayload = {
      version: "v1",
      createdAt: Date.now(),
      resume: {
        fileName,
        fileType,
        summary: summarizeText(parsed.resumeSummary || "", summarizeText(resumeText, "Candidate background provided.")),
        skills: dedupeNonEmpty(parsed.skills ?? extractSkills(resumeText), 8),
        experienceSignals: dedupeNonEmpty(parsed.experienceSignals ?? extractExperienceSignals(resumeText), 6),
      },
      job: {
        jobText,
        jobUrl: jobUrl || undefined,
        summary: summarizeText(parsed.jobSummary || "", summarizeText(jobText, "No job listing supplied.")),
      },
      tailoring: {
        recommendedPersonaId: personaId,
        recommendedFocusAreas: focusAreas,
        recommendedTechnicalWeight: clampTechnicalWeight(
          parsed.recommendedTechnicalWeight ?? PERSONA_TECHNICAL_WEIGHT_DEFAULTS[personaId],
        ),
        additionalContext: normalizeText(
          parsed.additionalContext || "Tailor prompts to role-specific impact and decision-making.",
          360,
        ),
        reasoningBullets: dedupeNonEmpty(parsed.reasoningBullets ?? [], 4),
        roleHint: normalizeText(parsed.roleHint || inferRoleHint(jobText) || "", 120) || undefined,
        companyHint: normalizeText(parsed.companyHint || inferCompanyHint(jobText) || "", 120) || undefined,
      },
    }
    return { payload, mode: "live" }
  } catch (error) {
    console.error("interview-materials analyze failed, using fallback", error)
    const fallback = fallbackRecommendation(resumeText, jobText, jobUrl)
    fallback.resume.fileName = fileName
    fallback.resume.fileType = fileType
    return { payload: fallback, mode: "fallback" }
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("resume")
    const jobText = normalizeText(String(formData.get("jobText") || ""), 9000)
    const jobUrl = normalizeText(String(formData.get("jobUrl") || ""), 300)

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Resume file is required." }, { status: 400 })
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "Resume file is empty." }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Resume file must be 5MB or smaller." }, { status: 400 })
    }

    const fileType = detectResumeFileType(file)
    if (!fileType) {
      return NextResponse.json({ error: "Unsupported file type. Use PDF, DOCX, or TXT." }, { status: 400 })
    }

    const parsedResume = normalizeText(await parseResumeText(file, fileType), 12000)
    if (parsedResume.length < MIN_RESUME_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: "We could not extract enough resume content. Try a text-based PDF/DOCX or paste key details manually.",
        },
        { status: 422 },
      )
    }

    const { payload, mode } = await generateRecommendation(
      parsedResume,
      jobText,
      file.name || "resume",
      fileType,
      jobUrl || undefined,
    )

    const warnings: string[] = []
    if (!jobText) {
      warnings.push("No job listing text provided. Recommendations were resume-only.")
    }

    return NextResponse.json({
      success: true,
      mode,
      warnings,
      data: payload,
    })
  } catch (error) {
    console.error("interview-materials analyze error", error)
    return NextResponse.json({ error: "Failed to analyze interview materials." }, { status: 500 })
  }
}
