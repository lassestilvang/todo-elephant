/*
 * Accessibility utilities for Todo Elephant
 * Provides hooks and components to improve accessibility:
 * - Focus trap for modals
 * - Skip navigation links
 * - ARIA live regions for announcements
 * - High contrast theme support
 * - Keyboard navigation enhancements
 */

import React, { useEffect, useRef, useState } from 'react';

// ==== 1. Focus Trap Hook =================================
export function useFocusTrap(elementRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const focusableElements = element.querySelectorAll<HTMLElement>(focusableSelectors);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      const isTabPressed = e.key === 'Tab' || e.keyCode === 9;

      if (!isTabPressed) return;

      if (e.shiftKey) { // shift + tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else { // tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown);
    // Focus first element when modal opens
    firstFocusable?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [elementRef]);
}

// ==== 2. Skip Navigation Link ============================
export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="skip-link z-50 absolute top-4 left-4 bg-white/90 text-black px-3 py-1 rounded-md shadow-lg transition-transform duration-300 transform -translate-y-4 focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      Skip to main content
    </a>
  );
};

// ==== 3. ARIA Live Region for Announcements =============
export const LiveAnnouncer: React.FC<{ message: string }> = ({ message }) => {
  // Use a ref to force screen readers to re-read when message changes
  const messageRef = useRef<string>('');

  useEffect(() => {
    if (messageRef.current !== message) {
      messageRef.current = message;
    }
  }, [message]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

// ==== 4. Focus Management Utilities ======================
export function focusFirstElement(container: HTMLElement | null) {
  if (!container) return;

  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusable.length > 0) {
    focusable[0].focus();
  }
}

export function trapFocus(container: HTMLElement | null) {
  if (!container) return;

  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      if (e.shiftKey) { // shift + tab
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else { // tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

// ==== 5. High Contrast Theme Support ====================
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);

  // Check user preference on mount
  useEffect(() => {
    const prefersHighContrast = window.matchMedia('(forced-colors: active)').matches;
    const stored = localStorage.getItem('todo-elephant-high-contrast');
    setIsHighContrast(prefersHighContrast || stored === 'true');
  }, []);

  const toggleHighContrast = () => {
    setIsHighContrast(prev => {
      const next = !prev;
      localStorage.setItem('todo-elephant-high-contrast', String(next));
      return next;
    });
  };

  return { isHighContrast, toggleHighContrast };
}

// ==== 6. Accessible Button Component ====================
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  ariaLabel?: string;
}> = ({ children, onClick, disabled = false, variant = 'primary', ariaLabel }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : variant === 'primary'
            ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2'
            : variant === 'secondary'
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2'
              : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2'
      }`}
    >
      {children}
    </button>
  );
};

// ==== 7. Accessible Input Component ====================
export const AccessibleInput: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  ariaLabel?: string;
}> = ({ label, type = 'text', value, onChange, placeholder, required, error, ariaLabel }) => {
  return (
    <div className="mb-4">
      <label htmlFor={ariaLabel || label.toLowerCase().replace(/\s+/g, '-')} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && ' *'}
      </label>
      <input
        id={ariaLabel || label.toLowerCase().replace(/\s+/g, '-')}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${ariaLabel || label.toLowerCase().replace(/\s+/g, '-')}-error` : undefined}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
          error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
        }`}
      />
      {error && (
        <p id={`${ariaLabel || label.toLowerCase().replace(/\s+/g, '-')}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};