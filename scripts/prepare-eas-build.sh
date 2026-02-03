#!/bin/bash

# Script pour préparer le projet avant un build EAS
# Applique les patches et corrige les problèmes iOS/Android

set -e

echo "🔧 Préparation du projet pour EAS Build..."
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
  echo "❌ Erreur: package.json non trouvé. Exécutez ce script depuis la racine du projet."
  exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
  echo "📦 Installation des dépendances..."
  npm install --legacy-peer-deps
fi

# Installer patch-package si nécessaire
if ! command -v npx &> /dev/null || ! npx patch-package --version &> /dev/null; then
  echo "📦 Installation de patch-package..."
  npm install --save-dev patch-package --no-save --legacy-peer-deps
fi

# Générer les dossiers natifs si nécessaire
echo ""
echo "🔨 Génération des dossiers natifs (prebuild)..."
# Toujours exécuter prebuild pour s'assurer que les dossiers sont à jour
echo "📱 Exécution de expo prebuild --clean..."
npx expo prebuild --clean
echo "✅ Prebuild terminé"

# Vérifier que gradlew existe pour Android
if [ -d "android" ]; then
  echo ""
  echo "🔧 Vérification de gradlew pour Android..."
  if [ ! -f "android/gradlew" ]; then
    echo "❌ ERREUR: gradlew non trouvé après prebuild!"
    echo "   Tentative de régénération..."
    npx expo prebuild --platform android --clean
    if [ ! -f "android/gradlew" ]; then
      echo "❌ ERREUR CRITIQUE: gradlew toujours absent!"
      exit 1
    fi
  else
    echo "✅ gradlew trouvé"
    # S'assurer que gradlew est exécutable
    chmod +x android/gradlew || true
  fi
fi

# Appliquer les correctifs iOS automatiques
echo ""
echo "🔍 Application des correctifs iOS automatiques..."
if [ -f "scripts/auto-fix-and-patch-ios.js" ]; then
  node scripts/auto-fix-and-patch-ios.js
else
  echo "⚠️  Script auto-fix-and-patch-ios.js non trouvé, passage..."
fi

# Appliquer les patches
echo ""
echo "📦 Application des patches..."
if [ -d "patches" ] && [ -n "$(ls -A patches/*.patch 2>/dev/null)" ]; then
  echo "📋 Patches trouvés:"
  ls -la patches/*.patch
  echo ""
  npx patch-package
  echo "✅ Patches appliqués avec succès"
else
  echo "⚠️  Aucun patch trouvé, passage..."
fi

# Corriger les problèmes de nullability
echo ""
echo "🔧 Correction des problèmes de nullability iOS..."
if [ -f "scripts/fix-ios-nullability.sh" ]; then
  chmod +x scripts/fix-ios-nullability.sh
  bash scripts/fix-ios-nullability.sh
  echo "✅ Corrections de nullability appliquées"
else
  echo "⚠️  Script fix-ios-nullability.sh non trouvé, passage..."
fi

# Vérifier que gradlew existe pour Android
if [ -d "android" ]; then
  echo ""
  echo "🔧 Vérification de gradlew pour Android..."
  if [ ! -f "android/gradlew" ]; then
    echo "⚠️  gradlew non trouvé, régénération du dossier android..."
    npx expo prebuild --platform android --clean
  else
    echo "✅ gradlew trouvé"
    # S'assurer que gradlew est exécutable
    chmod +x android/gradlew || true
  fi
fi

echo ""
echo "✅ Préparation terminée ! Vous pouvez maintenant lancer:"
echo "   npm run eas:build:ios"
echo "   npm run eas:build:android"
echo "   ou"
echo "   eas build --platform all --profile production"
echo ""

