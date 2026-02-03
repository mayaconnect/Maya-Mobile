# Workflows EAS Build

Ce dossier contient les workflows EAS pour automatiser les builds de l'application Maya.

## Workflows disponibles

### 1. `create-test-builds.yml` - Builds de test

**Usage :** Pour créer des builds destinés aux tests internes et aux bêta-testeurs.

**Profiles utilisés :** `preview`

**Caractéristiques :**
- **Android :** Génère un APK (facile à installer sur les appareils de test)
- **iOS :** Build pour TestFlight (distribution interne)
- Pas de soumission automatique aux stores
- Pas d'incrémentation automatique des numéros de version

**Comment lancer :**
```bash
# Via EAS CLI
eas build:run --workflow create-test-builds

# Ou via l'interface web EAS
# Allez sur https://expo.dev et lancez le workflow depuis l'interface
```

### 2. `create-production-builds.yml` - Builds de production

**Usage :** Pour créer des builds destinés à la distribution en production (App Store & Google Play).

**Profiles utilisés :** `production`

**Caractéristiques :**
- **Android :** Génère un AAB (Android App Bundle) requis pour Google Play
- **iOS :** Build pour App Store
- Auto-increment des numéros de version activé
- Utilise `resourceClass: m-medium` pour des builds plus rapides
- Active la nouvelle architecture React Native (`RCT_NEW_ARCH_ENABLED: 1`)

**Comment lancer :**
```bash
# Via EAS CLI
eas build:run --workflow create-production-builds

# Ou via l'interface web EAS
# Allez sur https://expo.dev et lancez le workflow depuis l'interface
```

## Configuration des profiles

Les profiles sont définis dans `eas.json` :

- **`preview`** : Pour les builds de test
  - Distribution interne
  - APK pour Android
  - Build Release pour iOS

- **`production`** : Pour les builds de production
  - Auto-increment activé
  - AAB pour Android
  - Build Release pour iOS avec resourceClass optimisé

## Commandes utiles

```bash
# Voir les workflows disponibles
eas build:list

# Lancer un build manuel avec un profile spécifique
eas build --platform android --profile preview
eas build --platform ios --profile production

# Voir l'historique des builds
eas build:list

# Télécharger un build
eas build:download
```

## Notes importantes

- Les workflows peuvent être déclenchés manuellement via l'interface EAS ou via la CLI
- Les builds de production incrémentent automatiquement les numéros de version
- Les builds de test utilisent le profile `preview` qui ne modifie pas les versions
- Assurez-vous d'avoir les bonnes credentials configurées pour les soumissions aux stores

