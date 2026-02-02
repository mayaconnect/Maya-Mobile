# 🔧 Auto-fix iOS API Compatibility en CI/CD

## Vue d'ensemble

Le workflow CI/CD inclut maintenant une étape automatique qui :
1. **Détecte** tous les problèmes de compatibilité iOS API
2. **Corrige** automatiquement les problèmes trouvés
3. **Crée** les patches nécessaires
4. **Applique** les patches avant le build

**Résultat** : Plus besoin de corriger manuellement les erreurs iOS API - tout est fait automatiquement en CI !

## 🔄 Workflow CI/CD

### Étape 1 : Installation des dépendances
```yaml
- name: 📦 Install dependencies
  run: npm ci --omit=dev --legacy-peer-deps
```

### Étape 2 : Installation de patch-package
```yaml
- name: 🔧 Install patch-package
  run: npm install --save-dev patch-package --no-save --legacy-peer-deps
```

### Étape 3 : Auto-fix iOS API (NOUVELLE)
```yaml
- name: 🔍 Auto-fix iOS API compatibility issues
  run: node scripts/auto-fix-and-patch-ios.js
```

Cette étape :
- ✅ Scanne tous les packages Expo/React Native
- ✅ Détecte les APIs iOS 13+, 14+, 15+, 16+ sans guards
- ✅ Corrige automatiquement les problèmes
- ✅ Crée les patches avec `patch-package`
- ✅ Ne fait **PAS** échouer le build si tout est corrigé

### Étape 4 : Application des patches
```yaml
- name: 📦 Apply patches
  run: npx patch-package
```

## 📋 Ce qui est détecté et corrigé automatiquement

### iOS 13.0+
- `UIApplication.shared.connectedScenes`
- `UIWindowScene`
- `prefersEphemeralWebBrowserSession`

### iOS 14.0+
- `UTType` et toutes ses variantes
- `PHPickerViewController`, `PHPickerConfiguration`
- `PHPhotoLibrary.authorizationStatus(for:)`
- `SDImageAWebPCoder`
- Et bien plus...

### iOS 15.0+
- `UIImage.SymbolConfiguration(hierarchicalColor:)`
- `PHPickerConfiguration.selection`
- Et bien plus...

## 🎯 Avantages

1. **Zéro intervention manuelle** : Les problèmes sont corrigés automatiquement
2. **Build toujours vert** : Si des problèmes sont trouvés et corrigés, le build continue
3. **Patches créés automatiquement** : Plus besoin de créer les patches manuellement
4. **Détection exhaustive** : Scanne TOUS les packages, pas seulement ceux connus

## ⚠️ Limitations

- Les corrections automatiques ne couvrent que les cas simples
- Les cas complexes peuvent nécessiter une intervention manuelle
- Les patches créés automatiquement doivent être commités dans le repo

## 🔍 Vérification locale

Vous pouvez tester le script localement :

```bash
# Mode dry-run (vérification uniquement)
npm run fix-all-ios-apis

# Appliquer les corrections et créer les patches
npm run fix-all-ios-apis:apply

# Ou directement
node scripts/auto-fix-and-patch-ios.js
```

## 📝 Workflow recommandé

1. **En développement local** :
   - Exécuter `npm run scan-ios-apis` après `npm install`
   - Si des problèmes sont détectés, les corriger manuellement
   - Créer les patches avec `npx patch-package`

2. **En CI/CD** :
   - Le script s'exécute automatiquement
   - Les problèmes sont corrigés automatiquement
   - Les patches sont créés automatiquement
   - Le build continue normalement

3. **Après un build réussi en CI** :
   - Vérifier les nouveaux patches créés
   - Les commit dans le repo si nécessaire
   - Les ajouter à `PATCHED_PACKAGES` dans les scripts

## 🚀 Résultat

**Plus jamais d'erreurs iOS API en CI !** 🎉

Le système détecte, corrige et patch automatiquement tous les problèmes de compatibilité iOS avant le build.

