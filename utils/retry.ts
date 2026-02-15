
/**
 * Retry utility with exponential backoff for transient failures.
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryable?: (error: any) => boolean;
}

/**
 * Retries a function with exponential backoff.
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryable = () => true // By default, retry all errors
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === maxAttempts || !retryable(error)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Determines if an error is likely transient and retryable.
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // HTTP 5xx errors (server errors)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }

  // HTTP 429 (rate limit)
  if (error.status === 429) {
    return true;
  }

  // Timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('Timed out')) {
    return true;
  }

  // Connection errors
  if (error.message?.includes('network') || error.message?.includes('ECONNREFUSED')) {
    return true;
  }

  // Don't retry 4xx errors (client errors) or validation errors
  return false;
}
