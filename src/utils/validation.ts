/**
 * Maya Connect V2 — Zod Validation Schemas
 *
 * Reusable schemas for react-hook-form + zod resolver.
 */
import { z } from 'zod';

/* ------------------------------------------------------------------ */
/*  Shared patterns                                                    */
/* ------------------------------------------------------------------ */
const emailSchema = z
  .string({ error: 'Adresse e-mail requise' })
  .min(1, 'Adresse e-mail requise')
  .email('Adresse e-mail invalide');

const passwordSchema = z
  .string({ error: 'Mot de passe requis' })
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(
    /[^A-Za-z0-9]/,
    'Le mot de passe doit contenir au moins un caractère spécial',
  );

const nameSchema = (label: string) =>
  z
    .string({ error: `${label} requis` })
    .min(2, `${label} doit contenir au moins 2 caractères`)
    .max(50, `${label} ne peut dépasser 50 caractères`);

const phoneSchema = z
  .string()
  .regex(
    /^(\+33|0)[1-9](\d{2}){4}$/,
    'Numéro de téléphone invalide (format français)',
  )
  .optional()
  .or(z.literal(''));

/* ------------------------------------------------------------------ */
/*  Auth Schemas                                                       */
/* ------------------------------------------------------------------ */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: 'Mot de passe requis' }).min(1, 'Mot de passe requis'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: nameSchema('Prénom'),
    lastName: nameSchema('Nom'),
    email: emailSchema,
    phoneNumber: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string({ error: 'Confirmation requise' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });
export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const verifyCodeSchema = z.object({
  code: z
    .string({ error: 'Code requis' })
    .length(6, 'Le code doit contenir 6 chiffres')
    .regex(/^\d{6}$/, 'Le code doit contenir uniquement des chiffres'),
});
export type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({ error: 'Confirmation requise' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/* ------------------------------------------------------------------ */
/*  Profile Schema                                                     */
/* ------------------------------------------------------------------ */
export const profileSchema = z.object({
  firstName: nameSchema('Prénom'),
  lastName: nameSchema('Nom'),
  phoneNumber: phoneSchema,
});
export type ProfileFormData = z.infer<typeof profileSchema>;

/* ------------------------------------------------------------------ */
/*  QR Validation Schema                                               */
/* ------------------------------------------------------------------ */
export const qrValidateSchema = z.object({
  amountGross: z
    .number({ error: 'Montant requis' })
    .positive('Le montant doit être positif'),
  personsCount: z
    .number({ error: 'Nombre de personnes requis' })
    .int()
    .min(1, 'Au moins 1 personne'),
});
export type QrValidateFormData = z.infer<typeof qrValidateSchema>;
