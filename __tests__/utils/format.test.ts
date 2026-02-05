/**
 * Tests pour utils/format.ts
 */

import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  formatDuration,
  formatDistance,
  formatFrenchPhone,
  truncate,
  capitalize,
  formatPercent,
} from '@/utils/format';

describe('format', () => {
  describe('formatCurrency', () => {
    it('devrait formater un montant en euros', () => {
      expect(formatCurrency(1234.56)).toMatch(/1[\s\u00a0]234,56[\s\u00a0]€/);
      expect(formatCurrency(0)).toMatch(/0,00[\s\u00a0]€/);
      expect(formatCurrency(100)).toMatch(/100,00[\s\u00a0]€/);
    });

    it('devrait accepter une devise personnalisée', () => {
      expect(formatCurrency(100, 'USD')).toContain('100');
    });
  });

  describe('formatNumber', () => {
    it('devrait formater un nombre sans décimales', () => {
      expect(formatNumber(1234)).toMatch(/1[\s\u00a0]234/);
      expect(formatNumber(0)).toBe('0');
    });

    it('devrait formater un nombre avec décimales', () => {
      expect(formatNumber(1234.56, 2)).toMatch(/1[\s\u00a0]234,56/);
      expect(formatNumber(1234.5, 1)).toMatch(/1[\s\u00a0]234,5/);
    });
  });

  describe('formatDate', () => {
    it('devrait formater une date', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('janvier');
      expect(formatted).toContain('15');
    });

    it('devrait accepter une date en string', () => {
      const formatted = formatDate('2024-01-15');
      expect(formatted).toContain('2024');
    });

    it('devrait accepter des options personnalisées', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, { year: 'numeric', month: 'short' });
      expect(formatted).toContain('2024');
    });
  });

  describe('formatDateTime', () => {
    it('devrait formater une date et heure', () => {
      const date = new Date('2024-01-15T14:30:00');
      const formatted = formatDateTime(date);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('14');
      expect(formatted).toContain('30');
    });
  });

  describe('formatRelativeDate', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('devrait retourner "À l\'instant" pour les dates récentes', () => {
      const now = new Date();
      jest.setSystemTime(now);
      expect(formatRelativeDate(now)).toBe("À l'instant");
    });

    it('devrait formater les minutes', () => {
      const now = new Date();
      jest.setSystemTime(now);
      const past = new Date(now.getTime() - 30 * 60 * 1000);
      expect(formatRelativeDate(past)).toBe('Il y a 30 minutes');
    });

    it('devrait formater les heures', () => {
      const now = new Date();
      jest.setSystemTime(now);
      const past = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatRelativeDate(past)).toBe('Il y a 2 heures');
    });

    it('devrait formater les jours', () => {
      const now = new Date();
      jest.setSystemTime(now);
      const past = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(past)).toBe('Il y a 3 jours');
    });

    it('devrait formater les semaines', () => {
      const now = new Date();
      jest.setSystemTime(now);
      const past = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(past)).toBe('Il y a 2 semaines');
    });

    it('devrait formater les mois', () => {
      const now = new Date();
      jest.setSystemTime(now);
      const past = new Date(now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(past)).toBe('Il y a 2 mois');
    });

    it('devrait formater les années', () => {
      const now = new Date();
      jest.setSystemTime(now);
      const past = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(past)).toBe('Il y a 2 ans');
    });
  });

  describe('formatDuration', () => {
    it('devrait formater les minutes', () => {
      expect(formatDuration(30)).toBe('30 min');
      expect(formatDuration(0)).toBe('0 min');
    });

    it('devrait formater les heures', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
    });

    it('devrait formater les heures et minutes', () => {
      expect(formatDuration(90)).toBe('1h30min');
      expect(formatDuration(150)).toBe('2h30min');
    });
  });

  describe('formatDistance', () => {
    it('devrait formater les mètres', () => {
      expect(formatDistance(500)).toBe('500 m');
      expect(formatDistance(0)).toBe('0 m');
    });

    it('devrait formater les kilomètres', () => {
      expect(formatDistance(1500)).toBe('1.5 km');
      expect(formatDistance(2000)).toBe('2.0 km');
    });
  });

  describe('formatFrenchPhone', () => {
    it('devrait formater un numéro avec +33', () => {
      expect(formatFrenchPhone('+33123456789')).toBe('+33 1 23 45 67 89');
    });

    it('devrait formater un numéro commençant par 0', () => {
      expect(formatFrenchPhone('0123456789')).toBe('01 23 45 67 89');
    });

    it('devrait retourner le numéro tel quel si format invalide', () => {
      expect(formatFrenchPhone('123')).toBe('123');
    });
  });

  describe('truncate', () => {
    it('devrait tronquer un texte long', () => {
      expect(truncate('Hello World', 5)).toBe('He...');
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('devrait accepter un suffixe personnalisé', () => {
      expect(truncate('Hello World', 5, '…')).toBe('Hell…');
    });
  });

  describe('capitalize', () => {
    it('devrait capitaliser la première lettre', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
    });

    it('devrait retourner une chaîne vide si vide', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('formatPercent', () => {
    it('devrait formater un pourcentage', () => {
      expect(formatPercent(50)).toBe('50%');
      expect(formatPercent(50.5, 1)).toBe('50.5%');
    });
  });
});

