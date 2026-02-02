#!/usr/bin/env node

/**
 * Script pour corriger les erreurs NS_ASSUME_NONNULL_BEGIN dans react-native-maps
 * Le problème est que NS_ASSUME_NONNULL_BEGIN est utilisé plusieurs fois sans NS_ASSUME_NONNULL_END correspondant
 */

const fs = require('fs');
const path = require('path');

const FILES_TO_FIX = [
  'node_modules/react-native-maps/ios/generated/RNMapsAirModuleDelegate.h',
  'node_modules/react-native-maps/ios/AirMaps/AIRMap.h',
];

const IOS_FILES_TO_FIX = [
  'ios/Pods/Headers/Public/react-native-maps/react-native-maps/generated/RNMapsAirModuleDelegate.h',
  'ios/Pods/Headers/Public/react-native-maps/react-native-maps/AirMaps/AIRMap.h',
  'ios/generated/RNMapsAirModuleDelegate.h',
  'ios/AirMaps/AIRMap.h',
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  console.log(`📝 Fixing ${filePath}...`);

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const lines = content.split('\n');

  // Compter les occurrences
  const beginMatches = content.match(/NS_ASSUME_NONNULL_BEGIN/g);
  const endMatches = content.match(/NS_ASSUME_NONNULL_END/g);
  const beginCount = beginMatches ? beginMatches.length : 0;
  const endCount = endMatches ? endMatches.length : 0;

  console.log(`   Found ${beginCount} NS_ASSUME_NONNULL_BEGIN and ${endCount} NS_ASSUME_NONNULL_END`);

  // Si beginCount > endCount, il manque des END
  if (beginCount > endCount) {
    console.log(`   ⚠️  Missing ${beginCount - endCount} NS_ASSUME_NONNULL_END marker(s)`);

    // Trouver la dernière position d'un @end ou la fin du fichier
    let lastEndIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === '@end') {
        lastEndIndex = i;
        break;
      }
    }

    // Ajouter les END manquants
    const missing = beginCount - endCount;
    if (lastEndIndex >= 0) {
      // Ajouter après le dernier @end
      lines.splice(lastEndIndex + 1, 0, '', 'NS_ASSUME_NONNULL_END');
      if (missing > 1) {
        // Ajouter les autres END avant
        for (let i = 1; i < missing; i++) {
          lines.splice(lastEndIndex + 1, 0, 'NS_ASSUME_NONNULL_END');
        }
      }
    } else {
      // Ajouter à la fin du fichier
      lines.push('');
      for (let i = 0; i < missing; i++) {
        lines.push('NS_ASSUME_NONNULL_END');
      }
    }

    content = lines.join('\n');
    console.log(`   ✅ Added ${missing} NS_ASSUME_NONNULL_END marker(s)`);
  }

  // Vérifier et corriger les NS_ASSUME_NONNULL_BEGIN imbriqués
  // Si le fichier commence par NS_ASSUME_NONNULL_BEGIN et en contient un autre sans END entre
  const beginIndices = [];
  const endIndices = [];

  lines.forEach((line, index) => {
    if (line.includes('NS_ASSUME_NONNULL_BEGIN')) {
      beginIndices.push(index);
    }
    if (line.includes('NS_ASSUME_NONNULL_END')) {
      endIndices.push(index);
    }
  });

  // Vérifier s'il y a des BEGIN consécutifs sans END entre
  for (let i = 0; i < beginIndices.length - 1; i++) {
    const currentBegin = beginIndices[i];
    const nextBegin = beginIndices[i + 1];
    
    // Vérifier s'il y a un END entre les deux
    const hasEndBetween = endIndices.some(endIdx => endIdx > currentBegin && endIdx < nextBegin);
    
    if (!hasEndBetween) {
      console.log(`   ⚠️  Found nested NS_ASSUME_NONNULL_BEGIN at line ${nextBegin + 1}`);
      // Supprimer le deuxième BEGIN
      lines[nextBegin] = lines[nextBegin].replace(/NS_ASSUME_NONNULL_BEGIN\s*/g, '');
      if (lines[nextBegin].trim() === '') {
        lines.splice(nextBegin, 1);
      }
      content = lines.join('\n');
      console.log(`   ✅ Removed duplicate NS_ASSUME_NONNULL_BEGIN`);
      break; // Ne corriger qu'un à la fois
    }
  }

  // Solution de contournement : ajouter un reset au début si le fichier commence par NS_ASSUME_NONNULL_BEGIN
  // et qu'il pourrait être inclus dans un contexte qui a déjà NS_ASSUME_NONNULL_BEGIN
  const firstLines = lines.slice(0, 10).join('\n');
  if (firstLines.includes('NS_ASSUME_NONNULL_BEGIN') && !firstLines.includes('#pragma clang assume_nonnull end')) {
    // Vérifier si le fichier commence par #if ou #import
    const firstNonEmptyLine = lines.find(line => line.trim() && !line.trim().startsWith('//'));
    if (firstNonEmptyLine && !firstNonEmptyLine.trim().startsWith('#if')) {
      // Ajouter un reset au début
      lines.unshift('#ifdef __clang__', '#pragma clang assume_nonnull end', '#endif', '');
      content = lines.join('\n');
      console.log(`   ✅ Added nullability reset at the beginning`);
    }
  }

  // Sauvegarder seulement si le contenu a changé
  if (content !== originalContent) {
    // Backup
    fs.writeFileSync(`${filePath}.bak`, originalContent, 'utf8');
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

function main() {
  console.log('🔧 Fixing NS_ASSUME_NONNULL_BEGIN errors in react-native-maps...\n');

  let fixedCount = 0;

  // Corriger les fichiers dans node_modules
  for (const file of FILES_TO_FIX) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }

  // Corriger les fichiers dans ios/ (après prebuild)
  for (const file of IOS_FILES_TO_FIX) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} file(s)`);
}

main();

