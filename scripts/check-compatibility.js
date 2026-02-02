#!/usr/bin/env node

/**
 * Comprehensive compatibility check for all dependencies
 * Checks iOS API compatibility, patches, and CI/CD readiness
 */

const fs = require('fs');
const path = require('path');
const { scanPackage } = require('./fix-ios-api-availability');

const PATCHED_PACKAGES = new Set([
  'expo-image-picker',
  'expo-image',
  'expo-font',
  'expo-symbols',
  'expo-maps',
  'expo-router',
  'expo-camera',
  'expo-print',
  'expo-web-browser',
  'expo-file-system',
  'react-native-screens',
]);

function getAllExpoAndRNPackages() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    return Object.keys(allDeps)
      .filter(pkg => pkg.startsWith('expo-') || pkg.startsWith('react-native-') || pkg === 'expo')
      .sort();
  } catch (error) {
    return [];
  }
}

function checkPatches() {
  const patchesDir = 'patches';
  if (!fs.existsSync(patchesDir)) {
    return [];
  }
  return fs.readdirSync(patchesDir)
    .filter(file => file.endsWith('.patch'))
    .map(file => {
      // Extract package name and version from filename
      // Format: package-name+version.patch
      const match = file.match(/^(.+?)\+([^+]+)\.patch$/);
      if (match) {
        return { file, package: match[1], version: match[2] };
      }
      return { file, package: file.replace('.patch', ''), version: 'unknown' };
    });
}

function checkPackageExists(packageName) {
  const packagePath = path.join('node_modules', packageName);
  return fs.existsSync(packagePath);
}

function checkIOSFolder(packageName) {
  const iosPath = path.join('node_modules', packageName, 'ios');
  return fs.existsSync(iosPath);
}

function main() {
  console.log('🔍 Vérification complète de compatibilité...\n');
  
  const allPackages = getAllExpoAndRNPackages();
  const patches = checkPatches();
  const patchMap = new Map(patches.map(p => [p.package, p]));
  
  console.log(`📦 ${allPackages.length} packages Expo/React Native trouvés\n`);
  
  const report = {
    total: allPackages.length,
    installed: 0,
    withIOS: 0,
    patched: 0,
    needsPatching: 0,
    compatible: 0,
    packages: [],
  };
  
  for (const packageName of allPackages) {
    const installed = checkPackageExists(packageName);
    const hasIOS = installed && checkIOSFolder(packageName);
    const isPatched = PATCHED_PACKAGES.has(packageName) || patchMap.has(packageName);
    
    let status = '✅ Compatible';
    let issues = [];
    
    if (!installed) {
      status = '⚠️  Non installé';
      issues.push('Package non installé dans node_modules');
    } else if (hasIOS) {
      if (isPatched) {
        report.patched++;
        status = '✅ Patché';
      } else {
        // Check for issues
        const result = scanPackage(packageName);
        if (result.issues.length > 0) {
          status = '❌ Problèmes détectés';
          issues.push(`${result.issues.length} problème(s) iOS API détecté(s)`);
          report.needsPatching++;
        } else {
          report.compatible++;
          status = '✅ Compatible';
        }
      }
    } else {
      report.compatible++;
      status = '✅ Pas de code iOS';
    }
    
    if (installed) report.installed++;
    if (hasIOS) report.withIOS++;
    
    report.packages.push({
      name: packageName,
      installed,
      hasIOS,
      isPatched,
      status,
      issues,
    });
  }
  
  // Display report
  console.log('📊 Résumé:\n');
  console.log(`   Total packages: ${report.total}`);
  console.log(`   Installés: ${report.installed}`);
  console.log(`   Avec code iOS: ${report.withIOS}`);
  console.log(`   Patchés: ${report.patched}`);
  console.log(`   Compatibles (sans patch): ${report.compatible}`);
  console.log(`   Nécessitent un patch: ${report.needsPatching}\n`);
  
  if (report.needsPatching > 0) {
    console.log('❌ Packages nécessitant un patch:\n');
    for (const pkg of report.packages) {
      if (pkg.issues.length > 0) {
        console.log(`   📦 ${pkg.name}`);
        pkg.issues.forEach(issue => console.log(`      - ${issue}`));
        console.log();
      }
    }
  }
  
  // Check patches
  console.log(`\n📝 Patches disponibles: ${patches.length}\n`);
  for (const patch of patches) {
    const pkg = report.packages.find(p => p.name === patch.package);
    if (pkg) {
      console.log(`   ✅ ${patch.package} (${patch.version})`);
    } else {
      console.log(`   ⚠️  ${patch.package} (${patch.version}) - package non trouvé`);
    }
  }
  
  // Final verdict
  console.log('\n' + '='.repeat(60) + '\n');
  if (report.needsPatching === 0) {
    console.log('✅ TOUTES LES DÉPENDANCES SONT COMPATIBLES !\n');
    console.log('   ✓ Tous les packages sont soit patchés, soit compatibles');
    console.log('   ✓ Aucun problème iOS API détecté');
    console.log('   ✓ Prêt pour la CI/CD\n');
    return 0;
  } else {
    console.log('⚠️  ATTENTION: Certains packages nécessitent un patch\n');
    console.log('   Actions recommandées:');
    console.log('   1. Exécuter: npm run check-ios-apis');
    console.log('   2. Corriger les problèmes détectés');
    console.log('   3. Créer les patches: npx patch-package <package-name>');
    console.log('   4. Ajouter à PATCHED_PACKAGES dans le script\n');
    return 1;
  }
}

if (require.main === module) {
  const exitCode = main();
  process.exit(exitCode);
}

module.exports = { main, checkPatches, getAllExpoAndRNPackages };

