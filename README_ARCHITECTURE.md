# Guide d'Utilisation de la Nouvelle Architecture

Ce guide explique comment utiliser les nouvelles améliorations architecturales de l'application Maya.

## 🚀 Nouveautés

### 1. Client API Amélioré (`ApiClient`)

Le nouveau client API offre :
- ✅ Retry automatique avec backoff exponentiel
- ✅ Timeout configurable
- ✅ Gestion d'erreurs typée
- ✅ Logging structuré
- ✅ Authentification automatique

**Migration depuis l'ancien `apiCall` :**

```typescript
// ❌ Ancien code
import { apiCall } from '@/services/shared/api';
const data = await apiCall('/users', { method: 'GET' });

// ✅ Nouveau code
import { ApiClient } from '@/services/shared/api-client';
const data = await ApiClient.get('/users');
```

**Exemples d'utilisation :**

```typescript
import { ApiClient } from '@/services/shared/api-client';

// GET simple
const user = await ApiClient.get<User>('/users/profile');

// POST avec données
const transaction = await ApiClient.post('/transactions', {
  amount: 100,
  partnerId: '123'
});

// Avec retry personnalisé
const data = await ApiClient.get('/data', {
  retry: {
    maxAttempts: 5,
    delay: 2000,
    backoffMultiplier: 1.5
  }
});

// Avec timeout personnalisé
const upload = await ApiClient.post('/upload', formData, {
  timeout: 60000 // 60 secondes
});

// Sans authentification
const publicData = await ApiClient.get('/public', {
  skipAuth: true
});
```

### 2. Gestion d'Erreurs (`ApiError`)

Les erreurs sont maintenant typées et fournissent des messages utilisateur-friendly.

```typescript
import { ApiError, ErrorCode } from '@/services/shared/errors';

try {
  await ApiClient.get('/data');
} catch (error) {
  if (error instanceof ApiError) {
    // Code d'erreur standardisé
    console.error(error.code); // ErrorCode.NOT_FOUND
    
    // Message utilisateur-friendly
    const userMessage = error.getUserMessage();
    // "Ressource non trouvée."
    
    // Détails complets
    console.error(error.details);
    
    // Vérifier si retryable
    if (error.isRetryable) {
      // Retenter la requête
    }
  }
}
```

### 3. Logger Structuré (`log`)

Remplacez tous les `console.log` par le système de logging structuré.

```typescript
import { log } from '@/utils/logger';

// Logs généraux
log.debug('Détails de debug', { userId: '123', action: 'login' });
log.info('Information', { message: 'Utilisateur connecté' });
log.warn('Avertissement', { issue: 'Token expirant bientôt' });
log.error('Erreur', error, { context: 'LoginScreen' });

// Logs API spécialisés
log.api.request('GET', '/users');
log.api.response('GET', '/users', 200, 150);
log.api.error('POST', '/transactions', 500, error);
```

### 4. Validation (`utils/validation.ts`)

Fonctions de validation réutilisables.

```typescript
import { isValidEmail, isValidPassword, ValidationMessages } from '@/utils/validation';

// Validation
if (!isValidEmail(email)) {
  setError(ValidationMessages.EMAIL_INVALID);
}

if (!isValidPassword(password)) {
  setError(ValidationMessages.PASSWORD_WEAK);
}
```

### 5. Formatage (`utils/format.ts`)

Formatage de données pour l'affichage.

```typescript
import { formatCurrency, formatDate, formatRelativeDate, formatDistance } from '@/utils/format';

// Montants
formatCurrency(1234.56); // "1 234,56 €"

// Dates
formatDate(new Date()); // "15 janvier 2024"
formatRelativeDate('2024-01-10'); // "Il y a 5 jours"

// Distances
formatDistance(1500); // "1,5 km"
```

### 6. Helpers (`utils/helpers.ts`)

Fonctions utilitaires générales.

```typescript
import { retry, debounce, delay, isDefined } from '@/utils/helpers';

// Retry avec backoff
const result = await retry(
  () => fetchData(),
  3, // maxAttempts
  1000, // delay
  2 // backoffMultiplier
);

// Debounce
const debouncedSearch = debounce((query: string) => {
  search(query);
}, 300);

// Delay
await delay(1000); // Attendre 1 seconde

// Vérifications
if (isDefined(value)) {
  // value n'est pas null ou undefined
}
```

### 7. Configuration (`config/api.config.ts`)

Configuration centralisée pour l'API.

```typescript
import { API_CONFIG, getApiUrl, getTimeout } from '@/config/api.config';

// Accès à la configuration
const baseUrl = API_CONFIG.BASE_URL;
const timeout = API_CONFIG.TIMEOUT.DEFAULT;
const maxRetries = API_CONFIG.RETRY.MAX_ATTEMPTS;

// Utilitaires
const fullUrl = getApiUrl('/users');
const uploadTimeout = getTimeout('upload');
```

## 📝 Exemples Complets

### Exemple 1 : Service avec gestion d'erreurs

```typescript
import { ApiClient } from '@/services/shared/api-client';
import { ApiError, ErrorCode } from '@/services/shared/errors';
import { log } from '@/utils/logger';

export const UserService = {
  async getProfile(): Promise<User> {
    try {
      const user = await ApiClient.get<User>('/users/profile');
      log.info('Profil utilisateur récupéré', { userId: user.id });
      return user;
    } catch (error) {
      if (error instanceof ApiError) {
        log.error('Erreur lors de la récupération du profil', error);
        
        if (error.code === ErrorCode.UNAUTHORIZED) {
          // Rediriger vers la page de connexion
          router.replace('/connexion/login');
        }
        
        throw error;
      }
      throw error;
    }
  }
};
```

### Exemple 2 : Hook avec validation

```typescript
import { useState } from 'react';
import { isValidEmail, ValidationMessages } from '@/utils/validation';
import { ApiClient } from '@/services/shared/api-client';

export function useLogin() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    // Validation
    if (!isValidEmail(email)) {
      setError(ValidationMessages.EMAIL_INVALID);
      return;
    }

    try {
      const result = await ApiClient.post('/auth/login', { email });
      // Succès
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.getUserMessage());
      }
    }
  };

  return { email, setEmail, error, handleLogin };
}
```

### Exemple 3 : Composant avec formatage

```typescript
import { formatCurrency, formatRelativeDate } from '@/utils/format';

export function TransactionCard({ transaction }: { transaction: Transaction }) {
  return (
    <View>
      <Text>{formatCurrency(transaction.amount)}</Text>
      <Text>{formatRelativeDate(transaction.createdAt)}</Text>
    </View>
  );
}
```

## 🔄 Migration Progressive

Vous pouvez migrer progressivement :

1. **Commencez par les nouveaux services** : Utilisez `ApiClient` pour les nouveaux services
2. **Migrez les erreurs** : Remplacez les `Error` génériques par `ApiError`
3. **Remplacez les logs** : Utilisez `log` au lieu de `console.log`
4. **Ajoutez la validation** : Utilisez les fonctions de validation
5. **Utilisez le formatage** : Remplacez les formatages manuels

L'ancien `apiCall` reste disponible pour compatibilité, mais il est recommandé d'utiliser `ApiClient` pour les nouveaux développements.

## 📚 Documentation Complète

Voir `ARCHITECTURE.md` pour la documentation complète de l'architecture.

