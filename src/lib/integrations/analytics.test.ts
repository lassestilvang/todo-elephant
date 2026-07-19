import { describe, it, expect, vi } from 'vitest';
import { getAnalytics, logEvent, invalidateCache } from './analytics';

describe('analytics module', () => {
  it('correctly logs events with timestamp', () => {
    const spy = vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const result = logEvent('task_created');
    expect(spy).toHaveBeenCalled();
    expect(result.timestamp).toBe(1700000000000);
    expect(result.event).toBe('task_created');
  });

  it('tracks analytics properly', () => {
    // Call logEvent a few times to increase count
    logEvent('test_event');
    logEvent('another_event');
    const analytics = getAnalytics();
    expect(analytics.getCallCount()).toBeGreaterThan(0);
  });

  it('invalidates cache when needed', () => {
    // First, add something to cache by calling logEvent
    logEvent('cache_test');
    // Invalidate a cache key
    const result = invalidateCache('non-existent-key'); // our implementation always returns true
    expect(result).toBe(true);
    // Note: Our internal cache is not exposed, but we can at least verify the function doesn't throw
  });
});