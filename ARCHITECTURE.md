# Architecture de l'Application Maya

Ce document décrit l'architecture de l'application mobile Maya, une application React Native/Expo pour la gestion de partenaires commerciaux et de transactions.

## 📁 Structure des Dossiers

```
maya-mobile-app/
├── app/                    # Routes et écrans (Expo Router)
│   ├── (tabs)/            # Navigation par onglets
│   ├── connexion/         # Écrans d'authentification
│   └── onboarding/        # Écrans d'onboarding
│
├── components/            # Composants réutilisables
│   ├── common/           # Composants communs (boutons, loaders)
│   ├── headers/          # En-têtes de navigation
│   ├── home/             # Composants spécifiques à la page d'accueil
│   ├── partners/         # Composants liés aux partenaires
│   └── ui/               # Composants UI de base
│
├── features/             # Features organisées par domaine métier
│   ├── auth/            # Authentification
│   │   ├── hooks/       # Hooks personnalisés
│   │   ├── screens/     # Écrans
│   │   ├── services/    # Services API
│   │   └── types.ts     # Types TypeScript
│   ├── partners/        # Gestion des partenaires
│   ├── transactions/    # Gestion des transactions
│   └── ...
│
├── services/            # Services métier et API
│   ├── shared/          # Services partagés
│   │   ├── api.ts       # Client API de base (legacy)
│   │   ├── api-client.ts # Client API amélioré
│   │   └── errors.ts    # Gestion d'erreurs
│   ├── auth.service.ts  # Service d'authentification
│   ├── partner.service.ts
│   └── ...
│
├── config/              # Configuration
│   └── api.config.ts    # Configuration API centralisée
│
├── utils/               # Utilitaires
│   ├── logger.ts       # Système de logging
│   ├── validation.ts   # Validation de données
│   ├── format.ts       # Formatage (dates, montants, etc.)
│   └── helpers.ts      # Fonctions utilitaires
│
├── types/               # Types TypeScript partagés
│   └── shared.ts       # Types communs
│
├── constants/           # Constantes
│   ├── design-system.ts # Design system (couleurs, espacements)
│   └── theme.ts        # Thème de l'application
│
└── hooks/              # Hooks React globaux
    ├── use-auth.tsx    # Hook d'authentification
    └── ...
```

## 🏗️ Architecture en Couches

### 1. Couche Présentation (UI)
- **Composants** (`components/`): Composants réutilisables et UI
- **Écrans** (`features/*/screens/`): Écrans spécifiques à chaque feature
- **Hooks** (`features/*/hooks/`): Hooks personnalisés pour la logique UI

### 2. Couche Métier (Business Logic)
- **Services** (`services/`): Services métier et appels API
- **Features** (`features/*/services/`): Services spécifiques à chaque feature

### 3. Couche Données (Data)
- **API Client** (`services/shared/api-client.ts`): Client HTTP avec retry, timeout, gestion d'erreurs
- **Configuration** (`config/api.config.ts`): Configuration centralisée

### 4. Couche Utilitaires (Utilities)
- **Validation** (`utils/validation.ts`): Validation de données
- **Formatage** (`utils/format.ts`): Formatage de données
- **Helpers** (`utils/helpers.ts`): Fonctions utilitaires
- **Logger** (`utils/logger.ts`): Système de logging structuré

## 🔄 Flux de Données

```
Écran (Screen)
    ↓
Hook personnalisé (useFeature)
    ↓
Service (FeatureService)
    ↓
API Client (ApiClient)
    ↓
Backend API
```

## 🛠️ Composants Clés

### API Client (`services/shared/api-client.ts`)

Client HTTP amélioré avec :
- ✅ Retry automatique avec backoff exponentiel
- ✅ Timeout configurable
- ✅ Gestion d'erreurs centralisée
- ✅ Logging structuré
- ✅ Authentification automatique

**Exemple d'utilisation :**
```typescript
import { ApiClient } from '@/services/shared/api-client';

// GET simple
const data = await ApiClient.get<User>('/users/profile');

// POST avec retry
const result = await ApiClient.post('/transactions', transactionData, {
  retry: { maxAttempts: 3, delay: 1000 }
});
```

