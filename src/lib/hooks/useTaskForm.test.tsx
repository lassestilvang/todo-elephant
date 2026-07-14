import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useTaskForm } from './useTaskForm';

vi.useFakeTimers();

describe('useTaskForm', () => {
  it('initializes form with empty default values', () => {
    const { result } = renderHook(() => useTaskForm());
    expect(result.current.task).toBe('');
    expect(result.current.priority).toBe('medium');
    expect(result.current.description).toBe('');
    expect(result.current.error).toBe('');
  });

  it('validates minimum task length (2 characters)', () => {
    const { result } = renderHook(() => useTaskForm());
    act(() => { result.current.handleSubmit(); });
    expect(result.current.error).toBe('Please enter at least 2 characters');
  });

  it('updates task content via setForm', () => {
    const { result } = renderHook(() => useTaskForm());
    act(() => { result.current.setForm({ task: 'Buy groceries' }); });
    expect(result.current.task).toBe('Buy groceries');
  });

  it('updates priority level via setForm', () => {
    const { result } = renderHook(() => useTaskForm());
    act(() => { result.current.setForm({ priority: 'high' }); });
    expect(result.current.priority).toBe('high');
  });

  it('handles description updates via setForm', () => {
    const { result } = renderHook(() => useTaskForm());
    act(() => { result.current.setForm({ description: 'Test description' }); });
    expect(result.current.description).toBe('Test description');
  });

  it('submits form and clears fields', () => {
    const { result } = renderHook(() => useTaskForm());
    act(() => { result.current.setForm({ task: 'Valid task' }); });
    act(() => { result.current.handleSubmit(); });
    expect(result.current.task).toBe('');
    expect(result.current.priority).toBe('medium');
    expect(result.current.description).toBe('');
    expect(result.current.error).toBe('');
  });
});