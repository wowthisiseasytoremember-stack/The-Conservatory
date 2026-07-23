import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import retry from 'async-retry';

// Set a longer timeout for these tests as they involve delays
vi.setConfig({ testTimeout: 15000 });

describe('retry (formerly withRetry)', () => {
  // We no longer use fake timers as async-retry handles its own timing.

  it('should return result on first attempt if successful', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await retry(fn, { retries: 1 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success');
    
    const result = await retry(fn, { minTimeout: 10, retries: 1 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValueOnce('success');
    
    const result = await retry(fn, { 
      minTimeout: 10,
      factor: 2,
      retries: 2
    });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect maxTimeout', async () => {
    const startTime = Date.now();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValueOnce('success');
    
    await retry(fn, { 
      minTimeout: 100,
      factor: 10,
      maxTimeout: 200, // Cap the delay
      retries: 2
    });

    const duration = Date.now() - startTime;
    // First delay ~100ms, second delay capped at ~200ms. Total ~300ms.
    expect(duration).toBeLessThan(500);
    expect(fn).toHaveBeenCalledTimes(3);
  });


  it('should throw after max attempts', async () => {
    const error = new Error('Persistent error');
    const fn = vi.fn().mockRejectedValue(error);
    
    const promise = retry(fn, { 
      minTimeout: 10,
      retries: 2 
    });
    
    await expect(promise).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should use custom max attempts (retries)', async () => {
    const error = new Error('Error');
    const fn = vi.fn().mockRejectedValue(error);
    
    const promise = retry(fn, { 
      minTimeout: 10,
      retries: 4
    });
    
    await expect(promise).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(5);
  });
});
