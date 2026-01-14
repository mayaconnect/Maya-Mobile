# Guide de Publication - Maya Mobile App

Ce guide vous explique comment publier l'application Maya sur les stores Apple App Store et Google Play Store.

## 📋 Prérequis

1. **Compte Expo** : Créez un compte sur [expo.dev](https://expo.dev)
2. **EAS CLI** : Installez EAS CLI globalement
   ```powershell
   npm install -g eas-cli
   ```
   ⚠️ **Note** : Si vous rencontrez des erreurs avec `npm`, essayez avec `npx` :
   ```powershell
   npx eas-cli@latest login
   ```
3. **Compte Apple Developer** (pour iOS) : 99$/an
4. **Compte Google Play Developer** (pour Android) : 25$ (paiement unique)

## 🔧 Configuration initiale

### 1. Se connecter à Expo

```powershell
eas login
```

Si EAS CLI n'est pas installé globalement, utilisez :
```powershell
npx eas-cli@latest login
```

### 2. Initialiser le projet (si pas déjà fait)

```powershell
eas build:configure
```

Ou avec npx :
```powershell
npx eas-cli@latest build:configure
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet (copiez `.env.example`) :

```bash
EXPO_PUBLIC_API_BASE_URL=https://votre-api-production.com/api/v1
```

⚠️ **Important** : Ne commitez JAMAIS le fichier `.env` dans Git (il est déjà dans `.gitignore`).

## 🍎 Publication iOS (App Store)

### 1. Configurer les identifiants Apple

```bash
eas credentials
```

Sélectionnez :
- **Platform** : iOS
- **Project** : maya-mobile-app
- Suivez les instructions pour configurer votre bundle identifier et vos certificats

### 2. Créer un build de production

```powershell
eas build --platform ios --profile production
```

Ou avec npx :
```powershell
npx eas-cli@latest build --platform ios --profile production
```

### 3. Soumettre à l'App Store

Une fois le build terminé :

```bash
eas submit --platform ios
```

Suivez les instructions pour :
1. Télécharger l'application depuis App Store Connect
2. Compléter les informations de l'app (description, captures d'écran, etc.)
3. Soumettre pour révision

### 4. Mettre à jour les informations dans App Store Connect

Connectez-vous à [App Store Connect](https://appstoreconnect.apple.com) et complétez :
- Description de l'app
- Captures d'écran (tous les formats requis)
- Prix et disponibilité
- Informations de confidentialité
- Notes de version

## 🤖 Publication Android (Google Play Store)

### 1. Configurer les identifiants Android

```bash
eas credentials
```

Sélectionnez :
- **Platform** : Android
- **Project** : maya-mobile-app
- Suivez les instructions pour générer ou utiliser un keystore existant

### 2. Créer un build de production

```bash
eas build --platform android --profile production
```

Cela génère un fichier `.aab` (Android App Bundle) optimisé pour Google Play.

### 3. Créer une application sur Google Play Console

1. Connectez-vous à [Google Play Console](https://play.google.com/console)
2. Créez une nouvelle application
3. Remplissez les informations de base (nom, description, etc.)

### 4. Soumettre le build

```bash
eas submit --platform android
```

Ou téléchargez manuellement le fichier `.aab` depuis le dashboard Expo et uploadez-le sur Google Play Console.

### 5. Configurer la fiche de l'application

Dans Google Play Console, complétez :
- Description complète et courte
- Captures d'écran (tous les formats requis)
- Icône et bannière
- Politique de confidentialité
- Classification du contenu
- Informations de contact

## 🔄 Mises à jour ultérieures

### Mettre à jour la version

Avant de créer un nouveau build, mettez à jour la version dans `app.json` :

```json
{
  "expo": {
    "version": "1.0.1",  // Version utilisateur
    "ios": {
      "buildNumber": "1.0.1"  // Build iOS
    },
    "android": {
      "versionCode": 2  // Build Android (incrémentez de 1)
    }
  }
}
```

### Créer un nouveau build

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Les deux
eas build --platform all --profile production
```

### Publier la mise à jour

```bash
# iOS
eas submit --platform ios

# Android
eas submit --platform android
```

## 📱 Builds de test (preview)

Pour tester avant de publier en production :

```bash
# iOS (simulateur ou TestFlight)
eas build --platform ios --profile preview

# Android (APK)
eas build --platform android --profile preview
```

## 🧪 TestFlight (iOS)

Pour distribuer des builds de test via TestFlight :

1. Créez un build preview/production
2. Soumettez avec `eas submit --platform ios`
3. Dans App Store Connect, la version apparaîtra dans TestFlight
4. Ajoutez des testeurs internes/externes

## 🔍 Vérifications avant publication

- [ ] L'API de production est configurée et accessible
- [ ] Tous les tests fonctionnent correctement
- [ ] Les icônes et splash screens sont présents
- [ ] Les permissions sont correctement configurées
- [ ] Les variables d'environnement sont définies
- [ ] La version est correctement incrémentée
- [ ] Les captures d'écran sont prêtes
- [ ] La description de l'app est complète
- [ ] La politique de confidentialité est accessible
- [ ] Les fonctionnalités principales fonctionnent

## 📞 Support

Pour toute question :
- Documentation Expo : [docs.expo.dev](https://docs.expo.dev)
- Documentation EAS : [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction)
- Support Expo : [expo.dev/support](https://expo.dev/support)

