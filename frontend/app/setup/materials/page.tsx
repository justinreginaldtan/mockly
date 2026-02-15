"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Briefcase, FileText, Loader2, Sparkles, Trash2, UploadCloud } from "lucide-react"
import EnhancedNavHeader from "@/components/enhanced-nav-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  appendMaterialsHistory,
  clearMaterialsHistory,
  getMaterialsHistory,
  getMaterialsSession,
  removeMaterialsHistoryItem,
  saveMaterialsSession,
} from "@/lib/materials-storage"
import { historyItemToSession, type MaterialsHistoryItem, type MaterialsSessionPayload } from "@/lib/interview-materials"

type AnalyzeResponse = {
  success?: boolean
  mode?: "live" | "fallback"
  warnings?: string[]
  data?: MaterialsSessionPayload
  error?: string
}

function formatRelativeDate(timestamp: number): string {
  const deltaMs = Date.now() - timestamp
  const minutes = Math.floor(deltaMs / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export default function SetupMaterialsPage() {
  const router = useRouter()
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeLabel, setResumeLabel] = useState<string>("")
  const [jobText, setJobText] = useState<string>("")
  const [jobUrl, setJobUrl] = useState<string>("")
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [analysis, setAnalysis] = useState<MaterialsSessionPayload | null>(null)
  const [history, setHistory] = useState<MaterialsHistoryItem[]>([])

  useEffect(() => {
    const existing = getMaterialsSession()
    if (existing) {
      setAnalysis(existing)
      setResumeLabel(existing.resume.fileName)
      if (existing.job.jobText) {
        setJobText(existing.job.jobText)
      } else if (existing.job.summary) {
        setJobText(existing.job.summary)
      }
      setJobUrl(existing.job.jobUrl || "")
    }
    setHistory(getMaterialsHistory())
  }, [])

  const canAnalyze = useMemo(() => !!resumeFile && !analyzing, [resumeFile, analyzing])

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError("Upload a resume before running analysis.")
      return
    }

    setAnalyzing(true)
    setError(null)
    setWarnings([])

    try {
      const formData = new FormData()
      formData.append("resume", resumeFile)
      formData.append("jobText", jobText)
      formData.append("jobUrl", jobUrl)

      const response = await fetch("/api/interview-materials/analyze", {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json().catch(() => null)) as AnalyzeResponse | null

      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.error || "Could not analyze materials.")
      }

      setWarnings(Array.isArray(payload.warnings) ? payload.warnings : [])
      setAnalysis(payload.data)
      saveMaterialsSession(payload.data)
      setHistory(appendMaterialsHistory(payload.data))
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unexpected analysis error."
      setError(message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleUseHistory = (item: MaterialsHistoryItem) => {
    const session = historyItemToSession(item)
    setAnalysis(session)
    setResumeFile(null)
    setResumeLabel(item.resumeFileName)
    setJobText(item.jobSummary)
    setJobUrl(item.jobUrl || "")
    setWarnings([])
    setError(null)
    saveMaterialsSession(session)
  }

  const handleRemoveHistory = (id: string) => {
    setHistory(removeMaterialsHistoryItem(id))
  }

  const handleClearHistory = () => {
    clearMaterialsHistory()
    setHistory([])
  }

  const handleContinue = () => {
    if (!analysis) {
      router.push("/setup")
      return
    }
    saveMaterialsSession(analysis)
    const query = new URLSearchParams({
      recommended: analysis.tailoring.recommendedPersonaId,
      tailored: "1",
    })
    router.push(`/setup?${query.toString()}`)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] text-[#1A1A1A]">
      <EnhancedNavHeader />

      <main className="mx-auto max-w-screen-lg space-y-8 px-4 py-10 md:px-8 md:py-14">
        <section className="rounded-3xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#EDE5E0] bg-white px-3 py-1 uppercase tracking-[0.3em] text-[#777777]">
              <Sparkles className="h-3.5 w-3.5 text-[#FF7A70]" />
              Tailored Setup
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Upload your resume and job listing for a tailored interview plan
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-medium text-[#777777] md:text-base">
            We’ll suggest persona, focus areas, and question mix from your materials. You can still edit everything
            before the interview starts.
          </p>

          <div className="mt-8 grid gap-6">
            <div className="rounded-2xl border border-dashed border-[#E1D6CF] bg-[#FFFDFC] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
                <UploadCloud className="h-4 w-4 text-[#FF7A70]" />
                Resume upload (PDF, DOCX, TXT)
              </div>
              <p className="mt-1 text-xs text-[#777777]">Max 5MB. Best results with text-based files.</p>
              <Input
                type="file"
                accept=".pdf,.docx,.txt"
                className="mt-3 bg-white"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setResumeFile(file)
                  setResumeLabel(file?.name || "")
                  setError(null)
                }}
              />
              <p className="mt-2 text-xs text-[#777777]">{resumeLabel || "No file selected yet."}</p>
            </div>

            <div className="rounded-2xl border border-[#EDE5E0] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
                <Briefcase className="h-4 w-4 text-[#FF7A70]" />
                Job listing text
              </div>
              <p className="mt-1 text-xs text-[#777777]">Paste the role description (optional, but recommended).</p>
              <Textarea
                value={jobText}
                onChange={(event) => setJobText(event.target.value)}
                placeholder="Paste the full job listing here..."
                rows={8}
                className="mt-3 resize-y bg-white"
              />
              <Input
                value={jobUrl}
                onChange={(event) => setJobUrl(event.target.value)}
                placeholder="Optional listing URL (metadata only)"
                className="mt-3 bg-white"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {warnings.map((warning) => (
                <p key={warning}>• {warning}</p>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={() => void handleAnalyze()} disabled={!canAnalyze} loading={analyzing}>
              {analyzing ? "Analyzing materials..." : "Analyze & recommend setup"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/setup">Skip for now</Link>
            </Button>
          </div>
        </section>

        {analysis && (
          <section className="rounded-3xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <h2 className="text-xl font-semibold">Recommended setup preview</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#EDE5E0] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#777777]">Resume summary</p>
                <p className="mt-2 text-sm text-[#1A1A1A]">{analysis.resume.summary}</p>
              </div>
              <div className="rounded-2xl border border-[#EDE5E0] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#777777]">Job summary</p>
                <p className="mt-2 text-sm text-[#1A1A1A]">{analysis.job.summary || "No job listing supplied."}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#EDE5E0] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#777777]">Persona</p>
                <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">{analysis.tailoring.recommendedPersonaId}</p>
              </div>
              <div className="rounded-2xl border border-[#EDE5E0] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#777777]">Technical weight</p>
                <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">
                  {analysis.tailoring.recommendedTechnicalWeight}%
                </p>
              </div>
              <div className="rounded-2xl border border-[#EDE5E0] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#777777]">Focus areas</p>
                <p className="mt-2 text-sm text-[#1A1A1A]">{analysis.tailoring.recommendedFocusAreas.join(", ")}</p>
              </div>
            </div>

            {analysis.tailoring.reasoningBullets.length > 0 && (
              <div className="mt-4 rounded-2xl border border-[#EDE5E0] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#777777]">Why these recommendations</p>
                <ul className="mt-2 space-y-1 text-sm text-[#1A1A1A]">
                  {analysis.tailoring.reasoningBullets.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={handleContinue} variant="gradient">
                Continue to setup
              </Button>
              <Button asChild variant="outline">
                <Link href="/setup">Open setup without recommendations</Link>
              </Button>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Local history (this browser)</h2>
            {history.length > 0 && (
              <Button onClick={handleClearHistory} variant="outline" size="sm">
                Clear history
              </Button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-[#777777]">No saved material analyses yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[#EDE5E0] bg-white p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{item.resumeFileName}</p>
                    <p className="text-xs text-[#777777]">
                      {item.companyHint ? `${item.companyHint} · ` : ""}
                      {item.roleHint || "Role not detected"} · {formatRelativeDate(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleUseHistory(item)}>
                      <FileText className="mr-1 h-3.5 w-3.5" />
                      Use
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRemoveHistory(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
