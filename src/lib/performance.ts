/*
 * Performance utilities for Todo Elephant
 * Provides:
 * - Debounced search hook (reduces unnecessary renders/API calls)
 * - Infinite scrolling helper
 * - Virtual list rendering utility
 * - Memoization utilities
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// ==== 1. Debounced Search Hook ==========================================
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Variant: Debounced callback for search input
export function useDebouncedCallback<T>(
  callback: (value: T) => void,
  delay: number = 300
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedCallback = useCallback(
    (value: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(value);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// ==== 2. Infinite Scrolling Helper =====================================
export function useInfiniteScroll(
  containerRef: React.RefObject<HTMLElement>,
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      { root: containerRef.current, threshold: 0.1, ...options }
    );

    observerRef.current = observer;
    return () => {
      observer.disconnect();
    };
  }, [containerRef, callback, options]);

  return observerRef;
}

// ==== 3. Virtual List Rendering Utility =================================
interface VirtualListOptions {
  itemHeight: number;
  containerHeight: number;
  buffer?: number;
}

export function useVirtualList(
  items: any[],
  options: VirtualListOptions
) {
  const { itemHeight, containerHeight, buffer = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(
    items.length - 1,
    startIndex + Math.ceil(containerHeight / itemHeight) + buffer
  );

  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
      result.push({
        index: i,
        data: items[i],
        style: {
          position: 'absolute',
          top: `${i * itemHeight}px`,
          height: `${itemHeight}px`,
        },
      });
    }
    return result;
  }, [items, startIndex, endIndex, itemHeight]);

  const VirtualContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    style,
    children,
    ...props
  }) => (
    <div
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        ...style,
      }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      {...props}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {children}
      </div>
    </div>
  );

  return {
    VirtualContainer,
    visibleItems,
    totalHeight,
    startIndex,
    endIndex,
  };
}

// ==== 4. Fast Comparison Utility ==========================================
export function shallowEqual(objA: Record<string, unknown>, objB: Record<string, unknown>): boolean {
  if (objA === objB) return true;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(objB, key) || objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}

// ==== 5. Memoized Hook Factory ==========================================
export function useMemoizedHook<T>(value: T, compareFn?: (a: T, b: T) => boolean) {
  const ref = useRef<T>(value);

  if (value !== undefined && compareFn && !compareFn(ref.current, value)) {
    ref.current = value;
  } else if (compareFn === undefined && value !== ref.current) {
    ref.current = value;
  }

  return ref.current;
}

// ==== 6. Progressive Loading Hook =======================================
export function useProgressiveLoad<T>(items: T[], batchSize = 20) {
  const [visibleCount, setVisibleCount] = useState(batchSize);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const remaining = items.length - visibleCount;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + batchSize, items.length));
  }, [items.length, batchSize]);

  // Auto-load if we haven't shown everything yet
  useEffect(() => {
    if (visibleCount < items.length && remaining <= batchSize) {
      setVisibleCount(items.length);
    }
  }, [visibleCount, items.length, remaining, batchSize]);

  return {
    visibleItems,
    remaining,
    loadMore,
  };
}

// ==== 7. Intersection Observer for Lazy Loading =========================
export function useInView(
  options: IntersectionObserverInit = { threshold: 0.1 }
): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isVisible];
}

// ==== 8. Performance Monitoring (Dev Only) ============================
export function useRenderCount(componentName: string) {
  const count = useRef(0);

  useEffect(() => {
    count.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${count.current} times`);
    }
  });

  return count.current;
}