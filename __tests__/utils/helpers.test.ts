/**
 * Tests pour utils/helpers.ts
 */

import {
  delay,
  retry,
  debounce,
  throttle,
  isDefined,
  defaultValue,
  pickDefined,
  omitNullish,
  groupBy,
  sortBy,
  generateId,
  shallowEqual,
} from '@/utils/helpers';

describe('helpers', () => {
  describe('delay', () => {
    it('devrait retarder l\'exécution', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });

  describe('retry', () => {
    it('devrait réussir au premier essai', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('devrait réessayer en cas d\'erreur', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce('success');
      const result = await retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('devrait échouer après maxAttempts', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Error'));
      await expect(retry(fn, 2, 10)).rejects.toThrow('Error');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('devrait débouncer une fonction', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('devrait throttler une fonction', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('isDefined', () => {
    it('devrait retourner true pour des valeurs définies', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('devrait retourner false pour null ou undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('defaultValue', () => {
    it('devrait retourner la valeur si définie', () => {
      expect(defaultValue('test', 'default')).toBe('test');
      expect(defaultValue(0, 10)).toBe(0);
    });

    it('devrait retourner la valeur par défaut si null/undefined', () => {
      expect(defaultValue(null, 'default')).toBe('default');
      expect(defaultValue(undefined, 'default')).toBe('default');
    });
  });

  describe('pickDefined', () => {
    it('devrait retourner seulement les clés définies', () => {
      const obj = {
        a: 1,
        b: null,
        c: undefined,
        d: 'test',
      };
      const result = pickDefined(obj);
      expect(result).toEqual({ a: 1, d: 'test' });
    });
  });

  describe('omitNullish', () => {
    it('devrait omettre les valeurs null/undefined', () => {
      const obj = {
        a: 1,
        b: null,
        c: undefined,
        d: 'test',
        e: 0,
        f: false,
      };
      const result = omitNullish(obj);
      expect(result).toEqual({ a: 1, d: 'test', e: 0, f: false });
    });
  });

  describe('groupBy', () => {
    it('devrait grouper un tableau par clé', () => {
      const array = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 },
      ];
      const result = groupBy(array, 'category');
      expect(result).toEqual({
        A: [{ category: 'A', value: 1 }, { category: 'A', value: 3 }],
        B: [{ category: 'B', value: 2 }],
      });
    });
  });

  describe('sortBy', () => {
    it('devrait trier un tableau par clé (asc)', () => {
      const array = [
        { value: 3 },
        { value: 1 },
        { value: 2 },
      ];
      const result = sortBy(array, 'value', 'asc');
      expect(result).toEqual([
        { value: 1 },
        { value: 2 },
        { value: 3 },
      ]);
    });

    it('devrait trier un tableau par clé (desc)', () => {
      const array = [
        { value: 1 },
        { value: 3 },
        { value: 2 },
      ];
      const result = sortBy(array, 'value', 'desc');
      expect(result).toEqual([
        { value: 3 },
        { value: 2 },
        { value: 1 },
      ]);
    });
  });

  describe('generateId', () => {
    it('devrait générer un ID unique', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('devrait accepter un préfixe', () => {
      const id = generateId('test');
      expect(id).toContain('test_');
    });
  });

  describe('shallowEqual', () => {
    it('devrait retourner true pour des objets égaux', () => {
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(shallowEqual(1, 1)).toBe(true);
      expect(shallowEqual('test', 'test')).toBe(true);
    });

    it('devrait retourner false pour des objets différents', () => {
      expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(shallowEqual({ a: 1 }, { b: 1 })).toBe(false);
      expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('devrait gérer null et undefined', () => {
      expect(shallowEqual(null, null)).toBe(true);
      expect(shallowEqual(undefined, undefined)).toBe(true);
      expect(shallowEqual(null, undefined)).toBe(false);
    });
  });
});

