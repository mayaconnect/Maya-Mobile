/**
 * Utilitaires de validation
 */

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide un mot de passe (minimum 8 caractères, au moins une majuscule, une minuscule et un chiffre)
 */
export function isValidPassword(password: string): boolean {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber;
}

/**
 * Valide un numéro de téléphone français
 */
export function isValidFrenchPhone(phone: string): boolean {
  // Supprime les espaces, tirets et points
  const cleaned = phone.replace(/[\s.-]/g, '');
  // Format: 10 chiffres commençant par 0, ou format international +33
  const phoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[0-9]{8})$/;
  return phoneRegex.test(cleaned);
}

/**
 * Valide une date
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Valide qu'une date est dans le passé (pour date de naissance par exemple)
 */
export function isPastDate(dateString: string): boolean {
  if (!isValidDate(dateString)) return false;
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
}

/**
 * Valide qu'une date est dans le futur
 */
export function isFutureDate(dateString: string): boolean {
  if (!isValidDate(dateString)) return false;
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
}

/**
 * Valide qu'une valeur n'est pas vide
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

/**
 * Valide qu'un nombre est dans une plage
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Valide une URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valide un code postal français (5 chiffres)
 */
export function isValidFrenchPostalCode(postalCode: string): boolean {
  const postalCodeRegex = /^\d{5}$/;
  return postalCodeRegex.test(postalCode);
}

/**
 * Messages d'erreur de validation
 */
export const ValidationMessages = {
  EMAIL_INVALID: 'Veuillez entrer une adresse email valide',
  EMAIL_REQUIRED: 'L\'adresse email est requise',
  PASSWORD_TOO_SHORT: 'Le mot de passe doit contenir au moins 8 caractères',
  PASSWORD_WEAK: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
  PASSWORD_REQUIRED: 'Le mot de passe est requis',
  PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas',
  PHONE_INVALID: 'Veuillez entrer un numéro de téléphone valide',
  DATE_INVALID: 'Veuillez entrer une date valide',
  DATE_FUTURE: 'La date doit être dans le futur',
  DATE_PAST: 'La date doit être dans le passé',
  REQUIRED: 'Ce champ est requis',
  URL_INVALID: 'Veuillez entrer une URL valide',
  POSTAL_CODE_INVALID: 'Veuillez entrer un code postal valide (5 chiffres)',
} as const;

