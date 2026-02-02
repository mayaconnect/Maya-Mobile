# Guide de compatibilité iOS API

Ce guide explique comment gérer automatiquement les problèmes de compatibilité iOS dans les dépendances Expo/React Native.

## 🎯 Problème

Certaines dépendances utilisent des APIs iOS 14+, 15+, 16+ sans vérifier la version iOS disponible. Cela cause des erreurs de compilation lorsque le deployment target est inférieur (ex: iOS 13.4).

## 🛠️ Solution automatisée

Nous avons créé des scripts pour détecter et corriger automatiquement ces problèmes.

### Scripts disponibles

#### 1. Détection des problèmes

```bash
npm run check-ios-apis
```

Scanne tous les packages et liste les APIs iOS 14+ utilisées sans guards.

#### 2. Correction automatique (mode dry-run)

```bash
npm run fix-ios-apis
```

Applique automatiquement certains correctifs simples (mode vérification uniquement).

#### 3. Application des correctifs

```bash
npm run fix-ios-apis:apply
```

⚠️ **Attention** : Modifie les fichiers dans `node_modules`. Toujours créer un patch après !

#### 4. Rapport détaillé

```bash
npm run ios-api-report
```

Génère un rapport textuel détaillé.

```bash
npm run ios-api-report:json
```

Génère un rapport JSON (utile pour CI/CD).

## 📋 Workflow recommandé

### Après chaque `npm install`

1. **Vérifier les problèmes** :
   ```bash
   npm run check-ios-apis
   ```

2. **Si des problèmes sont détectés** :
   ```bash
   # Vérifier les correctifs automatiques proposés
   npm run fix-ios-apis
   
   # Appliquer si satisfait
   npm run fix-ios-apis:apply
   ```

3. **Corriger manuellement les cas complexes** :
   - Ouvrir les fichiers concernés dans `node_modules/<package>/ios/`
   - Ajouter les guards `@available(iOS X.0, *)` ou `#available(iOS X.0, *)`
   - Vérifier que la logique fonctionne avec les fallbacks

4. **Créer le patch** :
   ```bash
   npx patch-package <package-name>
   ```

5. **Mettre à jour la liste des packages patchés** :
   - Éditer `scripts/fix-ios-api-availability.js`
   - Ajouter le package à `PATCHED_PACKAGES`

### Intégration CI/CD

Ajouter dans `.github/workflows/deploy.yml` :

```yaml
- name: Check iOS API compatibility
  run: |
    npm run check-ios-apis
    npm run ios-api-report -- --fail-on-issues --output=ios-api-report.txt
  continue-on-error: true
```

## 🔍 APIs détectées

### iOS 13.0+
- `UIApplication.shared.connectedScenes`
- `UIWindowScene`
- `prefersEphemeralWebBrowserSession`

### iOS 14.0+
- `UTType` et toutes ses variantes
- `PHPickerViewController`, `PHPickerConfiguration`, `PHPickerFilter`
- `PHPhotoLibrary.authorizationStatus(for:)` / `requestAuthorization(for:)`
- `PHAccessLevel`
- `PHAuthorizationStatus.limited`
- `locationManager.authorizationStatus` (instance property)
- `backButtonDisplayMode`
- `updateVisibleMenu`
- `UIColor(SwiftUI.Color)` conversion

### iOS 15.0+
- `UIImage.SymbolConfiguration(hierarchicalColor:)`
- `UIImage.SymbolConfiguration(paletteColors:)`
- `UIImage.SymbolConfiguration.preferringMulticolor()`
- `UIMenu.Options.singleSelection`
- `UIMenu.Options.displayAsPalette`
- `UIMenuElement.Attributes.keepsMenuPresented`

### iOS 16.0+
- `UIImage.SymbolConfiguration.preferringMonochrome()`

## 📦 Packages actuellement patchés

- ✅ `expo-image-picker`
- ✅ `expo-image`
- ✅ `expo-font`
- ✅ `expo-symbols`
- ✅ `expo-maps`
- ✅ `expo-router`
- ✅ `expo-camera`
- ✅ `expo-print`
- ✅ `expo-web-browser`
- ✅ `expo-file-system`
- ✅ `react-native-screens`

## ⚠️ Limitations

1. **Corrections automatiques limitées** : Seuls les cas simples sont corrigés automatiquement
2. **Vérification manuelle requise** : Toujours vérifier les changements avant de créer un patch
3. **Fallbacks complexes** : Certaines APIs nécessitent des fallbacks complexes qui doivent être écrits manuellement

## 🐛 Dépannage

### Le script ne détecte pas un problème

1. Vérifier que le package est dans `PACKAGES_TO_CHECK`
2. Vérifier que le pattern de l'API est dans la liste des APIs détectées
3. Ajouter un nouveau pattern si nécessaire dans `scripts/fix-ios-api-availability.js`

### Le correctif automatique ne fonctionne pas

Les correctifs automatiques ne couvrent que les cas simples. Pour les cas complexes :
1. Corriger manuellement le fichier dans `node_modules`
2. Tester que ça compile
3. Créer le patch avec `npx patch-package`

### Le patch ne s'applique pas

1. Vérifier que `patch-package` est dans `devDependencies`
2. Vérifier que le script `postinstall` est dans `package.json`
3. Vérifier que le patch est dans le dossier `patches/`
4. Supprimer `node_modules` et `package-lock.json`, puis réinstaller

## 📚 Ressources

- [Apple - API Availability](https://developer.apple.com/documentation/swift/availability)
- [Swift - @available](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/attributes/#available)
- [patch-package Documentation](https://github.com/ds300/patch-package)

