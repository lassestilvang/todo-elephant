// Utility functions tests
import { describe, it, expect } from 'bun:test'
import { cn, formatDate, formatPriority, formatStatus } from '../src/lib/utils'

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should join class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
      expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
    })

    it('should filter out falsy values', () => {
      expect(cn('foo', '', null, undefined, 'bar')).toBe('foo bar')
      expect(cn('', null, undefined)).toBe('')
    })

    it('should handle single argument', () => {
      expect(cn('single')).toBe('single')
    })

    it('should handle no arguments', () => {
      expect(cn()).toBe('')
    })
  })

  describe('formatDate', () => {
    it('should format a date to locale string', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatDate(date)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle invalid date gracefully', () => {
      const result = formatDate(new Date('invalid'))
      expect(typeof result).toBe('string')
    })
  })

  describe('formatPriority', () => {
    it('should map priority values correctly', () => {
      expect(formatPriority('low')).toBe('Low')
      expect(formatPriority('medium')).toBe('Medium')
      expect(formatPriority('high')).toBe('High')
      expect(formatPriority('urgent')).toBe('Urgent')
    })

    it('should return original value if not mapped', () => {
      expect(formatPriority('custom')).toBe('custom')
      expect(formatPriority('')).toBe('')
    })
  })

  describe('formatStatus', () => {
    it('should map status values correctly', () => {
      expect(formatStatus('todo')).toBe('To Do')
      expect(formatStatus('in-progress')).toBe('In Progress')
      expect(formatStatus('done')).toBe('Completed')
      expect(formatStatus('blocked')).toBe('Blocked')
    })

    it('should replace underscores in unknown status', () => {
      expect(formatStatus('custom_status')).toBe('custom status')
    })

    it('should return original value if no underscores', () => {
      expect(formatStatus('custom')).toBe('custom')
    })
  })
})