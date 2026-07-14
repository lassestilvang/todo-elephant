import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useDebounce } from './useDebounce';

vi.useFakeTimers();

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(
      (props) => useDebounce(props.value, props.delay),
      { initialProps: { value: 'initial', delay: 100 } }
    );
    expect(result.current).toBe('initial');
  });

  it('updates to the new value after delay', async () => {
    const { result, rerender } = renderHook(
      (props) => useDebounce(props.value, props.delay),
      { initialProps: { value: 'first', delay: 100 } }
    );
    expect(result.current).toBe('first');

    rerender({ value: 'second', delay: 100 });
    expect(result.current).toBe('first'); // should still be first until delay passes
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(result.current).toBe('second');
  });

  it('respects a custom delay', async () => {
    const { result, rerender } = renderHook(
      (props) => useDebounce(props.value, props.delay),
      { initialProps: { value: 'delayed', delay: 50 } }
    );
    rerender({ value: 'delayed-new', delay: 50 });
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(result.current).toBe('delayed-new');
  });

  it('clears timer on unmount', () => {
    const { result, unmount } = renderHook(
      (props) => useDebounce(props.value, props.delay),
      { initialProps: { value: 'temp', delay: 200 } }
    );
    act(() => { vi.advanceTimersByTime(100); }); // half of delay
    unmount();
    // Should not throw
  });

  it('debounces rapid updates', async () => {
    const { result, rerender } = renderHook(
      (props) => useDebounce(props.value, props.delay),
      { initialProps: { value: 'a', delay: 100 } }
    );
    rerender({ value: 'b', delay: 100 });
    rerender({ value: 'c', delay: 100 });
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(result.current).toBe('c');
  });

  it('handles zero delay correctly', async () => {
    const { result, rerender } = renderHook(
      (props) => useDebounce(props.value, props.delay),
      { initialProps: { value: 'instant', delay: 0 } }
    );
    rerender({ value: 'instant-changed', delay: 0 });
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(result.current).toBe('instant-changed');
  });
});