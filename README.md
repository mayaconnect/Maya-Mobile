# Maya Mobile App 🚀

Application mobile React Native/Expo pour la gestion de partenaires commerciaux et de transactions.

## 🎯 Fonctionnalités

- ✅ Authentification sécurisée
- ✅ Gestion des partenaires et magasins
- ✅ Scanner QR code
- ✅ Transactions et historique
- ✅ Abonnements
- ✅ Interface moderne et optimisée

## 🚀 Démarrage Rapide

### Installation

```bash
npm install
```

### Démarrage

```bash
npm start
```

Ou utilisez les commandes spécifiques :

```bash
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture complète de l'application
- **[README_ARCHITECTURE.md](./README_ARCHITECTURE.md)** - Guide d'utilisation de l'architecture
- **[OPTIMIZATION.md](./OPTIMIZATION.md)** - Guide d'optimisation et performance
- **[OPTIMIZATIONS_SUMMARY.md](./OPTIMIZATIONS_SUMMARY.md)** - Résumé des optimisations

## 🛠️ Scripts Disponibles

```bash
npm run lint              # Linter le code
npm run lint:fix          # Corriger automatiquement les erreurs
npm run format            # Formater le code
npm run format:check      # Vérifier le formatage
npm run type-check        # Vérifier les types TypeScript
npm run test              # Lancer les tests
npm run test:watch        # Tests en mode watch
npm run test:coverage     # Tests avec couverture
```

## 🏗️ Architecture

L'application suit une architecture modulaire avec :

- **Features** : Organisation par domaine métier
- **Services** : Logique métier et appels API
- **Components** : Composants réutilisables
- **Hooks** : Hooks personnalisés
- **Utils** : Utilitaires partagés
- **Config** : Configuration centralisée

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour plus de détails.

## ⚡ Optimisations

L'application inclut de nombreuses optimisations :

- ✅ Cache intelligent pour les données API
- ✅ Hooks optimisés avec memoization
- ✅ Debounce/throttle pour les interactions
- ✅ Monitoring réseau
- ✅ Error boundaries
- ✅ Composants optimisés

Voir [OPTIMIZATION.md](./OPTIMIZATION.md) pour plus de détails.

## 🧪 Tests

```bash
npm run test              # Lancer tous les tests
npm run test:watch        # Mode watch
npm run test:coverage     # Avec couverture de code
```

## 📦 Structure du Projet

```
maya-mobile-app/
├── app/                  # Routes (Expo Router)
├── components/           # Composants réutilisables
├── features/             # Features par domaine métier
├── services/             # Services métier et API
├── hooks/                # Hooks React personnalisés
├── utils/                # Utilitaires
├── config/               # Configuration
├── contexts/             # Contextes React
└── types/                # Types TypeScript
```

## 🔐 Configuration

Créez un fichier `.env` à la racine :

```env
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

## 📝 Contribution

Voir [SETUP_IMPROVEMENTS.md](./SETUP_IMPROVEMENTS.md) pour les conventions de code et les outils de développement.

## 📄 Licence

Private - Tous droits réservés