### Gestion d'Erreurs (`services/shared/errors.ts`)

Système d'erreurs typé avec :
- ✅ Classes d'erreurs personnalisées (`ApiError`)
- ✅ Codes d'erreur standardisés (`ErrorCode`)
- ✅ Messages utilisateur-friendly
- ✅ Détection des erreurs retryables

**Exemple :**
```typescript
import { ApiError, ErrorCode } from '@/services/shared/errors';

try {
  await ApiClient.get('/data');
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.code); // ErrorCode.NOT_FOUND
    console.error(error.getUserMessage()); // "Ressource non trouvée."
  }
}
```

### Configuration (`config/api.config.ts`)

Configuration centralisée pour :
- ✅ URLs de base
- ✅ Timeouts
- ✅ Configuration de retry
- ✅ Endpoints API
- ✅ Headers par défaut

### Logger (`utils/logger.ts`)

Système de logging structuré :
- ✅ Niveaux de log (DEBUG, INFO, WARN, ERROR)
- ✅ Logging conditionnel (dev/prod)
- ✅ Logs API spécialisés

**Exemple :**
```typescript
import { log } from '@/utils/logger';

log.info('Utilisateur connecté', { userId: '123' });
log.error('Erreur API', error, { endpoint: '/users' });
log.api.request('GET', '/users');
```

## 📦 Organisation des Features

Chaque feature suit la structure suivante :

```
features/
└── feature-name/
    ├── components/      # Composants spécifiques à la feature
    ├── hooks/          # Hooks personnalisés
    ├── screens/        # Écrans
    ├── services/       # Services API
    ├── types.ts        # Types TypeScript
    └── utils/          # Utilitaires spécifiques (optionnel)
```

**Principe :** Une feature contient tout ce qui lui est nécessaire, mais utilise les services partagés pour les appels API.

## 🔐 Authentification

L'authentification est gérée par :
- **AuthService** (`services/auth.service.ts`): Service d'authentification
- **useAuth** (`hooks/use-auth.tsx`): Hook React pour l'état d'authentification
- **API Client**: Ajoute automatiquement le token Bearer aux requêtes

## 🎨 Design System

Le design system est défini dans `constants/design-system.ts` :
- Couleurs (primary, secondary, accent, status)
- Typographie (tailles, poids, espacement)
- Espacements (xs, sm, md, lg, xl)
- Bordures et ombres

## 🧪 Tests

Les tests sont organisés dans `__tests__/` :
- Tests unitaires pour les services
- Tests de composants avec React Testing Library
- Configuration Jest dans `jest.config.js`

## 📝 Bonnes Pratiques

### 1. Utilisation des Services
- Utiliser `ApiClient` pour tous les appels API
- Ne pas utiliser `fetch` directement
- Utiliser les types TypeScript pour les réponses API

### 2. Gestion d'Erreurs
- Toujours utiliser `try/catch` pour les appels API
- Utiliser `ApiError` pour les erreurs API
- Afficher des messages utilisateur-friendly avec `getUserMessage()`

### 3. Validation
- Utiliser les fonctions de `utils/validation.ts`
- Valider les données avant l'envoi à l'API
- Afficher des messages d'erreur clairs

### 4. Formatage
- Utiliser les fonctions de `utils/format.ts` pour formater les données
- Ne pas formater dans les composants, utiliser des utilitaires

### 5. Logging
- Utiliser `log` au lieu de `console.log`
- Logger les erreurs avec contexte
- Désactiver les logs en production

## 🚀 Améliorations Futures

- [ ] Ajouter un système de cache (React Query ou SWR)
- [ ] Implémenter un state management global (Zustand ou Redux)
- [ ] Ajouter la validation avec Zod
- [ ] Créer un système de notifications toast
- [ ] Ajouter la gestion offline
- [ ] Implémenter la synchronisation de données

## 📚 Ressources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

