# 🚀 Quick Start - Build avec EAS

## ⚡ Commandes rapides

### Build iOS
```bash
npm run build:ios
```

### Build Android
```bash
npm run build:android
```

### Build iOS + Android
```bash
npm run build:all
```

## 📋 Première utilisation

### 1. Se connecter à Expo
```bash
npx eas login
```

### 2. Configurer les credentials (une seule fois)
```bash
npx eas credentials
```
- Sélectionnez **iOS** → **Production** → **Gérer avec EAS** (recommandé)

### 3. Lancer le build
```bash
npm run build:ios
```

## ✅ Ce qui se passe automatiquement

1. **Installation des dépendances** : EAS Build installe automatiquement toutes les dépendances
2. **Application des patches** : Le script `postinstall` applique automatiquement les patches iOS
3. **Correction des APIs** : Les correctifs iOS sont appliqués automatiquement
4. **Build** : Le build iOS est lancé sur les serveurs EAS

## 🔍 Vérifier le statut du build

```bash
npx eas build:list
```

## 📱 Soumettre à TestFlight (après le build)

```bash
npm run eas:submit:ios
```

## 🐛 Problèmes courants

### Erreur "npm ci failed"
- Vérifiez que `.npmrc` contient `legacy-peer-deps=true`
- Vérifiez que `package-lock.json` est à jour

### Erreur de credentials
```bash
npx eas credentials
```

### Voir les logs détaillés
```bash
npx eas build:view [BUILD_ID]
```

## 📚 Documentation complète

Voir `EAS_BUILD.md` pour plus de détails.

