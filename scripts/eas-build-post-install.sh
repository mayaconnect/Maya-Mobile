#!/bin/bash

# Script hook EAS Build pour exécuter expo prebuild après l'installation des dépendances
# Ce script s'exécute automatiquement après npm install lors d'un build EAS

set -e

echo "🔧 EAS Build Post-Install Hook"
echo "Platform: ${EAS_BUILD_PLATFORM:-not set}"
echo "Working directory: $(pwd)"
echo ""

# Vérifier si on doit générer le projet Android
if [ "$EAS_BUILD_PLATFORM" = "android" ] || [ -z "$EAS_BUILD_PLATFORM" ]; then
  echo "🔨 Running expo prebuild for Android..."
  
  # S'assurer que npx est disponible
  if ! command -v npx &> /dev/null; then
    echo "❌ ERREUR: npx n'est pas disponible!"
    exit 1
  fi
  
  # Exécuter prebuild pour Android avec nettoyage
  echo "   Exécution de: npx expo prebuild --platform android --clean"
  npx expo prebuild --platform android --clean || {
    echo "❌ ERREUR: expo prebuild a échoué!"
    exit 1
  }
  
  # Attendre un peu pour que les fichiers soient écrits
  sleep 2
  
  # Vérifier que le dossier android existe
  if [ ! -d "android" ]; then
    echo "❌ ERREUR: Le dossier android n'a pas été créé!"
    echo "   Contenu du répertoire actuel:"
    ls -la || true
    exit 1
  fi
  
  # Vérifier que gradlew existe
  if [ ! -f "android/gradlew" ]; then
    echo "❌ ERREUR: gradlew non trouvé après prebuild!"
    echo "   Contenu du dossier android:"
    ls -la android/ || true
    echo ""
    echo "   Tentative de régénération..."
    
    # Essayer de régénérer
    rm -rf android
    npx expo prebuild --platform android --clean
    
    # Vérifier à nouveau
    if [ ! -f "android/gradlew" ]; then
      echo "❌ ERREUR CRITIQUE: gradlew toujours absent après régénération!"
      echo "   Vérification de la structure android:"
      find android -name "gradlew*" -type f 2>/dev/null || echo "Aucun fichier gradlew trouvé"
      exit 1
    fi
  fi
  
  # Rendre gradlew exécutable
  chmod +x android/gradlew || true
  
  # Vérifier que gradlew est exécutable
  if [ ! -x "android/gradlew" ]; then
    echo "⚠️  WARNING: gradlew n'est pas exécutable, tentative de correction..."
    chmod +x android/gradlew
  fi
  
  echo "✅ Prebuild Android completed"
  echo "   gradlew trouvé à: $(pwd)/android/gradlew"
  echo "   Taille: $(ls -lh android/gradlew | awk '{print $5}')"
  echo "   Permissions: $(ls -l android/gradlew | awk '{print $1}')"
  
  # Vérification finale
  if [ -f "android/gradlew" ] && [ -x "android/gradlew" ]; then
    echo "✅ gradlew est présent et exécutable"
  else
    echo "❌ ERREUR: gradlew n'est pas exécutable!"
    exit 1
  fi
fi

# Pour iOS aussi, au cas où
if [ "$EAS_BUILD_PLATFORM" = "ios" ] || [ -z "$EAS_BUILD_PLATFORM" ]; then
  echo "🔨 Running expo prebuild for iOS..."
  npx expo prebuild --platform ios --clean || {
    echo "⚠️  WARNING: expo prebuild iOS a échoué, mais on continue..."
  }
  echo "✅ Prebuild iOS completed"
fi

echo ""
echo "✅ EAS Build Post-Install Hook completed"

