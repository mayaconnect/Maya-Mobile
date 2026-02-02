# 🚀 Guide EAS Build - Build iOS avec EAS

## 📋 Prérequis

1. **Compte Expo** : Créez un compte sur [expo.dev](https://expo.dev) si vous n'en avez pas
2. **EAS CLI** : Installé automatiquement via `npm install` (dans devDependencies)
3. **Connexion** : Connectez-vous avec `npx eas login`

## 🔧 Configuration initiale (une seule fois)

### 1. Se connecter à Expo
```bash
npx eas login
```

### 2. Lier le projet (si pas déjà fait)
```bash
npx eas build:configure
```

### 3. Configurer les credentials iOS
EAS peut gérer automatiquement les certificats et provisioning profiles, ou vous pouvez les fournir manuellement.

**Option A - Automatique (recommandé)** :
```bash
npx eas credentials
```
Sélectionnez iOS → Production → Gérer avec EAS

**Option B - Manuel** :
Si vous avez déjà des certificats, vous pouvez les uploader via l'interface EAS.

## 🏗️ Lancer un build iOS

### Méthode simple (tout-en-un)
```bash
npm run eas:build:ios
```

Cette commande :
1. ✅ Applique automatiquement les patches iOS
2. ✅ Corrige les problèmes de compatibilité API
3. ✅ Lance le build sur EAS

### Méthode étape par étape

1. **Préparer le projet** :
```bash
npm run eas:prepare
```

2. **Lancer le build** :
```bash
npx eas build --platform ios --profile production
```

## 📱 Autres commandes utiles

### Build Android
```bash
npm run eas:build:android
```

### Build iOS + Android
```bash
npm run eas:build:all
```

### Soumettre à TestFlight (après le build)
```bash
npm run eas:submit:ios
```

### Voir les builds en cours
```bash
npx eas build:list
```

### Voir les détails d'un build
```bash
npx eas build:view [BUILD_ID]
```

## 🔍 Profils de build disponibles

- **production** : Build pour TestFlight/App Store
- **preview** : Build pour distribution interne
- **development** : Build avec development client

## ⚙️ Configuration

La configuration est dans `eas.json`. Les paramètres importants :

- **iOS deployment target** : Configuré dans `app.json` (iOS 13.4)
- **New Architecture** : Activée (`RCT_NEW_ARCH_ENABLED=1`)
- **Auto-increment** : Le build number s'incrémente automatiquement

## 🐛 Dépannage

### Erreur de credentials
```bash
npx eas credentials
```

### Voir les logs d'un build
```bash
npx eas build:view [BUILD_ID]
```

### Annuler un build
```bash
npx eas build:cancel [BUILD_ID]
```

## 📚 Ressources

- [Documentation EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Build Status](https://expo.dev/accounts/[votre-compte]/builds)
- [Support Expo](https://expo.dev/support)

