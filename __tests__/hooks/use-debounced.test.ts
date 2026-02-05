/**
 * Tests pour hooks/use-debounced.ts
 */

import { renderHook, act } from '@testing-library/react-native';
import {
  useDebouncedValue,
  useDebouncedCallback,
  useThrottledCallback,
} from '@/hooks/use-debounced';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('devrait retourner la valeur initiale', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('devrait débouncer les changements de valeur', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial'); // Pas encore mis à jour

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('devrait annuler le debounce si la valeur change avant le délai', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'first' });
    act(() => {
      jest.advanceTimersByTime(250);
    });

    rerender({ value: 'second' });
    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current).toBe('initial'); // Pas encore mis à jour

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current).toBe('second');
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('devrait débouncer les appels de fonction', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('devrait passer les arguments correctement', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current('arg1', 'arg2');
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('useThrottledCallback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('devrait throttler les appels de fonction', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useThrottledCallback(callback, 1000));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('devrait permettre un appel immédiat si le délai est écoulé', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useThrottledCallback(callback, 1000));

    act(() => {
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });
});

