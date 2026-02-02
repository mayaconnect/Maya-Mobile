#!/bin/bash

# Script pour corriger les erreurs NS_ASSUME_NONNULL_BEGIN dans react-native-maps
# Le problème est que NS_ASSUME_NONNULL_BEGIN est utilisé plusieurs fois sans NS_ASSUME_NONNULL_END correspondant

set +e

echo "🔧 Fixing NS_ASSUME_NONNULL_BEGIN errors in react-native-maps..."

# Fichiers à corriger
FILES=(
  "node_modules/react-native-maps/ios/generated/RNMapsAirModuleDelegate.h"
  "node_modules/react-native-maps/ios/AirMaps/AIRMap.h"
)

# Fonction pour corriger un fichier
fix_file() {
  local file_path=$1
  
  if [ ! -f "$file_path" ]; then
    echo "⚠️  File not found: $file_path"
    return 1
  fi
  
  echo "📝 Fixing $file_path..."
  
  # Backup
  cp "$file_path" "$file_path.bak" 2>/dev/null || true
  
  # Lire le contenu
  local content=$(cat "$file_path")
  
  # Compter les occurrences de NS_ASSUME_NONNULL_BEGIN et NS_ASSUME_NONNULL_END
  local begin_count=$(echo "$content" | grep -c "NS_ASSUME_NONNULL_BEGIN" || echo "0")
  local end_count=$(echo "$content" | grep -c "NS_ASSUME_NONNULL_END" || echo "0")
  
  echo "   Found $begin_count NS_ASSUME_NONNULL_BEGIN and $end_count NS_ASSUME_NONNULL_END"
  
  # Si begin_count > end_count, il manque des END
  if [ "$begin_count" -gt "$end_count" ]; then
    echo "   ⚠️  Missing NS_ASSUME_NONNULL_END markers"
    
    # Ajouter les END manquants avant le dernier @end ou à la fin du fichier
    local missing=$((begin_count - end_count))
    
    # Si le fichier se termine par @end, ajouter NS_ASSUME_NONNULL_END avant
    if echo "$content" | tail -1 | grep -q "@end"; then
      # Ajouter NS_ASSUME_NONNULL_END avant le dernier @end
      for ((i=1; i<=missing; i++)); do
        content=$(echo "$content" | sed '$i\NS_ASSUME_NONNULL_END')
      done
    else
      # Ajouter à la fin du fichier
      for ((i=1; i<=missing; i++)); do
        content="$content"$'\n'"NS_ASSUME_NONNULL_END"
      done
    fi
    
    echo "$content" > "$file_path"
    echo "   ✅ Added $missing NS_ASSUME_NONNULL_END marker(s)"
  fi
  
  # Vérifier s'il y a des NS_ASSUME_NONNULL_BEGIN en double (sans END entre)
  # Si le fichier commence par NS_ASSUME_NONNULL_BEGIN et en contient un autre plus tard sans END entre les deux
  local first_begin_line=$(echo "$content" | grep -n "NS_ASSUME_NONNULL_BEGIN" | head -1 | cut -d: -f1)
  local second_begin_line=$(echo "$content" | grep -n "NS_ASSUME_NONNULL_BEGIN" | head -2 | tail -1 | cut -d: -f1)
  
  if [ -n "$second_begin_line" ] && [ "$second_begin_line" != "$first_begin_line" ]; then
    # Vérifier s'il y a un END entre les deux
    local has_end_between=false
    if [ "$first_begin_line" -lt "$second_begin_line" ]; then
      local between_content=$(echo "$content" | sed -n "${first_begin_line},${second_begin_line}p")
      if echo "$between_content" | grep -q "NS_ASSUME_NONNULL_END"; then
        has_end_between=true
      fi
    fi
    
    if [ "$has_end_between" = false ]; then
      echo "   ⚠️  Found nested NS_ASSUME_NONNULL_BEGIN without END"
      # Supprimer le deuxième BEGIN
      content=$(echo "$content" | sed "${second_begin_line}d")
      echo "$content" > "$file_path"
      echo "   ✅ Removed duplicate NS_ASSUME_NONNULL_BEGIN"
    fi
  fi
  
  # Solution de contournement : ajouter un reset au début si nécessaire
  # Vérifier si le fichier commence directement par NS_ASSUME_NONNULL_BEGIN sans reset
  if echo "$content" | head -5 | grep -q "NS_ASSUME_NONNULL_BEGIN" && ! echo "$content" | head -10 | grep -q "#pragma clang assume_nonnull end"; then
    # Ajouter un reset au début si le fichier est inclus dans un contexte qui a déjà NS_ASSUME_NONNULL_BEGIN
    local first_line=$(echo "$content" | head -1)
    if [[ ! "$first_line" =~ ^#if ]]; then
      # Ajouter un reset au début
      content="#ifdef __clang__"$'\n'"#pragma clang assume_nonnull end"$'\n'"#endif"$'\n'"$content"
      echo "$content" > "$file_path"
      echo "   ✅ Added nullability reset at the beginning"
    fi
  fi
}

# Corriger chaque fichier
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    fix_file "$file"
  else
    echo "⚠️  File not found: $file (will be fixed when node_modules is installed)"
  fi
done

# Aussi vérifier dans ios/ après prebuild
IOS_FILES=(
  "ios/Pods/Headers/Public/react-native-maps/react-native-maps/generated/RNMapsAirModuleDelegate.h"
  "ios/Pods/Headers/Public/react-native-maps/react-native-maps/AirMaps/AIRMap.h"
  "ios/generated/RNMapsAirModuleDelegate.h"
  "ios/AirMaps/AIRMap.h"
)

for file in "${IOS_FILES[@]}"; do
  if [ -f "$file" ]; then
    fix_file "$file"
  fi
done

echo "✅ react-native-maps nullability fixes applied"

