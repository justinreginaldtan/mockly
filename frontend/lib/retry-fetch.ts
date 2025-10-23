/**
 * Fetch wrapper with exponential backoff retry logic
 * Retries on network errors and 5xx server errors
 * Does NOT retry on 4xx client errors
 */

export type RetryFetchOptions = RequestInit & {
  maxAttempts?: number
  baseDelay?: number
  onRetry?: (attempt: number, error: Error) => void
}

export class RetryFetchError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message)
    this.name = 'RetryFetchError'
  }
}

function isRetryableError(error: unknown): boolean {
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  return false
}

function isRetryableStatus(status: number): boolean {
  // Retry on 5xx server errors, but not 4xx client errors
  return status >= 500 && status < 600
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function retryFetch(
  url: string,
  options: RetryFetchOptions = {}
): Promise<Response> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    onRetry,
    ...fetchOptions
  } = options

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, fetchOptions)

      // If response is ok or a non-retryable error, return it
      if (response.ok || !isRetryableStatus(response.status)) {
        return response
      }

      // Server error (5xx) - prepare to retry
      lastError = new Error(`Server error: ${response.status} ${response.statusText}`)

      // If this was the last attempt, throw
      if (attempt === maxAttempts) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delayMs = baseDelay * Math.pow(2, attempt - 1)

      // Notify caller of retry
      if (onRetry) {
        onRetry(attempt, lastError)
      }

      // Wait before retrying
      await delay(delayMs)

    } catch (error) {
      // Network error or fetch failure
      lastError = error instanceof Error ? error : new Error(String(error))

      // If not retryable or last attempt, throw
      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw new RetryFetchError(
          `Failed after ${attempt} attempts: ${lastError.message}`,
          attempt,
          lastError
        )
      }

      // Calculate delay with exponential backoff
      const delayMs = baseDelay * Math.pow(2, attempt - 1)

      // Notify caller of retry
      if (onRetry) {
        onRetry(attempt, lastError)
      }

      // Wait before retrying
      await delay(delayMs)
    }
  }

  // Should never reach here, but TypeScript needs this
  throw new RetryFetchError(
    `Failed after ${maxAttempts} attempts`,
    maxAttempts,
    lastError || new Error('Unknown error')
  )
}
