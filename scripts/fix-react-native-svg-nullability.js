#!/usr/bin/env node

/**
 * Script pour corriger les erreurs NS_ASSUME_NONNULL_BEGIN dans react-native-svg
 * Le problème est que NS_ASSUME_NONNULL_BEGIN est utilisé plusieurs fois sans NS_ASSUME_NONNULL_END correspondant
 * ou que des fichiers sont inclus dans un contexte où NS_ASSUME_NONNULL_BEGIN est déjà ouvert
 */

const fs = require('fs');
const path = require('path');

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
          if (!file.startsWith('.') && 
              !filePath.includes('.git') &&
              !filePath.includes('build') &&
              !filePath.includes('DerivedData')) {
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
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const lines = content.split('\n');

  // Compter les occurrences
  const beginMatches = content.match(/NS_ASSUME_NONNULL_BEGIN/g);
  const endMatches = content.match(/NS_ASSUME_NONNULL_END/g);
  const beginCount = beginMatches ? beginMatches.length : 0;
  const endCount = endMatches ? endMatches.length : 0;

  let modified = false;

  // Si beginCount > endCount, il manque des END
  if (beginCount > endCount) {
    // Trouver la dernière position d'un @end ou la fin du fichier
    let lastEndIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === '@end') {
        lastEndIndex = i;
        break;
      }
    }

    if (lastEndIndex >= 0) {
      // Ajouter NS_ASSUME_NONNULL_END après le dernier @end
      const missingEnds = beginCount - endCount;
      for (let i = 0; i < missingEnds; i++) {
        lines.splice(lastEndIndex + 1, 0, 'NS_ASSUME_NONNULL_END');
      }
      modified = true;
    } else {
      // Pas de @end trouvé, ajouter à la fin du fichier
      const missingEnds = beginCount - endCount;
      for (let i = 0; i < missingEnds; i++) {
        lines.push('NS_ASSUME_NONNULL_END');
      }
      modified = true;
    }
  }

  // Si beginCount < endCount, il y a trop de END
  if (beginCount < endCount && !modified) {
    const extraEnds = endCount - beginCount;
    let removed = 0;
    for (let i = lines.length - 1; i >= 0 && removed < extraEnds; i--) {
      if (lines[i].trim() === 'NS_ASSUME_NONNULL_END') {
        lines.splice(i, 1);
        removed++;
        modified = true;
      }
    }
  }

  // Vérifier les pragma clang assume_nonnull
  const pragmaBeginMatches = content.match(/#pragma clang assume_nonnull begin/g);
  const pragmaEndMatches = content.match(/#pragma clang assume_nonnull end/g);
  const pragmaBeginCount = pragmaBeginMatches ? pragmaBeginMatches.length : 0;
  const pragmaEndCount = pragmaEndMatches ? pragmaEndMatches.length : 0;

  // Si on a des pragma begin sans end correspondant, les remplacer par NS_ASSUME_NONNULL_BEGIN/END
  if (pragmaBeginCount > pragmaEndCount && !modified) {
    // Remplacer les pragma par NS_ASSUME_NONNULL
    content = content.replace(/#pragma clang assume_nonnull begin/g, 'NS_ASSUME_NONNULL_BEGIN');
    content = content.replace(/#pragma clang assume_nonnull end/g, 'NS_ASSUME_NONNULL_END');
    lines = content.split('\n');
    
    // Recompter
    const newBeginMatches = content.match(/NS_ASSUME_NONNULL_BEGIN/g);
    const newEndMatches = content.match(/NS_ASSUME_NONNULL_END/g);
    const newBeginCount = newBeginMatches ? newBeginMatches.length : 0;
    const newEndCount = newEndMatches ? newEndMatches.length : 0;
    
    if (newBeginCount > newEndCount) {
      const missingEnds = newBeginCount - newEndCount;
      let lastEndIndex = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() === '@end') {
          lastEndIndex = i;
          break;
        }
      }
      
      if (lastEndIndex >= 0) {
        for (let i = 0; i < missingEnds; i++) {
          lines.splice(lastEndIndex + 1, 0, 'NS_ASSUME_NONNULL_END');
        }
      } else {
        for (let i = 0; i < missingEnds; i++) {
          lines.push('NS_ASSUME_NONNULL_END');
        }
      }
    }
    modified = true;
  }

  // Si le fichier commence par NS_ASSUME_NONNULL_BEGIN sans protection, ajouter une protection
  if (lines.length > 0 && lines[0].trim() === 'NS_ASSUME_NONNULL_BEGIN') {
    // Vérifier si c'est déjà protégé
    let needsProtection = true;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      if (lines[i].includes('#ifdef') || lines[i].includes('#if')) {
        needsProtection = false;
        break;
      }
    }
    
    if (needsProtection) {
      // Ajouter une protection pour éviter les conflits
      lines.unshift('#ifdef __clang__', '#pragma clang assume_nonnull end', '#endif', '');
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    return true;
  }

  return false;
}

function main() {
  console.log('🔧 Fixing NS_ASSUME_NONNULL_BEGIN errors in react-native-svg...\n');

  let fixedCount = 0;

  // Scanner et corriger tous les fichiers .h dans react-native-svg
  const rnsvgPath = path.join('node_modules', 'react-native-svg');
  if (fs.existsSync(rnsvgPath)) {
    console.log('🔍 Scanning header files in react-native-svg...');
    const headerFiles = findHeaderFiles(rnsvgPath);
    console.log(`   Found ${headerFiles.length} header files`);
    
    for (const headerFile of headerFiles) {
      // Vérifier si le fichier a des problèmes
      const content = fs.readFileSync(headerFile, 'utf8');
      const beginCount = (content.match(/NS_ASSUME_NONNULL_BEGIN/g) || []).length;
      const endCount = (content.match(/NS_ASSUME_NONNULL_END/g) || []).length;
      const pragmaBeginCount = (content.match(/#pragma clang assume_nonnull begin/g) || []).length;
      const pragmaEndCount = (content.match(/#pragma clang assume_nonnull end/g) || []).length;
      
      if (beginCount !== endCount || beginCount > 1 || pragmaBeginCount !== pragmaEndCount) {
        const relativePath = path.relative(process.cwd(), headerFile);
        console.log(`\n   Checking ${relativePath}...`);
        if (fixFile(headerFile)) {
          fixedCount++;
          console.log(`   ✅ Fixed ${relativePath}`);
        }
      }
    }
  }

  // Corriger les fichiers dans ios/ (après prebuild)
  const iosPath = 'ios';
  if (fs.existsSync(iosPath)) {
    console.log('\n🔍 Scanning header files in ios/ directory...');
    const iosHeaderFiles = findHeaderFiles(iosPath);
    console.log(`   Found ${iosHeaderFiles.length} header files`);
    
    for (const headerFile of iosHeaderFiles) {
      // Ne traiter que les fichiers liés à react-native-svg
      if (headerFile.includes('react-native-svg') || headerFile.includes('RNSVG')) {
        const content = fs.readFileSync(headerFile, 'utf8');
        const beginCount = (content.match(/NS_ASSUME_NONNULL_BEGIN/g) || []).length;
        const endCount = (content.match(/NS_ASSUME_NONNULL_END/g) || []).length;
        const pragmaBeginCount = (content.match(/#pragma clang assume_nonnull begin/g) || []).length;
        const pragmaEndCount = (content.match(/#pragma clang assume_nonnull end/g) || []).length;
        
        if (beginCount !== endCount || beginCount > 1 || pragmaBeginCount !== pragmaEndCount) {
          const relativePath = path.relative(process.cwd(), headerFile);
          console.log(`\n   Checking ${relativePath}...`);
          if (fixFile(headerFile)) {
            fixedCount++;
            console.log(`   ✅ Fixed ${relativePath}`);
          }
        }
      }
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} file(s)`);
}

main();

