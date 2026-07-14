import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 100): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  console.log('useDebounce render: value=', value, 'debouncedValue=', debouncedValue);
  useEffect(() => {
    console.log('useEffect: value changed to', value);
    const handler = setTimeout(() => {
      console.log('timeout fired, setting debouncedValue to', value);
      setDebouncedValue(value);
    }, delay);
    return () => {
      console.log('cleanup timeout');
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}