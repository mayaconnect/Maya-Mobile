 # Maya Connect V2 — Plan Complet de Refonte Mobile

> **Date** : 3 Mars 2026
> **Objectif** : Recréer l'application Maya Connect from scratch avec un code propre, des packages à jour (0 vulnérabilités), un design professionnel (orange/violet) et une architecture solide pour la production iOS & Android.

---

## Table des matières

1. [Analyse de l'existant](#1-analyse-de-lexistant)
2. [Personas & Parcours utilisateur](#2-personas--parcours-utilisateur)
3. [Liste complète des fonctionnalités](#3-liste-complète-des-fonctionnalités)
4. [Inventaire complet des API/Routes backend](#4-inventaire-complet-des-apiroutes-backend)
5. [Architecture technique V2](#5-architecture-technique-v2)
6. [Design System V2 (Orange/Violet)](#6-design-system-v2-orangeviolet)
7. [Arborescence des pages V2](#7-arborescence-des-pages-v2)
8. [Plan d'implémentation — Phase par Phase](#8-plan-dimplémentation--phase-par-phase)
9. [Standards de qualité & Production Readiness](#9-standards-de-qualité--production-readiness)

---

## 1. Analyse de l'existant

### Stack actuelle
| Élément | Technologie |
|---------|-------------|
| Framework | React Native + Expo SDK 53 |
| Langage | TypeScript |
| Navigation | Expo Router (file-based) |
| État | Hooks + Context (pas de state manager) |
| Auth | JWT custom + Google OAuth (PKCE) |
| Paiements | Stripe Checkout Sessions |
| Maps | Leaflet.js via WebView (hack) |
| QR Code | `react-native-qrcode-svg` + Camera |
| Stockage local | AsyncStorage |

### Problèmes identifiés (code smells)
- Fichiers trop volumineux (SignupScreen = 1182 lignes, PartnersScreen = 2045 lignes, SubscriptionScreen = 1955 lignes)
- Logique métier mélangée dans les composants UI
- Services dupliqués (auth.service.ts + features/auth/services + hooks/use-auth.tsx)
- Types dupliqués entre `types/shared.ts` et chaque `features/*/types.ts`
- API base URLs incohérentes (`/api` vs `/api/v1`)
- Maps via WebView/Leaflet au lieu de `react-native-maps` natif
- Pas de state manager global (prop drilling, context imbriqués)
- Pas de validation de formulaire structurée (Zod/Yup)
- Pas de tests E2E, coverage faible
- Packages avec vulnérabilités connues
- Patches manuels multiples (15+ patch-package)

---

## 2. Personas & Parcours utilisateur

### Persona 1 : Client (Consommateur)
> Un utilisateur qui s'abonne à Maya Connect pour bénéficier de réductions chez les partenaires.

**Parcours :**
```
Onboarding → Inscription/Connexion → Souscrire un abonnement → Accéder au QR Code
→ Présenter le QR en magasin → Recevoir la réduction → Consulter l'historique
```

**Capacités :**
- Connexion par email/mot de passe OU Google Sign-In OU Apple Sign-In
- Inscription en 3 étapes (infos perso → sécurité → adresse)
- Réinitialisation de mot de passe en 4 étapes
- Voir le dashboard (économies, transactions, partenaires)
- Générer/Afficher son QR Code (avec timer de validité)
- Partager son QR Code (PDF)
- Parcourir les partenaires (grille, liste, carte)
- Filtrer par catégorie (Restaurant, Café, Shopping, Sport, Beauté)
- Voir les détails d'un partenaire (horaires, promotions, itinéraire)
- Souscrire à un abonnement (Solo / Duo / Family)
- Gérer son abonnement (voir, annuler)
- Consulter l'historique des transactions
- Voir les économies par catégorie
- Gérer son profil (avatar, infos personnelles)
- Carte des magasins à proximité avec géolocalisation

### Persona 2 : Partenaire / Opérateur de magasin
> Un gérant ou employé d'un commerce partenaire qui valide les réductions des clients Maya.

**Parcours :**
```
Connexion (rôle partner) → Sélectionner le magasin actif → Scanner le QR du client
→ Saisir le montant → Appliquer la réduction → Consulter l'historique
```

**Capacités :**
- Connexion par email/mot de passe (rôle partner)
- Sélection obligatoire du magasin actif au démarrage
- Dashboard avec KPIs (CA mensuel, scans du jour, clients uniques)
- Scanner le QR Code d'un client
- Voir les informations du client (nom, abonnement, % réduction)
- Saisir le montant brut et voir le calcul de la réduction automatique
- Valider la transaction
- Historique des transactions (filtre : jour, semaine, mois)
- Gestion des magasins (liste, détails, magasin actif)
- Profil du magasin actif
- Déconnexion

---

## 3. Liste complète des fonctionnalités

### 3.1 Onboarding (4 écrans)
| # | Fonctionnalité | Description |
|---|---------------|-------------|
| F01 | Slide 1 — Bienvenue | Logo Maya + description de l'app |
| F02 | Slide 2 — Paiements | Sécurité, paiement instantané, historique |
| F03 | Slide 3 — Offres | 500+ offres, 200+ partenaires, catégories |
| F04 | Slide 4 — Démarrage | CTA inscription/connexion |

### 3.2 Authentification
| # | Fonctionnalité | Description |
|---|---------------|-------------|
| F05 | Connexion email/mdp | Login avec rôle (client/partner) |
| F06 | Connexion Google | OAuth 2.0 PKCE flow |
| F07 | Connexion Apple | Apple Sign-In (iOS natif) |
| F08 | Inscription 3 étapes | Infos perso → Email/MDP → Adresse |
| F09 | Réinitialisation MDP | Email → Code vérification → Nouveau MDP |
| F10 | Persistance session | Auto-login + refresh token |
| F11 | Détection rôle | Redirection auto client/partner |

### 3.3 Home Client
| # | Fonctionnalité | Description |
|---|---------------|-------------|
| F12 | Dashboard client | Header bienvenue + avatar |
| F13 | Carte QR rapide | Mini QR code avec timer d'expiration |
| F14 | Actions rapides | Boutons "Scanner QR" et "Partenaires" |
| F15 | Cartes statistiques | Total économies / Transactions / Partenaires visités |
| F16 | Transactions récentes | 2 dernières transactions avec détails |
| F17 | Magasins proches | Top 3 magasins + géolocalisation |
| F18 | Offres proches | Top 2 promotions actives à proximité |
| F19 | Modal historique | Liste complète + économies par catégorie |

### 3.4 QR Code Client
| # | Fonctionnalité | Description |
|---|---------------|-------------|
| F20 | Génération QR | Token QR avec durée de validité |
| F21 | Affichage plein écran | QR grand format + timer countdown |
| F22 | Rafraîchissement auto | Nouveau token à expiration |
| F23 | Partage QR (PDF) | Export PDF du QR code |
| F24 | Gate abonnement | Accès QR uniquement si abonnement actif |

### 3.5 Partenaires
| # | Fonctionnalité | Description |
|---|---------------|-------------|
| F25 | Liste partenaires | Vue grille 2 colonnes avec images |
| F26 | Vue liste | Vue liste verticale |
| F27 | Vue carte | Carte interactive avec marqueurs |
| F28 | Recherche | Barre de recherche textuelle |
| F29 | Filtres catégories | Restaurant, Café, Shopping, Sport, Beauté |
| F30 | Détail partenaire | Modal : horaires, adresse, promo, note |
| F31 | Itinéraire | Lien vers Apple Maps / Google Maps |

### 3.6 Abonnement
| # | Fonctionnalité | Description |
|---|---------------|-------------|
| F32 | Plans d'abonnement | Solo (1 pers) / Duo (2 pers) / Family (4 pers) |
| F33 | Toggle mensuel/annuel | Choix cycle de facturation |
| F34 | Comparaison features | Tableau avantages par plan |
| F35 | Checkout Stripe | Paiement via Stripe in-app browser |
| F36 | Deep link retour | `maya://subscription/success` → Confirmation |
| F37 | Statut abonnement | Affichage plan actif + dates |
| F38 | Annulation | Annuler l'abonnement depuis le profil |

### 3.7 Historique
| # | Fonctionnalité | Description |
|---|---------------|-------------|
| F39 | Liste transactions | Historique complet chronologique |
| F40 | Économies par catégorie | Graphique répartition des économies |
| F41 | Pull-to-refresh | Actualisation manuelle |

### 3.8 Profil Client
| # | Fonctionnalité | Description |
|---|---------------|-------------|
| F42 | Avatar | Upload / Suppression photo de profil |
| F43 | Badge abonnement | Affichage plan actif |
| F44 | Informations perso | Nom, email, téléphone, date naissance |
| F45 | Modifier profil | Édition nom, adresse |
| F46 | Section abonnement | Voir / Gérer / Annuler abonnement |
| F47 | Déconnexion | Suppression tokens + redirection login |

### 3.9 Carte des magasins
| # | Fonctionnalité | Description |
|---|---------------|-------------|
| F48 | Carte interactive | Map plein écran avec marqueurs |
| F49 | Géolocalisation | Position actuelle de l'utilisateur |
| F50 | Détail magasin | Modal au tap sur marqueur |
| F51 | Itinéraire | Lien vers navigation GPS |

### 3.10 Partner Home (Opérateur)
| # | Fonctionnalité | Description |
|---|---------------|-------------|
| F52 | Sélection magasin | Modal obligatoire au démarrage |
| F53 | Dashboard KPIs | CA mensuel / Scans du jour / Clients uniques |
| F54 | Action scanner | Bouton CTA "Scanner client" |
| F55 | Scans récents | 5 derniers scans avec détails |
| F56 | Scanner QR | Caméra + lecture token |
| F57 | Info client scané | Nom, plan abonnement, % réduction |
| F58 | Saisie montant | Input montant brut → calcul réduction |
| F59 | Validation transaction | Confirmation + envoi API |
| F60 | Historique partenaire | Transactions filtrables (jour/semaine/mois) |
| F61 | Recherche transactions | Recherche par nom client |
| F62 | Gestion magasins | Liste magasins + changement magasin actif |
| F63 | Profil magasin | Détails du magasin actif |
| F64 | Activité récente | Feed d'activité du partenaire |
| F65 | Déconnexion partner | Suppression session + retour login |

---

## 4. Inventaire complet des API/Routes backend

> **Base URL** : `{EXPO_PUBLIC_API_BASE_URL}` — Toutes les routes ci-dessous doivent être conservées à l'identique.

### 4.1 Authentification (`/api/v1/auth`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|:----:|
| POST | `/auth/login` | Connexion email/mdp | Non |
| POST | `/auth/register` | Inscription | Non |
| POST | `/auth/google` | Connexion Google (idToken) | Non |
| POST | `/auth/refresh` | Refresh du JWT | Non (refresh token) |
| POST | `/auth/logout` | Déconnexion | Oui |
| GET | `/auth/me` | Profil utilisateur courant | Oui |
| PUT | `/auth/me` | Mise à jour profil | Oui |
| POST | `/auth/upload-avatar` | Upload avatar (multipart) | Oui |
| DELETE | `/auth/remove-avatar` | Supprimer avatar | Oui |
| GET | `/auth/avatar` | Récupérer l'avatar (avec token) | Oui |
| POST | `/auth/request-password-reset` | Étape 1 : vérifier email | Non |
| POST | `/auth/request-password-reset-code` | Étape 2 : envoyer code | Non |
| POST | `/auth/verify-password-reset-code` | Étape 3 : vérifier code | Non |
| POST | `/auth/reset-password` | Étape 4 : nouveau mdp | Non |

### 4.2 QR Code (`/api/qr`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|:----:|
| POST | `/qr/issue-token-frontend` | Générer un token QR (userId) | Oui |
| GET | `/qr/current` | QR valide actuel | Oui |
| GET | `/qr/token-info?token={token}` | Infos client depuis le token | Oui |
| POST | `/qr/validate` | Valider une transaction QR | Oui |

**Payload POST `/qr/validate` :**
```json
{
  "partnerId": "string",
  "storeId": "string",
  "operatorUserId": "string",
  "qrToken": "string",
  "amountGross": number
}
```

### 4.3 Partenaires (`/api/partners`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|:----:|
| GET | `/partners` | Liste tous les partenaires | Oui |
| GET | `/partners/{id}` | Partenaire par ID | Oui |
| GET | `/partners/{id}/details` | Détails complets partenaire | Oui |

### 4.4 Magasins (`/api/stores`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|:----:|
| POST | `/stores/search` | Recherche magasins (lat, lng, radius) | Oui |
| GET | `/stores/{id}` | Magasin par ID | Oui |
| GET | `/stores/me` | Mes magasins (partenaire) | Oui |

### 4.5 Opérateurs de magasins (`/api/v1/store-operators`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|:----:|
| GET | `/store-operators/active-store` | Magasin actif de l'opérateur | Oui |
| POST | `/store-operators/set-active-store` | Définir le magasin actif | Oui |

### 4.6 Transactions (`/api/transactions`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|:----:|
| GET | `/transactions/partner/{partnerId}` | Transactions du partenaire | Oui |
| GET | `/transactions/user/{userId}` | Transactions de l'utilisateur | Oui |
| GET | `/transactions/store/{storeId}/scancount` | Nombre de scans par magasin | Oui |
| GET | `/transactions/scancount` | Nombre total de scans | Oui |
| GET | `/transactions/filtered` | Transactions filtrées (dates) | Oui |

### 4.7 Abonnements (`/api/subscriptions` & `/api/Users`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|:----:|
| GET | `/subscriptions` | Liste abonnements | Oui |
| GET | `/subscriptions/plans` | Plans disponibles | Oui |
| GET | `/Users/me/has-subscription` | A un abonnement actif ? | Oui |
| GET | `/Users/me/subscription` | Détails abonnement actif | Oui |

### 4.8 Clients (`/api/clients`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|:----:|
| GET | `/clients/{id}` | Profil client | Oui |
| PUT | `/clients/{userId}` | Mettre à jour profil client | Oui |
| GET | `/clients/me/has-subscription` | A un abonnement ? | Oui |
| GET | `/clients/me/subscription` | Abonnement actif | Oui |

### 4.9 Paiements (`/api/payments`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|:----:|
| POST | `/payments/create-checkout-session` | Créer session Stripe | Oui |
| GET | `/payments/checkout-session/{sessionId}` | Statut session checkout | Oui |
| POST | `/payments/cancel-subscription` | Annuler abonnement | Oui |

**Payload POST `/payments/create-checkout-session` :**
```json
{
  "planId": "string",
  "billingCycle": "monthly|annual",
  "successUrl": "maya://subscription/success",
  "cancelUrl": "maya://subscription/cancel"
}
```

---

## 5. Architecture technique V2

### Stack V2
| Élément | Choix V2 | Justification |
|---------|----------|---------------|
| **Framework** | React Native + Expo SDK 53+ | Même base, dernière version stable |
| **Langage** | TypeScript 5.x (strict) | Typage strict pour moins de bugs |
| **Navigation** | Expo Router v4 | File-based routing |
| **State** | Zustand | Léger, performant, remplace Context |
| **Data Fetching** | TanStack Query (React Query) | Cache, retry, stale-while-revalidate |
| **HTTP Client** | Axios | Intercepteurs, timeout, retry natifs |
| **Formulaires** | React Hook Form + Zod | Validation structurée |
| **Maps** | `react-native-maps` | Natif (fini le WebView Leaflet) |
| **QR Code** | `react-native-qrcode-svg` | Génération QR |
| **QR Scanner** | `expo-camera` | Scanner natif |
| **Auth** | JWT + `expo-auth-session` + `expo-apple-authentication` | Google + Apple Sign-In |
| **Paiements** | Stripe via `WebBrowser` | Checkout sessions |
| **UI** | React Native Reanimated 3 + Custom Design System | Animations 60fps |
| **Icons** | `@expo/vector-icons` (Ionicons) | Set complet |
| **Stockage local** | `expo-secure-store` (tokens) + MMKV (cache) | Sécurité + performance |
| **Tests** | Jest + React Native Testing Library + Detox (E2E) | Coverage > 80% |
| **Linting** | ESLint flat config + Prettier | Code uniforme |
| **CI/CD** | EAS Build + EAS Submit | Production iOS + Android |

### Architecture des dossiers V2
```
maya-v2/
├── app/                          # Routes Expo Router
│   ├── _layout.tsx               # Root layout (providers)
│   ├── index.tsx                 # Splash / Auth gate
│   ├── onboarding/               # Onboarding screens
│   │   ├── index.tsx             # Slide 1
│   │   ├── step-2.tsx            # Slide 2
│   │   ├── step-3.tsx            # Slide 3
│   │   └── step-4.tsx            # Slide 4
│   ├── auth/                     # Auth screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (client)/                 # Client tab group
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── home.tsx
│   │   ├── partners/
│   │   │   ├── index.tsx         # Liste partenaires
│   │   │   └── [id].tsx          # Détail partenaire
│   │   ├── qrcode.tsx
│   │   ├── history.tsx
│   │   ├── subscription.tsx
│   │   ├── stores-map.tsx
│   │   └── profile.tsx
│   └── (partner)/                # Partner tab group
│       ├── _layout.tsx           # Tab navigator partner
│       ├── dashboard.tsx
│       ├── scanner.tsx
│       ├── history.tsx
│       ├── stores.tsx
│       └── profile.tsx
├── src/
│   ├── api/                      # Couche API centralisée
│   │   ├── client.ts             # Axios instance + intercepteurs
│   │   ├── auth.api.ts
│   │   ├── partners.api.ts
│   │   ├── stores.api.ts
│   │   ├── transactions.api.ts
│   │   ├── qr.api.ts
│   │   ├── subscriptions.api.ts
│   │   ├── payments.api.ts
│   │   └── clients.api.ts
│   ├── stores/                   # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── subscription.store.ts
│   │   └── partner.store.ts
│   ├── hooks/                    # Hooks métier
│   │   ├── use-auth.ts
│   │   ├── use-qr-code.ts
│   │   ├── use-partners.ts
│   │   ├── use-transactions.ts
│   │   ├── use-subscription.ts
│   │   ├── use-location.ts
│   │   └── use-network.ts
│   ├── components/               # Composants réutilisables
│   │   ├── ui/                   # Design System primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── TabBar.tsx
│   │   │   ├── GradientBackground.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── client/               # Composants spécifiques client
│   │   │   ├── QRCodeCard.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── TransactionItem.tsx
│   │   │   ├── PartnerCard.tsx
│   │   │   ├── PartnerMap.tsx
│   │   │   ├── SubscriptionPlanCard.tsx
│   │   │   └── CategoryFilter.tsx
│   │   └── partner/              # Composants spécifiques partner
│   │       ├── KPICard.tsx
│   │       ├── ScanResultCard.tsx
│   │       ├── ValidationModal.tsx
│   │       ├── StoreSelector.tsx
│   │       └── TransactionCard.tsx
│   ├── theme/                    # Design tokens
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── types/                    # Types centralisés
│   │   ├── auth.types.ts
│   │   ├── partner.types.ts
│   │   ├── store.types.ts
│   │   ├── transaction.types.ts
│   │   ├── subscription.types.ts
│   │   ├── qr.types.ts
│   │   └── api.types.ts
│   ├── utils/                    # Utilitaires
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   ├── storage.ts
│   │   └── responsive.ts
│   └── constants/
│       └── config.ts
├── assets/
│   ├── images/
│   ├── fonts/
│   └── animations/               # Lottie animations
├── __tests__/
├── app.json
├── tsconfig.json
├── package.json
└── eas.json
```

---

## 6. Design System V2 (Orange/Violet)

### Palette de couleurs
> Inspirée du logo Maya (puppy orange) avec des accents violet pour le premium.

```
COULEURS PRINCIPALES
┌─────────────────────────────────────────────────┐
│  🟠 Orange (Primary)        │  🟣 Violet (Accent)       │
│  #FF6B35 — CTA, boutons     │  #7C3AED — Premium, badges │
│  #FF8C5A — Hover/Active     │  #8B5CF6 — Light accent    │
│  #FFA07A — Subtle           │  #A78BFA — Très léger      │
│  #FFF3ED — Background soft  │  #F5F3FF — Background soft │
└─────────────────────────────────────────────────┘

NEUTRES
┌─────────────────────────────────────────────────┐
│  #0F172A — Texte principal (dark)               │
│  #334155 — Texte secondaire                     │
│  #64748B — Texte tertiaire / Icônes             │
│  #94A3B8 — Placeholder                          │
│  #CBD5E1 — Bordures                             │
│  #E2E8F0 — Dividers                             │
│  #F1F5F9 — Background cards                     │
│  #F8FAFC — Background page                      │
│  #FFFFFF — Blanc pur                            │
└─────────────────────────────────────────────────┘

SÉMANTIQUES
┌─────────────────────────────────────────────────┐
│  #10B981 — Succès (vert)                        │
│  #F59E0B — Warning (ambre)                      │
│  #EF4444 — Erreur (rouge)                       │
│  #3B82F6 — Info (bleu)                          │
└─────────────────────────────────────────────────┘

GRADIENTS
┌─────────────────────────────────────────────────┐
│  Primary:  #FF6B35 → #FF8C5A (orange chaud)     │
│  Accent:   #7C3AED → #8B5CF6 (violet premium)   │
│  Hero:     #FF6B35 → #7C3AED (orange→violet)     │
│  Dark:     #1E1B4B → #312E81 (fond sombre)       │
│  Sunset:   #FF6B35 → #F59E0B (orange→ambre)      │
└─────────────────────────────────────────────────┘
```

### Typographie
```
Famille : Inter (Google Fonts) — chargée via expo-font
├── Inter-Bold       → Titres (H1, H2)
├── Inter-SemiBold   → Sous-titres, boutons
├── Inter-Medium     → Corps, labels
├── Inter-Regular    → Texte courant
└── Inter-Light      → Captions, hints

Tailles (responsive) :
├── H1:   28px / line-height 36px
├── H2:   24px / line-height 32px
├── H3:   20px / line-height 28px
├── Body: 16px / line-height 24px
├── Small: 14px / line-height 20px
├── XS:    12px / line-height 16px
└── Micro: 10px / line-height 14px
```

### Composants UI clés
- **Boutons** : Filled (gradient orange), Outlined (bordure orange), Ghost (texte seul), Icon button
- **Cards** : Elevated (shadow), Flat (border), Gradient card (fond dégradé)
- **Inputs** : Standard (border bottom), Outlined (full border), Floating label
- **Badges** : Filled, Outlined, Dot indicator
- **Bottom Tab Bar** : Custom avec item central surélevé (QR/Scanner)
- **Modals** : Bottom sheet (react-native-bottom-sheet) + Full screen
- **Animations** : Lottie pour onboarding, Reanimated pour transitions

---

## 7. Arborescence des pages V2

### 7.1 Onboarding (4 pages)
```
📱 Page 1 — Splash Bienvenue
   Gradient Hero (orange→violet) + Logo Maya (puppy) + Titre + "Découvrir" CTA
   
📱 Page 2 — Paiements Sécurisés
   Illustration Lottie + 3 feature pills + Navigation dots
   
📱 Page 3 — Offres Exclusives
   Stats animées (500+ offres) + Category pills (Restaurant, Café...) + Parallax
   
📱 Page 4 — Prêt à Démarrer
   Testimonial card + CTA "Commencer" (gradient button) + "J'ai déjà un compte"
```

### 7.2 Authentification (3 pages)
```
📱 Login
   ┌─ Logo Maya en haut
   ├─ Toggle Client / Partenaire (segmented control)
   ├─ Email input (floating label)
   ├─ Password input (floating label + show/hide)
   ├─ "Mot de passe oublié ?" link
   ├─ Bouton "Se connecter" (gradient orange)
   ├─ Divider "ou continuer avec"
   ├─ Bouton Google (icône + texte)
   ├─ Bouton Apple (icône + texte) — iOS uniquement
   └─ "Pas de compte ? S'inscrire" link

📱 Signup (3 étapes avec progress bar)
   Step 1 — Infos personnelles
   ├─ Avatar picker (caméra/galerie)
   ├─ Prénom, Nom
   └─ Date de naissance (date picker)
   
   Step 2 — Sécurité
   ├─ Email
   ├─ Mot de passe (avec force meter)
   └─ Confirmation mot de passe
   
   Step 3 — Adresse
   ├─ Rue
   ├─ Ville, Code postal
   └─ Pays (picker)

📱 Mot de passe oublié (3 étapes)
   Step 1 — Saisie email
   Step 2 — Code de vérification (6 digits OTP input)
   Step 3 — Nouveau mot de passe (avec force meter)
```

### 7.3 Client — Onglets (5 tabs + pages cachées)
```
📱 Home (Tab 1 — icône Maison)
   ┌─ Header (Avatar + "Bonjour {Prénom}" + Notification bell)
   ├─ QR Code Card (mini card cliquable → page QR plein écran)
   │   └─ Timer d'expiration + status badge
   ├─ Quick Actions (2 boutons gradient)
   │   ├─ "Mon QR Code" → QR plein écran
   │   └─ "Partenaires" → Tab Partenaires
   ├─ Stats Cards (horizontally scrollable)
   │   ├─ 💰 Total économies (€) avec delta mensuel
   │   ├─ 📊 Nb transactions avec delta
   │   └─ 🏪 Partenaires visités avec delta
   ├─ Transactions récentes (2 items max)
   │   └─ "Voir tout" → Modal historique
   ├─ Magasins à proximité (3 items, cards horizontales)
   └─ Offres du moment (2 items, promo cards)

📱 Partenaires (Tab 2 — icône Magasin)
   ┌─ Header "Nos partenaires" + Toggle vue (Grille/Liste/Carte)
   ├─ Search bar avec icône
   ├─ Category chips (scroll horizontal)
   │   └─ Tous | Restaurant | Café | Shopping | Sport | Beauté
   ├─ Vue Grille (2 colonnes)
   │   └─ PartnerCard : image, nom, catégorie, note ★, distance, badge promo
   ├─ Vue Liste
   │   └─ Row : image thumb, nom, catégorie, distance, promo
   ├─ Vue Carte (react-native-maps natif)
   │   └─ Markers avec custom callout
   └─ Modal Détail Partenaire
       ├─ Image hero
       ├─ Nom, catégorie, note, statut (ouvert/fermé)
       ├─ Adresse + carte mini
       ├─ Promotion active (badge violet)
       └─ Bouton "Itinéraire" → Apple/Google Maps

📱 QR Code (Tab 3 — icône QR central surélevé)
   ┌─ Header "Mon QR Code"
   ├─ QR Code large (svg généré)
   ├─ Timer countdown avec progress ring
   ├─ Nom de l'utilisateur + plan abonnement
   ├─ Bouton "Rafraîchir"
   ├─ Bouton "Partager" (export PDF)
   └─ Gate : Si pas d'abonnement → CTA "Souscrire" → page Subscription

📱 Historique (Tab 4 — icône Horloge)
   ┌─ Header "Historique" + compteur total
   ├─ Économies par catégorie (bar chart horizontal)
   │   └─ Restaurant: XX€, Shopping: XX€, etc.
   ├─ Liste transactions (FlatList virtualisée)
   │   └─ TransactionItem : icône catégorie, magasin, date, montant brut/net, économie
   └─ Pull-to-refresh

📱 Profil (Tab 5 — icône Personne)
   ┌─ Header gradient avec avatar (large) + nom + badge abonnement
   ├─ Section Abonnement
   │   ├─ Si actif : Plan name, prix, dates, "Gérer" → Subscription page
   │   └─ Si inactif : CTA "Souscrire" (gradient card)
   ├─ Informations personnelles (tap → modal read + edit)
   ├─ Paramètres (notifications, thème, langue — v2.x)
   └─ Bouton Déconnexion (rouge subtle)

📱 Abonnement (page cachée, accessible via Home/Profil)
   ┌─ Header "Choisir mon plan"
   ├─ Toggle Mensuel / Annuel (segmented, annuel avec badge "-20%")
   ├─ 3 Plan Cards (swipeable)
   │   ├─ Solo — 1 personne — XX€/mois
   │   ├─ Duo — 2 personnes — XX€/mois (badge "Populaire")
   │   └─ Family — 4 personnes — XX€/mois (badge "Meilleur rapport")
   │   └─ Chaque card : features list + checkmarks + CTA "Choisir"
   ├─ Si abonnement actif : status card + bouton "Annuler"
   └─ Checkout → Stripe in-app browser → Deep link retour

📱 Carte des magasins (page cachée, accessible via Home)
   ┌─ Full screen react-native-maps
   ├─ User location marker (bleu pulsant)
   ├─ Store markers (orange pins)
   ├─ Controls (zoom +/-, recentrer)
   └─ Bottom sheet au tap → détail magasin + "Itinéraire"
```

### 7.4 Partner — Onglets (5 tabs)
```
📱 Dashboard (Tab 1 — icône Dashboard)
   ┌─ Header "Bonjour {Nom}" + magasin actif badge
   ├─ KPI Cards (3 cards)
   │   ├─ 💰 CA du mois (€) + delta vs mois précédent
   │   ├─ 📱 Scans aujourd'hui + delta vs hier
   │   └─ 👥 Clients uniques ce mois + delta
   ├─ Quick Action "Scanner un client" (grand bouton gradient)
   └─ 5 derniers scans (liste compacte)
       └─ Nom client, magasin, montant, réduction, date

📱 Scanner (Tab 2 — icône QR central surélevé)
   ┌─ Vue caméra plein écran
   ├─ Cadre de scan animé
   ├─ Flash toggle
   ├─ Résultat du scan → Modal validation
   │   ├─ Infos client (nom, plan, % réduction)
   │   ├─ Input montant brut
   │   ├─ Calcul auto : montant brut × (1 - discount%) = montant net
   │   ├─ Affichage : "Économie client : XX€"
   │   └─ Boutons "Annuler" / "Valider" (gradient)
   └─ Feedback haptic + animation succès (Lottie checkmark)

📱 Historique (Tab 3 — icône Horloge)
   ┌─ Magasin actif indicator
   ├─ Filtres période (Tous / Aujourd'hui / Semaine / Mois)
   ├─ Search bar
   └─ Liste transactions
       └─ Client name, store, date, montant brut/net, réduction, nb personnes

📱 Magasins (Tab 4 — icône Magasin)
   ┌─ Search bar
   ├─ Liste magasins (FlatList)
   │   └─ StoreCard : image, nom, adresse, catégorie, badge "Actif"
   └─ Tap → Modal détails magasin + "Définir comme actif"

📱 Mon Compte (Tab 5 — icône Personne)
   ┌─ Profil du magasin actif (image, nom, adresse, catégorie)
   ├─ Activité récente (feed)
   └─ Bouton Déconnexion
```

---

## 8. Plan d'implémentation — Phase par Phase

### Phase 0 : Setup projet (Jour 1-2)
- [ ] Créer le projet Expo avec `npx create-expo-app maya-v2 --template tabs`
- [ ] Configurer TypeScript strict mode
- [ ] Installer et configurer les dépendances core :
  - `zustand`, `@tanstack/react-query`, `axios`
  - `react-hook-form`, `zod`, `@hookform/resolvers`
  - `expo-router`, `expo-secure-store`
  - `react-native-reanimated`, `react-native-gesture-handler`
  - `react-native-safe-area-context`
  - `@expo/vector-icons`
- [ ] Setup ESLint (flat config) + Prettier
- [ ] Setup Jest + React Native Testing Library
- [ ] Configurer EAS Build (`eas.json`)
- [ ] Configurer `app.json` (bundleIdentifier, package, permissions)
- [ ] Créer la structure de dossiers

### Phase 1 : Design System & Theme (Jour 2-3)
- [ ] Implémenter le theme (colors, typography, spacing, borderRadius)
- [ ] Créer les composants UI primitifs :
  - `Button` (filled, outlined, ghost, icon)
  - `Input` (standard, outlined, floating label)
  - `Card` (elevated, flat, gradient)
  - `Badge`, `Avatar`, `Modal`, `SearchBar`
  - `TabBar` (client + partner variants)
  - `GradientBackground`, `LoadingSpinner`
  - `BottomSheet` (via `@gorhom/bottom-sheet`)
- [ ] Responsive utils (`responsive.ts`)
- [ ] Tester sur différentes tailles d'écran

### Phase 2 : Couche API & État (Jour 3-5)
- [ ] Créer l'instance Axios avec intercepteurs :
  - Auto-injection Bearer token
  - Refresh token sur 401
  - Retry avec backoff exponentiel
  - Logging en dev
- [ ] Implémenter tous les modules API :
  - `auth.api.ts` (toutes les routes `/auth/*`)
  - `qr.api.ts` (toutes les routes `/qr/*`)
  - `partners.api.ts` (routes `/partners/*`)
  - `stores.api.ts` (routes `/stores/*`)
  - `transactions.api.ts` (routes `/transactions/*`)
  - `subscriptions.api.ts` (routes `/subscriptions/*`, `/Users/me/*`)
  - `payments.api.ts` (routes `/payments/*`)
  - `clients.api.ts` (routes `/clients/*`)
  - `store-operators.api.ts` (routes `/store-operators/*`)
- [ ] Créer les Zustand stores :
  - `auth.store.ts` (user, tokens, isAuthenticated, role)
  - `subscription.store.ts` (plans, activeSubscription, hasSubscription)
  - `partner.store.ts` (activeStore, stores)
- [ ] Configurer TanStack Query (QueryClient, devtools)
- [ ] Types TypeScript centralisés pour toutes les entités

### Phase 3 : Authentification (Jour 5-8)
- [ ] Root layout avec providers (QueryClient, Zustand, Auth gate)
- [ ] Onboarding (4 écrans avec animations Lottie)
- [ ] Login screen (email/mdp + Google + Apple)
- [ ] Signup screen (3 étapes avec React Hook Form + Zod)
- [ ] Forgot password screen (3 étapes)
- [ ] Auth persistence (SecureStore pour tokens)
- [ ] Auto-refresh token
- [ ] Routing conditionnel (client vs partner)
- [ ] Tests unitaires auth

### Phase 4 : Home Client (Jour 8-11)
- [ ] Tab navigator client (5 onglets + item central QR)
- [ ] Home screen composée :
  - Welcome header avec avatar
  - QR Code card miniature
  - Quick actions
  - Stats cards (scrollable)
  - Transactions récentes
  - Magasins à proximité (géolocalisation)
  - Offres du moment
- [ ] QR Code screen plein écran
  - Génération via API
  - Timer countdown
  - Refresh automatique
  - Partage PDF
  - Gate abonnement
- [ ] Tests unitaires home + QR

### Phase 5 : Partenaires & Map (Jour 11-14)
- [ ] Partners screen avec 3 vues (grille, liste, carte)
- [ ] Recherche + filtres catégories
- [ ] Détail partenaire (bottom sheet)
- [ ] Intégration `react-native-maps` natif
- [ ] Stores map screen (plein écran)
- [ ] Géolocalisation (`expo-location`)
- [ ] "Itinéraire" → Apple Maps / Google Maps
- [ ] Tests

### Phase 6 : Abonnement & Paiements (Jour 14-16)
- [ ] Subscription screen :
  - 3 plans cards
  - Toggle mensuel/annuel
  - Comparaison features
- [ ] Intégration Stripe Checkout
- [ ] Deep link handling (`maya://subscription/success|cancel`)
- [ ] Vérification du statut session
- [ ] Annulation d'abonnement
- [ ] Tests paiement (mock Stripe)

### Phase 7 : Historique & Profil (Jour 16-18)
- [ ] History screen
  - Économies par catégorie
  - Liste virtualisée
- [ ] Profile screen
  - Avatar upload/remove
  - Infos personnelles (read + edit modal)
  - Section abonnement
  - Déconnexion
- [ ] Tests

### Phase 8 : Partner Home (Jour 18-22)
- [ ] Tab navigator partner (5 onglets + scanner central)
- [ ] Store selection modal (forcé au démarrage)
- [ ] Dashboard KPIs
- [ ] QR Scanner :
  - Vue caméra
  - Lecture token → fetch info client
  - Modal de validation (montant + calcul réduction)
  - Confirmation + animation succès
- [ ] Historique partenaire (filtres, recherche)
- [ ] Gestion magasins
- [ ] Profil partner / Déconnexion
- [ ] Tests scanner + validation

### Phase 9 : Polish & Production (Jour 22-26)
- [ ] Dark mode (automatique via système)
- [ ] Skeleton loaders pour tous les écrans
- [ ] Empty states illustrés
- [ ] Error boundaries globaux
- [ ] Animations de transition entre écrans
- [ ] Haptic feedback sur les interactions clés
- [ ] Offline mode (banner + queue sync)
- [ ] Performance audit (re-renders, memoization)
- [ ] Accessibility (a11y labels, contraste)
- [ ] i18n preparation (structure multilingue)

### Phase 10 : Tests & Sécurité (Jour 26-28)
- [ ] Tests unitaires — coverage > 80%
- [ ] Tests E2E avec Detox (flows critiques)
- [ ] Audit sécurité : `npm audit` = 0 vulnérabilités
- [ ] SecureStore pour tous les secrets
- [ ] Certificate pinning (optionnel)
- [ ] Obfuscation du code (Hermes)

### Phase 11 : Build & Déploiement (Jour 28-30)
- [ ] Configuration EAS Build profiles (development, preview, production)
- [ ] Build iOS + test TestFlight
- [ ] Build Android + test Internal Track
- [ ] Configuration App Store (screenshots, description, metadata)
- [ ] Configuration Google Play (listing, screenshots)
- [ ] Submit iOS (EAS Submit)
- [ ] Submit Android (EAS Submit)
- [ ] Monitoring (Sentry pour crash reporting)

---

## 9. Standards de qualité & Production Readiness

### Code Quality
| Critère | Objectif |
|---------|----------|
| TypeScript strict | `"strict": true`, aucun `any` |
| ESLint | 0 warnings, 0 errors |
| Prettier | Format uniforme |
| Fichiers | Max 300 lignes par fichier |
| Composants | Max 150 lignes par composant |
| Hooks | Logique extraite dans des hooks custom |
| Tests | Coverage > 80% (lignes) |
| npm audit | 0 vulnérabilités |

### Performance
| Critère | Objectif |
|---------|----------|
| TTI (Time to Interactive) | < 2s |
| FlatList | Virtualization partout |
| Re-renders | `React.memo` + `useMemo` + `useCallback` |
| Images | Lazy loading + cache |
| Bundle size | Tree-shaking + code splitting |
| Animations | 60fps via Reanimated (UI thread) |

### UX
| Critère | Objectif |
|---------|----------|
| Skeleton loaders | Sur chaque écran with data |
| Empty states | Illustrés et informatifs |
| Error states | Message clair + retry button |
| Offline | Banner + queue synchronisation |
| Haptic | Feedback tactile sur actions |
| Transitions | Smooth entre tous les écrans |

### Sécurité
| Critère | Objectif |
|---------|----------|
| Tokens | `expo-secure-store` (pas AsyncStorage) |
| Refresh | Auto-refresh transparent |
| API Keys | Variables d'environnement |
| Deep links | Validation des URLs |
| Inputs | Validation Zod côté client |

---

## Résumé des livrables

| # | Livrable | Phase | Durée estimée |
|---|----------|-------|---------------|
| 1 | Projet initialisé + Design System | Phase 0-1 | 3 jours |
| 2 | Couche API + État global | Phase 2 | 2 jours |
| 3 | Auth complète (login/signup/forgot/Google/Apple) | Phase 3 | 3 jours |
| 4 | Home Client + QR Code | Phase 4 | 3 jours |
| 5 | Partenaires + Maps | Phase 5 | 3 jours |
| 6 | Abonnement + Stripe | Phase 6 | 2 jours |
| 7 | Historique + Profil | Phase 7 | 2 jours |
| 8 | Partner Home complet | Phase 8 | 4 jours |
| 9 | Polish + Animations + Offline | Phase 9 | 4 jours |
| 10 | Tests + Sécurité | Phase 10 | 2 jours |
| 11 | Build + Deploy | Phase 11 | 2 jours |
| **Total** | | | **~30 jours** |

---

> **Note** : Ce document est la référence unique pour la refonte Maya V2. Toutes les API routes listées en section 4 doivent être conservées à l'identique car le backend ne change pas. Le design doit suivre la palette orange/violet définie en section 6.
