import { MATERIALS_CACHE_KEY, MATERIALS_HISTORY_KEY, MATERIALS_HISTORY_LIMIT } from "@/lib/cache-keys"
import type { MaterialsHistoryItem, MaterialsSessionPayload } from "@/lib/interview-materials"
import { historyItemToSession, toHistoryItem } from "@/lib/interview-materials"

function hasBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function readJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getMaterialsSession(): MaterialsSessionPayload | null {
  if (!hasBrowserStorage()) return null
  return readJson<MaterialsSessionPayload>(window.sessionStorage.getItem(MATERIALS_CACHE_KEY))
}

export function saveMaterialsSession(payload: MaterialsSessionPayload): void {
  if (!hasBrowserStorage()) return
  window.sessionStorage.setItem(MATERIALS_CACHE_KEY, JSON.stringify(payload))
}

export function clearMaterialsSession(): void {
  if (!hasBrowserStorage()) return
  window.sessionStorage.removeItem(MATERIALS_CACHE_KEY)
}

export function getMaterialsHistory(): MaterialsHistoryItem[] {
  if (!hasBrowserStorage()) return []
  const parsed = readJson<MaterialsHistoryItem[]>(window.localStorage.getItem(MATERIALS_HISTORY_KEY))
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter((item) => Boolean(item?.id && item?.resumeSummary && item?.recommendedPersonaId))
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function saveMaterialsHistory(items: MaterialsHistoryItem[]): void {
  if (!hasBrowserStorage()) return
  const limited = items.slice(0, MATERIALS_HISTORY_LIMIT)
  window.localStorage.setItem(MATERIALS_HISTORY_KEY, JSON.stringify(limited))
}

export function appendMaterialsHistory(payload: MaterialsSessionPayload): MaterialsHistoryItem[] {
  const item = toHistoryItem(payload)
  const existing = getMaterialsHistory().filter((entry) => entry.id !== item.id)
  const next = [item, ...existing].slice(0, MATERIALS_HISTORY_LIMIT)
  saveMaterialsHistory(next)
  return next
}

export function removeMaterialsHistoryItem(id: string): MaterialsHistoryItem[] {
  const next = getMaterialsHistory().filter((item) => item.id !== id)
  saveMaterialsHistory(next)
  return next
}

export function clearMaterialsHistory(): void {
  if (!hasBrowserStorage()) return
  window.localStorage.removeItem(MATERIALS_HISTORY_KEY)
}

export function getLatestHistoryAsSession(): MaterialsSessionPayload | null {
  const history = getMaterialsHistory()
  if (history.length === 0) return null
  return historyItemToSession(history[0])
}
