/**
 * Tests pour utils/validation.ts
 */

import {
  isValidEmail,
  isValidPassword,
  isValidFrenchPhone,
  isValidDate,
  isPastDate,
  isFutureDate,
  isNotEmpty,
  isInRange,
  isValidUrl,
  isValidFrenchPostalCode,
  ValidationMessages,
} from '@/utils/validation';

describe('validation', () => {
  describe('isValidEmail', () => {
    it('devrait valider des emails valides', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.com')).toBe(true);
    });

    it('devrait rejeter des emails invalides', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('devrait valider des mots de passe valides', () => {
      expect(isValidPassword('Password123')).toBe(true);
      expect(isValidPassword('MyP@ssw0rd')).toBe(true);
    });

    it('devrait rejeter des mots de passe trop courts', () => {
      expect(isValidPassword('Pass123')).toBe(false);
    });

    it('devrait rejeter des mots de passe sans majuscule', () => {
      expect(isValidPassword('password123')).toBe(false);
    });

    it('devrait rejeter des mots de passe sans minuscule', () => {
      expect(isValidPassword('PASSWORD123')).toBe(false);
    });

    it('devrait rejeter des mots de passe sans chiffre', () => {
      expect(isValidPassword('Password')).toBe(false);
    });
  });

  describe('isValidFrenchPhone', () => {
    it('devrait valider des numéros français valides', () => {
      expect(isValidFrenchPhone('0123456789')).toBe(true);
      expect(isValidFrenchPhone('+33123456789')).toBe(true);
      expect(isValidFrenchPhone('0033123456789')).toBe(true);
      expect(isValidFrenchPhone('01 23 45 67 89')).toBe(true);
      expect(isValidFrenchPhone('01-23-45-67-89')).toBe(true);
    });

    it('devrait rejeter des numéros invalides', () => {
      expect(isValidFrenchPhone('123')).toBe(false);
      expect(isValidFrenchPhone('012345678')).toBe(false);
      expect(isValidFrenchPhone('01234567890')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('devrait valider des dates valides', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2024-01-15T10:30:00')).toBe(true);
    });

    it('devrait rejeter des dates invalides', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('2024-13-45')).toBe(false);
    });
  });

  describe('isPastDate', () => {
    it('devrait retourner true pour des dates passées', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      expect(isPastDate(pastDate.toISOString())).toBe(true);
    });

    it('devrait retourner false pour des dates futures', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isPastDate(futureDate.toISOString())).toBe(false);
    });

    it('devrait retourner false pour des dates invalides', () => {
      expect(isPastDate('invalid')).toBe(false);
    });
  });

  describe('isFutureDate', () => {
    it('devrait retourner true pour des dates futures', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isFutureDate(futureDate.toISOString())).toBe(true);
    });

    it('devrait retourner false pour des dates passées', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      expect(isFutureDate(pastDate.toISOString())).toBe(false);
    });

    it('devrait retourner false pour des dates invalides', () => {
      expect(isFutureDate('invalid')).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('devrait retourner true pour des chaînes non vides', () => {
      expect(isNotEmpty('test')).toBe(true);
      expect(isNotEmpty('  test  ')).toBe(true);
    });

    it('devrait retourner false pour des chaînes vides', () => {
      expect(isNotEmpty('')).toBe(false);
      expect(isNotEmpty('   ')).toBe(false);
      expect(isNotEmpty(null)).toBe(false);
      expect(isNotEmpty(undefined)).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('devrait retourner true pour des valeurs dans la plage', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
    });

    it('devrait retourner false pour des valeurs hors plage', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('devrait valider des URLs valides', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('devrait rejeter des URLs invalides', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('isValidFrenchPostalCode', () => {
    it('devrait valider des codes postaux français valides', () => {
      expect(isValidFrenchPostalCode('75001')).toBe(true);
      expect(isValidFrenchPostalCode('13000')).toBe(true);
    });

    it('devrait rejeter des codes postaux invalides', () => {
      expect(isValidFrenchPostalCode('1234')).toBe(false);
      expect(isValidFrenchPostalCode('123456')).toBe(false);
      expect(isValidFrenchPostalCode('abcde')).toBe(false);
    });
  });

  describe('ValidationMessages', () => {
    it('devrait contenir tous les messages de validation', () => {
      expect(ValidationMessages.EMAIL_INVALID).toBeDefined();
      expect(ValidationMessages.PASSWORD_TOO_SHORT).toBeDefined();
      expect(ValidationMessages.REQUIRED).toBeDefined();
    });
  });
});

