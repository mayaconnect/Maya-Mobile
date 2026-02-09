# Corrections des erreurs de build iOS

## Problème : NS_ASSUME_NONNULL_BEGIN errors

Les erreurs suivantes apparaissaient lors du build iOS sur EAS :

```
❌  (node_modules/react-native-maps/ios/AirMaps/AIRMap.h:21:1)
  21 | NS_ASSUME_NONNULL_BEGIN
     | ^ already inside '#pragma clang assume_nonnull'

❌  (node_modules/react-native-maps/ios/generated/RNMapsAirModuleDelegate.h:16:1)
  16 | NS_ASSUME_NONNULL_BEGIN
     | ^ already inside '#pragma clang assume_nonnull'
```

## Cause

Le problème était causé par :
1. Des macros `NS_ASSUME_NONNULL_BEGIN` et `NS_ASSUME_NONNULL_END` dupliquées ou imbriquées dans les fichiers header Objective-C de `react-native-maps`
2. Le script `eas-build-post-install.js` ne faisait que `expo prebuild` sans appliquer les corrections de nullability

Fichiers affectés :
- `node_modules/react-native-maps/ios/AirMaps/AIRMap.h` - Avait une protection pragma incorrecte
- `node_modules/react-native-maps/ios/AirGoogleMaps/AIRGoogleMap.h` - Avait 11 NS_ASSUME_NONNULL_BEGIN en double
- `node_modules/react-native-maps/ios/AirGoogleMaps/AIRGoogleMapMarker.h` - Avait 8 NS_ASSUME_NONNULL_BEGIN en double
- `node_modules/react-native-maps/ios/AirMaps/AIRMapManager.h` - Avait 2 NS_ASSUME_NONNULL_BEGIN en double

## Solution

### 1. Patch react-native-maps

Un patch a été créé avec `patch-package` pour corriger définitivement ces fichiers :
- `patches/react-native-maps+1.26.17.patch`

Le patch :
- Supprime tous les `NS_ASSUME_NONNULL_BEGIN` en double
- Garde un seul `NS_ASSUME_NONNULL_BEGIN` après les imports
- Garde un seul `NS_ASSUME_NONNULL_END` avant la fin du fichier
- Supprime les protections pragma incorrectes

### 2. Mise à jour du script EAS Build

Le script `scripts/eas-build-post-install.js` a été mis à jour pour :
1. Exécuter `expo prebuild` pour iOS
2. Appliquer automatiquement les corrections de nullability :
   - `node scripts/fix-react-native-maps-nullability.js`
   - `node scripts/fix-react-native-svg-nullability.js`
   - `bash scripts/fix-ios-nullability.sh`
   - `node scripts/auto-fix-and-patch-ios.js`

## Comment appliquer

Les corrections sont appliquées automatiquement lors du build EAS grâce à :

1. Le hook `eas-build-post-install` qui est exécuté par EAS Build après l'installation des dépendances
2. Le script `postinstall` dans `package.json` qui applique les patches localement :
   ```json
   "postinstall": "patch-package || echo 'patch-package not found, skipping patches'"
   ```

## Vérification locale

Pour vérifier que les corrections sont appliquées localement :

```bash
# Réinstaller les dépendances et appliquer les patches
npm install

# Vérifier que les fichiers sont corrects
grep -n "NS_ASSUME_NONNULL" node_modules/react-native-maps/ios/AirMaps/AIRMap.h
# Devrait afficher seulement 2 lignes (BEGIN et END)

# Tester le script de correction manuellement
node scripts/fix-react-native-maps-nullability.js
```

## Tests

Pour tester le build iOS localement :

```bash
# Build iOS sur EAS
npm run eas:build:ios

# Ou build local
npm run ios
```

## Notes

- Le patch est versionné dans le repository et doit être commité
- Si la version de `react-native-maps` change, le patch devra être recréé
- Les scripts de correction sont idempotents et peuvent être exécutés plusieurs fois sans problème
- Sur Windows, le script bash `fix-ios-nullability.sh` est skippé automatiquement

## Fichiers modifiés

- `scripts/eas-build-post-install.js` - Ajout des appels aux scripts de correction
- `patches/react-native-maps+1.26.17.patch` - Patch pour corriger les fichiers
- Ce fichier de documentation
