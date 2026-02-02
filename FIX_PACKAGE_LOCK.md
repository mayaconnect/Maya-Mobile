# 🔧 Correction du package-lock.json

## ❌ Problème

Le `package-lock.json` n'est pas synchronisé avec `package.json`. Il manque `eas-cli` et toutes ses dépendances.

## ✅ Solution

Exécutez ces commandes en local pour mettre à jour le `package-lock.json` :

```bash
# 1. Supprimer le lock file actuel
rm package-lock.json

# 2. Réinstaller toutes les dépendances
npm install --legacy-peer-deps

# 3. Vérifier que eas-cli est bien installé
npm list eas-cli

# 4. Commit le nouveau package-lock.json
git add package-lock.json
git commit -m "Update package-lock.json with eas-cli dependencies"
git push
```

## 🚀 Après la mise à jour

Relancez le build EAS :
```bash
npm run build:ios
```

## 📝 Note

Le `package-lock.json` doit être commité dans le repo pour que EAS Build puisse l'utiliser avec `npm ci`.

