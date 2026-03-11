/**
 * Maya Connect V2 — useDebounced Hook
 *
 * Returns a debounced version of the value that only updates
 * after the specified delay of inactivity.
 */
import { useState, useEffect } from 'react';

export function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
