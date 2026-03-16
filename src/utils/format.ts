/**
 * Maya Connect V2 — Formatting Utilities
 */

/** Format a price amount to EUR string: "12,50 €" */
export const formatPrice = (amount: number): string =>
  `${amount.toFixed(2).replace('.', ',')} €`;

/** Format a percentage: "15 %" */
export const formatPercent = (value: number): string =>
  `${Math.round(value)} %`;

/** Format a date to French locale: "12 janv. 2025" */
export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/** Format a date + time: "12 janv. 2025, 14:30" */
export const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Relative time: "il y a 3 minutes", "il y a 2 jours" */
export const formatRelativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(months / 12);
  return `il y a ${years} an${years > 1 ? 's' : ''}`;
};

/** Truncate text with ellipsis */
export const truncate = (text: string, maxLength: number): string =>
  text.length <= maxLength ? text : `${text.slice(0, maxLength)}…`;

/** Capitalize first letter */
export const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

/** Format full name */
export const formatName = (
  firstName?: string | null,
  lastName?: string | null,
): string => {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.join(' ') || 'Utilisateur';
};

/** Format distance in km: "1,2 km" or "350 m" */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
};

/** Format large numbers: "1 234" */
export const formatNumber = (n: number): string =>
  n.toLocaleString('fr-FR');

/**
 * Map a plan code to a human-readable subscription label.
 * "SOLO" → "Solo (1 pers.)", "DUO" → "Duo (2 pers.)", "FAMILY" → "Family (4 pers.)"
 */
const PLAN_LABELS: Record<string, { label: string; seats: number }> = {
  SOLO: { label: 'Solo', seats: 1 },
  DUO: { label: 'Duo', seats: 2 },
  FAMILY: { label: 'Family', seats: 4 },
  VIP: { label: 'VIP', seats: 10 },
  ENTERPRISE: { label: 'Entreprise', seats: 10 },
};

export const formatPlanCode = (
  planCode?: string | null,
  personsCount?: number | null,
): string => {
  if (!planCode) {
    return personsCount ? `${personsCount} pers.` : '1 pers.';
  }
  const plan = PLAN_LABELS[planCode.toUpperCase()];
  if (plan) return `${plan.label} (${personsCount ?? plan.seats} pers.)`;
  // Theme-based or unknown plans
  return `${planCode} (${personsCount ?? 1} pers.)`;
};

/** Get just the plan label without persons count */
export const formatPlanLabel = (planCode?: string | null): string => {
  if (!planCode) return 'Abonnement';
  const plan = PLAN_LABELS[planCode.toUpperCase()];
  return plan?.label ?? planCode;
};

/**
 * Format client name as short form: "Y.Lh"
 * Takes "Yassine Lharoti" → "Y.Lh"
 * Takes "Jean" → "J."
 * Falls back to placeholder if empty.
 */
export const formatClientNameShort = (
  fullName?: string | null,
  fallback = 'Client',
): string => {
  if (!fullName || !fullName.trim()) return fallback;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return `${parts[0].charAt(0).toUpperCase()}.`;
  }
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastShort = parts[parts.length - 1].slice(0, 2);
  return `${firstInitial}.${lastShort.charAt(0).toUpperCase()}${lastShort.slice(1)}`;
};
