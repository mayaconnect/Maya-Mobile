# Tests Unitaires - Maya Mobile App

Ce dossier contient tous les tests unitaires de l'application Maya.

## Structure

```
__tests__/
├── components/          # Tests des composants React
├── hooks/              # Tests des hooks personnalisés
├── services/           # Tests des services API
└── utils/              # Tests des utilitaires
```

## Exécution des tests

```bash
# Lancer tous les tests
npm test

# Lancer les tests en mode watch
npm run test:watch

# Lancer les tests avec couverture
npm run test:coverage

# Lancer les tests en CI
npm run test:ci
```

## Couverture de code

Les tests visent une couverture minimale de :
- **50%** pour les branches
- **50%** pour les fonctions
- **50%** pour les lignes
- **50%** pour les statements

## Types de tests

### Tests de composants
Les tests de composants utilisent `@testing-library/react-native` pour tester le rendu et l'interaction utilisateur.

Exemple : `components/ProfileHeader.test.tsx`

### Tests de hooks
Les tests de hooks utilisent `@testing-library/react-native` avec `renderHook` pour tester la logique des hooks personnalisés.

Exemple : `hooks/useAuth.test.ts`

### Tests de services
Les tests de services mockent les appels API et testent la logique métier.

Exemple : `services/auth.profile.test.ts`

## Bonnes pratiques

1. **Isolation** : Chaque test doit être indépendant
2. **Mocks** : Utiliser des mocks pour les dépendances externes
3. **Nommage** : Utiliser des noms descriptifs (`devrait faire X quand Y`)
4. **Couverture** : Tester les cas de succès ET d'erreur
5. **Performance** : Utiliser `waitFor` pour les opérations asynchrones

## Ajout de nouveaux tests

1. Créer un fichier `*.test.ts` ou `*.test.tsx` dans le dossier approprié
2. Importer les dépendances nécessaires
3. Mocker les dépendances externes
4. Écrire les tests avec `describe` et `it`
5. Vérifier que les tests passent avec `npm test`

