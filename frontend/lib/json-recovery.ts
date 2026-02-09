export function stripCodeFences(text: string): string {
  return text
    .replace(/^```[a-zA-Z]*\n?/g, "")
    .replace(/```\s*$/g, "")
    .trim()
}

function tryParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function findBalancedJsonSlice(source: string, startIndex: number): string | null {
  const opening = source[startIndex]
  if (opening !== "{" && opening !== "[") {
    return null
  }

  const closing = opening === "{" ? "}" : "]"
  const stack: string[] = [opening]
  let inString = false
  let escaped = false

  for (let i = startIndex + 1; i < source.length; i += 1) {
    const char = source[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === "\\") {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === "{" || char === "[") {
      stack.push(char)
      continue
    }

    if (char === "}" || char === "]") {
      const top = stack[stack.length - 1]
      const expected = top === "{" ? "}" : "]"
      if (char !== expected) {
        return null
      }
      stack.pop()
      if (stack.length === 0) {
        return source.slice(startIndex, i + 1)
      }
    }
  }

  if (stack.length === 1 && source.endsWith(closing)) {
    return source.slice(startIndex)
  }

  return null
}

export function recoverJsonCandidate<T>(raw: string): T | null {
  const cleaned = stripCodeFences(raw)
  const direct = tryParse<T>(cleaned)
  if (direct !== null) {
    return direct
  }

  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i]
    if (char !== "{" && char !== "[") {
      continue
    }

    const candidate = findBalancedJsonSlice(cleaned, i)
    if (!candidate) {
      continue
    }

    const parsed = tryParse<T>(candidate)
    if (parsed !== null) {
      return parsed
    }
  }

  return null
}
