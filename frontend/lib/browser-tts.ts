export function supportsBrowserTts(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window
}

export function stopBrowserTts(): void {
  if (!supportsBrowserTts()) {
    return
  }
  window.speechSynthesis.cancel()
}

export async function speakWithBrowserTts(text: string, options?: { rate?: number; pitch?: number; lang?: string }) {
  if (!supportsBrowserTts()) {
    throw new Error("Browser voice fallback is not supported in this browser.")
  }

  const content = text.trim()
  if (!content) {
    throw new Error("No text available for browser voice fallback.")
  }

  stopBrowserTts()

  await new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = options?.rate ?? 1
    utterance.pitch = options?.pitch ?? 1
    utterance.lang = options?.lang ?? "en-US"

    utterance.onend = () => resolve()
    utterance.onerror = (event) => {
      const code = "error" in event ? String(event.error) : "unknown"
      reject(new Error(`Browser voice fallback failed (${code}).`))
    }

    window.speechSynthesis.speak(utterance)
  })
}
