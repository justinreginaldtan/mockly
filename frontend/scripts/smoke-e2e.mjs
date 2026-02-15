/* eslint-disable no-console */
const baseUrl = process.env.MOCKLY_BASE_URL || "http://127.0.0.1:3000"

const persona = {
  personaId: "google-analyst",
  company: "Google",
  role: "Data Analyst Intern",
  focusAreas: ["communication", "productThinking"],
  technicalWeight: 40,
  duration: "standard",
}

function buildMaterialsFormData() {
  const formData = new FormData()
  const resumeText = [
    "Jordan Lee",
    "Software Engineer Intern",
    "Built React dashboards, optimized API latency by 30%, and collaborated with product/design partners.",
    "Skills: JavaScript, TypeScript, SQL, React, Next.js",
  ].join("\n")

  formData.append("resume", new File([resumeText], "resume.txt", { type: "text/plain" }))
  formData.append(
    "jobText",
    "Hiring a Software Engineer Intern to build backend services, collaborate cross-functionally, and ship product features.",
  )
  formData.append("jobUrl", "https://example.com/jobs/software-engineer-intern")
  return formData
}

const checks = [
  {
    name: "provider-status",
    path: "/api/provider-status",
    init: { method: "GET" },
    assess: async (response) => {
      const payload = await response.json()
      return {
        ok: Boolean(payload?.llm && payload?.voice),
        detail: `llm=${payload?.llm?.mode ?? "?"},voice=${payload?.voice?.mode ?? "?"}`,
      }
    },
  },
  {
    name: "generate-interview",
    path: "/api/generate-interview",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona }),
    },
    assess: async (response) => {
      const payload = await response.json()
      const plan = payload?.plan
      const questionCount = Array.isArray(plan?.questions) ? plan.questions.length : 0
      const guidance = plan?.guidance ? "fallback" : "live"
      return {
        ok: payload?.success === true && questionCount > 0,
        detail: `${guidance},questions=${questionCount}`,
      }
    },
  },
  {
    name: "materials-analyze",
    path: "/api/interview-materials/analyze",
    init: () => ({
      method: "POST",
      body: buildMaterialsFormData(),
    }),
    assess: async (response) => {
      const payload = await response.json()
      const recommendation = payload?.data?.tailoring
      return {
        ok:
          payload?.success === true &&
          typeof recommendation?.recommendedPersonaId === "string" &&
          Array.isArray(recommendation?.recommendedFocusAreas),
        detail: `${payload?.mode ?? "?"},persona=${recommendation?.recommendedPersonaId ?? "?"}`,
      }
    },
  },
  {
    name: "evaluate-interview",
    path: "/api/evaluate-interview",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        persona: "google-analyst",
        questions: [
          {
            id: "1",
            text: "Tell me about yourself",
            response: "I improved dashboard adoption by 30% by partnering with product and design teams.",
            duration: 28000,
          },
        ],
      }),
    },
    assess: async (response) => {
      const payload = await response.json()
      const score = payload?.evaluation?.overallScore
      return {
        ok: Number.isFinite(score),
        detail: `score=${score ?? "?"}`,
      }
    },
  },
  {
    name: "generate-scenario",
    path: "/api/generate-scenario",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty: "medium" }),
    },
    assess: async (response) => {
      const payload = await response.json()
      return {
        ok: typeof payload?.prompt === "string" && payload.prompt.trim().length > 0,
        detail: `difficulty=${payload?.difficulty ?? "?"}`,
      }
    },
  },
  {
    name: "evaluate-answer",
    path: "/api/evaluate-answer",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "My package is late and I need help",
        answer: "I understand your frustration. Let me check your order status and share options.",
      }),
    },
    assess: async (response) => {
      const payload = await response.json()
      return {
        ok: Number.isFinite(payload?.empathy) && Number.isFinite(payload?.resolution),
        detail: `empathy=${payload?.empathy ?? "?"},resolution=${payload?.resolution ?? "?"}`,
      }
    },
  },
  {
    name: "voice-question",
    path: "/api/voice-question",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personaId: "google-analyst",
        voiceStyleId: "mentor",
        preview: true,
      }),
    },
    assess: async (response) => {
      const payload = await response.json()
      const live = Boolean(payload?.success && payload?.audioUrl)
      const fallback = payload?.fallbackAvailable === true
      return {
        ok: live || fallback,
        detail: live ? "live" : fallback ? `fallback:${payload?.code ?? "unknown"}` : "failed",
      }
    },
  },
  {
    name: "voice-say",
    path: "/api/voice-say",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Smoke test", voice: "mentor" }),
    },
    assess: async (response) => {
      const contentType = response.headers.get("content-type") || ""
      if (contentType.includes("audio/")) {
        return { ok: true, detail: "live-audio" }
      }
      const payload = await response.json().catch(() => null)
      const fallback = payload?.fallbackAvailable === true
      return {
        ok: fallback,
        detail: fallback ? `fallback:${payload?.code ?? "unknown"}` : "failed",
      }
    },
  },
]

async function runCheck(check) {
  const url = `${baseUrl}${check.path}`
  try {
    const init = typeof check.init === "function" ? check.init() : check.init
    const response = await fetch(url, init)
    const assessed = await check.assess(response)
    return {
      name: check.name,
      status: assessed.ok ? "PASS" : "FAIL",
      http: response.status,
      detail: assessed.detail,
    }
  } catch (error) {
    return {
      name: check.name,
      status: "FAIL",
      http: "ERR",
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}

async function main() {
  console.log(`Running Mockly service smoke checks against ${baseUrl}`)
  const results = []
  for (const check of checks) {
    results.push(await runCheck(check))
  }

  for (const row of results) {
    console.log(`${row.status.padEnd(4)} ${String(row.http).padEnd(4)} ${row.name.padEnd(20)} ${row.detail}`)
  }

  const failed = results.filter((row) => row.status !== "PASS")
  if (failed.length > 0) {
    process.exitCode = 1
  }
}

await main()
