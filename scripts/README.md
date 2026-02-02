# Scripts d'automatisation

## `fix-ios-api-availability.js`

Script pour détecter automatiquement les problèmes de compatibilité iOS dans les dépendances.

### Usage

```bash
npm run check-ios-apis
```

### Fonctionnalités

- Scanne automatiquement les packages Expo/React Native courants
- Détecte les APIs iOS 13+, 14+, 15+, 16+ utilisées sans guards
- Liste les fichiers et lignes concernés
- Ignore les packages déjà patchés

### APIs détectées

**iOS 13.0+ :**
- `UIApplication.shared.connectedScenes`
- `UIWindowScene`
- `prefersEphemeralWebBrowserSession`

**iOS 14.0+ :**
- `UTType` et toutes ses variantes
- `PHPickerViewController`, `PHPickerConfiguration`, `PHPickerFilter`
- `PHPhotoLibrary.authorizationStatus(for:)` / `requestAuthorization(for:)`
- `PHAccessLevel`
- `PHAuthorizationStatus.limited`
- `locationManager.authorizationStatus` (instance property)
- `backButtonDisplayMode`
- `updateVisibleMenu`
- `UIColor(SwiftUI.Color)` conversion

**iOS 15.0+ :**
- `UIImage.SymbolConfiguration(hierarchicalColor:)`
- `UIImage.SymbolConfiguration(paletteColors:)`
- `UIImage.SymbolConfiguration.preferringMulticolor()`
- `UIMenu.Options.singleSelection`
- `UIMenu.Options.displayAsPalette`
- `UIMenuElement.Attributes.keepsMenuPresented`

**iOS 16.0+ :**
- `UIImage.SymbolConfiguration.preferringMonochrome()`

### Limitations

Ce script détecte les problèmes mais ne les corrige pas automatiquement car :
1. Les corrections nécessitent une compréhension du contexte
2. Certaines corrections sont complexes (fallbacks, etc.)
3. Il faut vérifier que les corrections ne cassent pas la logique

## `auto-fix-ios-apis.js`

Script pour appliquer automatiquement certains correctifs simples.

### Usage

```bash
# Mode dry-run (vérification uniquement)
npm run fix-ios-apis

# Appliquer les correctifs
npm run fix-ios-apis:apply

# Pour un package spécifique
node scripts/auto-fix-ios-apis.js expo-image-picker --dry-run
```

### Fonctionnalités

- Applique automatiquement `@available(iOS 14.0, *)` sur les structs/classes utilisant `UTType`
- Ajoute des guards `#available(iOS 14.0, *)` pour certaines APIs
- Mode dry-run par défaut pour vérifier avant d'appliquer

### ⚠️ Limitations

- Ne corrige que les cas simples
- Les corrections complexes nécessitent toujours une intervention manuelle
- Toujours vérifier les changements avant de créer un patch

### Workflow recommandé

1. Exécuter `npm run check-ios-apis` après chaque `npm install`
2. Si des problèmes sont détectés, essayer `npm run fix-ios-apis` (dry-run)
3. Vérifier les changements proposés
4. Appliquer avec `npm run fix-ios-apis:apply` si satisfait
5. Corriger manuellement les cas complexes restants
6. Créer le patch avec `npx patch-package <package-name>`
7. Ajouter le package à `PATCHED_PACKAGES` dans le script de détection

