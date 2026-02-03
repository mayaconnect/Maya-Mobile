#!/bin/bash

# Script hook EAS Build pour exécuter expo prebuild après l'installation des dépendances
# Ce script s'exécute automatiquement après npm install lors d'un build EAS

set -e

echo "🔧 EAS Build Post-Install Hook"
echo "Platform: ${EAS_BUILD_PLATFORM:-not set}"
echo ""

# Vérifier si on doit générer le projet Android
if [ "$EAS_BUILD_PLATFORM" = "android" ] || [ -z "$EAS_BUILD_PLATFORM" ]; then
  echo "🔨 Running expo prebuild for Android..."
  
  # Exécuter prebuild pour Android
  npx expo prebuild --platform android --clean
  
  # Vérifier que gradlew existe
  if [ ! -f "android/gradlew" ]; then
    echo "❌ ERREUR: gradlew non trouvé après prebuild!"
    echo "   Contenu du dossier android:"
    ls -la android/ || true
    exit 1
  fi
  
  # Rendre gradlew exécutable
  chmod +x android/gradlew
  
  echo "✅ Prebuild Android completed"
  echo "   gradlew trouvé à: $(pwd)/android/gradlew"
  ls -lh android/gradlew || true
fi

# Pour iOS aussi, au cas où
if [ "$EAS_BUILD_PLATFORM" = "ios" ] || [ -z "$EAS_BUILD_PLATFORM" ]; then
  echo "🔨 Running expo prebuild for iOS..."
  npx expo prebuild --platform ios --clean
  echo "✅ Prebuild iOS completed"
fi

echo ""
echo "✅ EAS Build Post-Install Hook completed"

