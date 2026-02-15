import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, isRetryableError } from './retry';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return result on first attempt if successful', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success');
    
    const promise = withRetry(fn, { initialDelay: 100 });
    
    // Fast-forward time to skip delay
    await vi.advanceTimersByTimeAsync(100);
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValueOnce('success');
    
    const promise = withRetry(fn, { 
      initialDelay: 100,
      backoffMultiplier: 2,
      maxAttempts: 3
    });
    
    // First retry after 100ms
    await vi.advanceTimersByTimeAsync(100);
    // Second retry after 200ms (100 * 2)
    await vi.advanceTimersByTimeAsync(200);
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect maxDelay', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValueOnce('success');
    
    const promise = withRetry(fn, { 
      initialDelay: 1000,
      backoffMultiplier: 10, // Would be 10000ms, but maxDelay is 5000
      maxDelay: 5000,
      maxAttempts: 3
    });
    
    // First retry after 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    // Second retry after 5000ms (capped at maxDelay)
    await vi.advanceTimersByTimeAsync(5000);
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const error = new Error('Persistent error');
    const fn = vi.fn().mockRejectedValue(error);
    
    const promise = withRetry(fn, { 
      initialDelay: 100,
      maxAttempts: 3
    });
    
    // Fast-forward through all retries (2 retries: 100ms, 200ms)
    await vi.advanceTimersByTimeAsync(100); // First retry
    await vi.advanceTimersByTimeAsync(200); // Second retry
    
    // Wait for promise to settle
    try {
      await promise;
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBe(error);
    }
    
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect retryable function', async () => {
    const retryableError = { status: 500 };
    const nonRetryableError = { status: 400 };
    
    // Test retryable error
    const fn1 = vi.fn()
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValueOnce('success');
    const promise1 = withRetry(fn1, {
      initialDelay: 100,
      retryable: (err: any) => err.status >= 500
    });
    
    await vi.advanceTimersByTimeAsync(100);
    const result1 = await promise1;
    
    expect(result1).toBe('success');
    expect(fn1).toHaveBeenCalledTimes(2); // Retried
    
    // Test non-retryable error
    const fn2 = vi.fn().mockRejectedValue(nonRetryableError);
    const promise2 = withRetry(fn2, {
      initialDelay: 100,
      retryable: (err: any) => err.status >= 500
    });
    
    await expect(promise2).rejects.toEqual(nonRetryableError);
    expect(fn2).toHaveBeenCalledTimes(1); // Not retried
  });

  it('should use custom maxAttempts', async () => {
    const error = new Error('Error');
    const fn = vi.fn().mockRejectedValue(error);
    
    const promise = withRetry(fn, { 
      initialDelay: 100,
      maxAttempts: 5
    });
    
    // Fast-forward through all retries (4 retries: 100, 200, 400, 800ms)
    await vi.advanceTimersByTimeAsync(100 + 200 + 400 + 800);
    
    // Wait for the promise to settle
    try {
      await promise;
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBe(error);
    }
    
    expect(fn).toHaveBeenCalledTimes(5);
  });
});

describe('isRetryableError', () => {
  it('should identify network errors as retryable', () => {
    const error = new TypeError('fetch failed');
    expect(isRetryableError(error)).toBe(true);
  });

  it('should identify 5xx errors as retryable', () => {
    expect(isRetryableError({ status: 500 })).toBe(true);
    expect(isRetryableError({ status: 503 })).toBe(true);
    expect(isRetryableError({ status: 599 })).toBe(true);
  });

  it('should identify 429 (rate limit) as retryable', () => {
    expect(isRetryableError({ status: 429 })).toBe(true);
  });

  it('should identify timeout errors as retryable', () => {
    expect(isRetryableError({ message: 'timeout' })).toBe(true);
    expect(isRetryableError({ message: 'Timed out after 30s' })).toBe(true);
  });

  it('should identify connection errors as retryable', () => {
    expect(isRetryableError({ message: 'network error' })).toBe(true);
    expect(isRetryableError({ message: 'ECONNREFUSED' })).toBe(true);
  });

  it('should not identify 4xx errors as retryable', () => {
    expect(isRetryableError({ status: 400 })).toBe(false);
    expect(isRetryableError({ status: 404 })).toBe(false);
    expect(isRetryableError({ status: 422 })).toBe(false);
  });

  it('should not identify validation errors as retryable', () => {
    expect(isRetryableError({ message: 'Invalid input' })).toBe(false);
    expect(isRetryableError(new Error('Validation failed'))).toBe(false);
  });
});
