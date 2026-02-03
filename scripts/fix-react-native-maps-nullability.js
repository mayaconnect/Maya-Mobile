#!/usr/bin/env node

/**
 * Script pour corriger les erreurs NS_ASSUME_NONNULL_BEGIN dans react-native-maps
 * Le problème est que NS_ASSUME_NONNULL_BEGIN est utilisé plusieurs fois sans NS_ASSUME_NONNULL_END correspondant
 * ou que des fichiers sont inclus dans un contexte où NS_ASSUME_NONNULL_BEGIN est déjà ouvert
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

// Fonction pour trouver tous les fichiers .h dans un répertoire
function findHeaderFiles(dir, fileList = [], depth = 0) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }
  
  // Limiter la profondeur pour éviter les boucles infinies
  if (depth > 10) {
    return fileList;
  }
  
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Éviter les répertoires système mais permettre node_modules/react-native-maps
          // (on est déjà dans node_modules/react-native-maps, donc on ne veut pas exclure)
          if (!file.startsWith('.') && 
              !filePath.includes('.git') &&
              !filePath.includes('build') &&
              !filePath.includes('DerivedData') &&
              !filePath.includes('Pods')) {
            findHeaderFiles(filePath, fileList, depth + 1);
          }
        } else if (file.endsWith('.h')) {
          fileList.push(filePath);
        }
      } catch (e) {
        // Ignorer les erreurs de lecture (permissions, etc.)
      }
    });
  } catch (e) {
    // Ignorer les erreurs de lecture du répertoire
  }
  
  return fileList;
}

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

  let modified = false;

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
    modified = true;
  }

  // Si endCount > beginCount, il y a trop de END
  if (endCount > beginCount) {
    console.log(`   ⚠️  Found ${endCount - beginCount} extra NS_ASSUME_NONNULL_END marker(s)`);
    const extra = endCount - beginCount;
    let removed = 0;
    
    // Supprimer les END en trop (commencer par la fin)
    for (let i = lines.length - 1; i >= 0 && removed < extra; i--) {
      if (lines[i].trim() === 'NS_ASSUME_NONNULL_END') {
        lines.splice(i, 1);
        removed++;
      }
    }
    
    if (removed > 0) {
      content = lines.join('\n');
      console.log(`   ✅ Removed ${removed} extra NS_ASSUME_NONNULL_END marker(s)`);
      modified = true;
    }
  }

  // Recalculer après les modifications précédentes
  if (modified) {
    lines.length = 0;
    lines.push(...content.split('\n'));
  }

  // Vérifier et corriger les NS_ASSUME_NONNULL_BEGIN imbriqués
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
      const lineContent = lines[nextBegin];
      const cleaned = lineContent.replace(/NS_ASSUME_NONNULL_BEGIN\s*/g, '').trim();
      if (cleaned === '') {
        lines.splice(nextBegin, 1);
      } else {
        lines[nextBegin] = cleaned;
      }
      content = lines.join('\n');
      console.log(`   ✅ Removed duplicate NS_ASSUME_NONNULL_BEGIN`);
      modified = true;
      // Recalculer les indices après modification
      beginIndices.length = 0;
      endIndices.length = 0;
      lines.length = 0;
      lines.push(...content.split('\n'));
      lines.forEach((line, index) => {
        if (line.includes('NS_ASSUME_NONNULL_BEGIN')) {
          beginIndices.push(index);
        }
        if (line.includes('NS_ASSUME_NONNULL_END')) {
          endIndices.push(index);
        }
      });
      i--; // Re-vérifier cette position
    }
  }

  // Pour les fichiers qui incluent d'autres fichiers avec NS_ASSUME_NONNULL_BEGIN,
  // ajouter une protection si le fichier n'a pas lui-même de NS_ASSUME_NONNULL_BEGIN
  // et qu'il pourrait être inclus dans un contexte où NS_ASSUME_NONNULL_BEGIN est déjà ouvert
  const hasBegin = content.includes('NS_ASSUME_NONNULL_BEGIN');
  const hasEnd = content.includes('NS_ASSUME_NONNULL_END');
  const hasIncludes = /#import.*\.h/.test(content);
  
  // Cas spécial : AIRMap.h inclut SMCalloutView.h qui a NS_ASSUME_NONNULL_BEGIN
  // Si AIRMap.h est inclus dans un contexte où NS_ASSUME_NONNULL_BEGIN est déjà ouvert,
  // cela crée une imbrication. On doit ajouter une protection.
  const isAIRMap = filePath.includes('AIRMap.h') && !filePath.includes('AIRMapManager') && !filePath.includes('AIRMapMarker');
  
  // Si le fichier n'a pas de macros mais inclut d'autres fichiers,
  // et qu'il pourrait être inclus dans un contexte avec NS_ASSUME_NONNULL_BEGIN,
  // on peut ajouter une protection au début
  if ((!hasBegin && !hasEnd && hasIncludes) || isAIRMap) {
    // Vérifier si le fichier inclut des fichiers qui ont NS_ASSUME_NONNULL_BEGIN
    const importMatches = content.match(/#import\s+["<]([^">]+)["]?/g);
    if (importMatches) {
      let needsProtection = isAIRMap; // AIRMap.h a toujours besoin de protection
      
      if (!needsProtection) {
        for (const importLine of importMatches) {
          const importMatch = importLine.match(/#import\s+["<]([^">]+)["]?/);
          if (!importMatch) continue;
          const importPath = importMatch[1];
          
          // Chercher le fichier importé dans node_modules
          const dir = path.dirname(filePath);
          const possiblePaths = [
            path.join(dir, importPath),
            path.join(dir, '..', importPath),
            path.join(dir, '../..', importPath),
            path.join('node_modules/react-native-maps/ios', importPath),
            path.join('node_modules/react-native-maps/ios/AirMaps', importPath),
            path.join('node_modules/react-native-maps/ios/generated', importPath),
            path.join('node_modules/react-native-maps/ios/AirMaps/Callout', importPath),
          ];
          
          for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
              const importedContent = fs.readFileSync(possiblePath, 'utf8');
              if (importedContent.includes('NS_ASSUME_NONNULL_BEGIN')) {
                needsProtection = true;
                break;
              }
            }
          }
          if (needsProtection) break;
        }
      }
      
      // Ajouter une protection au début du fichier si nécessaire
      if (needsProtection && !content.includes('#pragma clang assume_nonnull')) {
        // Trouver la position après les imports et avant les déclarations
        let insertIndex = 0;
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim();
          if (trimmed.startsWith('#import') || trimmed.startsWith('@import')) {
            lastImportIndex = i;
            insertIndex = i + 1;
          } else if (trimmed.startsWith('@interface') || 
                     trimmed.startsWith('@protocol') ||
                     trimmed.startsWith('@class') ||
                     trimmed.startsWith('@implementation')) {
            break;
          }
        }
        
        // Ajouter une protection pour éviter les problèmes d'imbrication
        // On ajoute un reset avant les imports pour s'assurer que le contexte est propre
        if (insertIndex > 0 || lastImportIndex >= 0) {
          const protectionLines = [
            '',
            '#ifdef __clang__',
            '#pragma clang assume_nonnull end',
            '#endif',
            ''
          ];
          
          // Insérer après le dernier import
          if (lastImportIndex >= 0) {
            lines.splice(lastImportIndex + 1, 0, ...protectionLines);
          } else {
            lines.splice(insertIndex, 0, ...protectionLines);
          }
          
          content = lines.join('\n');
          console.log(`   ✅ Added nullability protection to prevent nesting issues`);
          modified = true;
        }
      }
    }
  }

  // Sauvegarder seulement si le contenu a changé
  if (modified && content !== originalContent) {
    // Backup
    try {
      fs.writeFileSync(`${filePath}.bak`, originalContent, 'utf8');
    } catch (e) {
      // Ignore backup errors
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

function main() {
  console.log('🔧 Fixing NS_ASSUME_NONNULL_BEGIN errors in react-native-maps...\n');

  let fixedCount = 0;

  // Corriger les fichiers spécifiques
  for (const file of FILES_TO_FIX) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }

  // Scanner et corriger tous les fichiers .h dans react-native-maps/ios
  const rnmapsPath = path.join('node_modules', 'react-native-maps', 'ios');
  if (fs.existsSync(rnmapsPath)) {
    console.log('\n🔍 Scanning all header files in react-native-maps...');
    const headerFiles = findHeaderFiles(rnmapsPath);
    console.log(`   Found ${headerFiles.length} header files`);
    if (headerFiles.length === 0) {
      // Debug: vérifier manuellement quelques fichiers
      const testFiles = [
        path.join(rnmapsPath, 'AirMaps', 'AIRMap.h'),
        path.join(rnmapsPath, 'generated', 'RNMapsAirModuleDelegate.h'),
      ];
      testFiles.forEach(testFile => {
        if (fs.existsSync(testFile)) {
          console.log(`   Debug: Found ${testFile}`);
        }
      });
    }
    
    for (const headerFile of headerFiles) {
      // Vérifier si le fichier a des problèmes
      const content = fs.readFileSync(headerFile, 'utf8');
      const beginCount = (content.match(/NS_ASSUME_NONNULL_BEGIN/g) || []).length;
      const endCount = (content.match(/NS_ASSUME_NONNULL_END/g) || []).length;
      
      if (beginCount !== endCount || beginCount > 1) {
        const relativePath = path.relative(process.cwd(), headerFile);
        console.log(`\n   Checking ${relativePath}...`);
        if (fixFile(headerFile)) {
          fixedCount++;
        }
      }
    }
  }

  // Corriger les fichiers dans ios/ (après prebuild)
  for (const file of IOS_FILES_TO_FIX) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }

  // Scanner aussi les fichiers dans ios/ après prebuild
  const iosPath = 'ios';
  if (fs.existsSync(iosPath)) {
    console.log('\n🔍 Scanning header files in ios/ directory...');
    const iosHeaderFiles = findHeaderFiles(iosPath);
    console.log(`   Found ${iosHeaderFiles.length} header files`);
    
    for (const headerFile of iosHeaderFiles) {
      // Ne traiter que les fichiers liés à react-native-maps
      if (headerFile.includes('react-native-maps') || headerFile.includes('AirMaps') || headerFile.includes('RNMaps')) {
        const content = fs.readFileSync(headerFile, 'utf8');
        const beginCount = (content.match(/NS_ASSUME_NONNULL_BEGIN/g) || []).length;
        const endCount = (content.match(/NS_ASSUME_NONNULL_END/g) || []).length;
        
        if (beginCount !== endCount || beginCount > 1) {
          const relativePath = path.relative(process.cwd(), headerFile);
          console.log(`\n   Checking ${relativePath}...`);
          if (fixFile(headerFile)) {
            fixedCount++;
          }
        }
      }
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} file(s)`);
}

main();

