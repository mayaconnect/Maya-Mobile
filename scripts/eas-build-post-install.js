#!/usr/bin/env node

/**
 * Script hook EAS Build pour exécuter expo prebuild après l'installation des dépendances
 * Version Node.js pour une meilleure compatibilité avec EAS Build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const platform = process.env.EAS_BUILD_PLATFORM || '';

console.log('🔧 EAS Build Post-Install Hook (Node.js)');
console.log(`Platform: ${platform || 'not set'}`);
console.log(`Working directory: ${process.cwd()}`);
console.log('');

// Fonction pour exécuter une commande
function runCommand(command, description) {
  console.log(`📝 ${description}`);
  console.log(`   Command: ${command}`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    return true;
  } catch (error) {
    console.error(`❌ ERREUR: ${description} a échoué!`);
    console.error(`   Exit code: ${error.status}`);
    return false;
  }
}

// Fonction pour vérifier que gradlew existe
function verifyGradlew() {
  const gradlewPath = path.join(process.cwd(), 'android', 'gradlew');
  const gradlewBatPath = path.join(process.cwd(), 'android', 'gradlew.bat');
  
  if (fs.existsSync(gradlewPath)) {
    console.log(`✅ gradlew trouvé à: ${gradlewPath}`);
    
    // Rendre exécutable (sur Unix)
    try {
      fs.chmodSync(gradlewPath, 0o755);
      console.log('✅ gradlew rendu exécutable');
    } catch (e) {
      console.log('⚠️  Impossible de changer les permissions (normal sur Windows)');
    }
    
    // Vérifier les stats
    const stats = fs.statSync(gradlewPath);
    console.log(`   Taille: ${stats.size} bytes`);
    console.log(`   Permissions: ${stats.mode.toString(8)}`);
    
    return true;
  } else if (fs.existsSync(gradlewBatPath)) {
    console.log(`✅ gradlew.bat trouvé (Windows): ${gradlewBatPath}`);
    return true;
  } else {
    console.log(`❌ ERREUR: gradlew non trouvé!`);
    console.log(`   Cherché à: ${gradlewPath}`);
    
    // Lister le contenu du dossier android
    const androidDirPath = path.join(process.cwd(), 'android');
    if (fs.existsSync(androidDirPath)) {
      console.log(`   Contenu du dossier android:`);
      try {
        const files = fs.readdirSync(androidDirPath);
        files.forEach(file => {
          const filePath = path.join(androidDirPath, file);
          const stats = fs.statSync(filePath);
          const type = stats.isDirectory() ? 'DIR' : 'FILE';
          console.log(`     ${type}: ${file}`);
        });
      } catch (e) {
        console.log(`     (Impossible de lire le dossier)`);
      }
    } else {
      console.log(`   Le dossier android n'existe pas!`);
    }
    
    return false;
  }
}

// Fonction principale async
(async function main() {
  // Helper function for delays
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Vérifier si on doit générer le projet Android
  if (platform === 'android' || !platform) {
    console.log('🔨 Running expo prebuild for Android...');

    // Vérifier que npx est disponible
    try {
      execSync('npx --version', { stdio: 'pipe' });
    } catch (e) {
      console.error('❌ ERREUR: npx n\'est pas disponible!');
      process.exit(1);
    }
    
    // Vérifier si le dossier android existe et s'il est complet
    const androidDir = path.join(process.cwd(), 'android');
    if (fs.existsSync(androidDir)) {
      const gradlewPath = path.join(androidDir, 'gradlew');
      if (!fs.existsSync(gradlewPath)) {
        console.log('⚠️  Dossier android incomplet (gradlew manquant), suppression...');
        try {
          fs.rmSync(androidDir, { recursive: true, force: true });
          console.log('✅ Dossier android supprimé, sera régénéré par prebuild');
        } catch (e) {
          console.log(`⚠️  Impossible de supprimer android: ${e.message}`);
          console.log('   On continue quand même...');
        }
      } else {
        console.log('✅ Dossier android existe et contient gradlew');
      }
    }
    
    // Exécuter prebuild pour Android avec nettoyage
    const success = runCommand(
      'npx expo prebuild --platform android --clean',
      'Exécution de expo prebuild pour Android'
    );
    
    if (!success) {
      console.error('❌ ERREUR: expo prebuild a échoué!');
      process.exit(1);
    }

    // Attendre un peu pour que les fichiers soient écrits
    console.log('⏳ Attente de l\'écriture des fichiers...');
    await sleep(3000); // Augmenter le délai pour s'assurer que les fichiers sont écrits
    
    // Vérifier que le dossier android existe (androidDir est déjà déclaré plus haut)
    if (!fs.existsSync(androidDir)) {
      console.error('❌ ERREUR: Le dossier android n\'a pas été créé!');
      console.log('   Contenu du répertoire actuel:');
      try {
        const files = fs.readdirSync(process.cwd());
        files.forEach(file => console.log(`     ${file}`));
      } catch (e) {
        console.log('     (Impossible de lire le répertoire)');
      }
      process.exit(1);
    }
    
    // Vérifier que gradlew existe
    if (!verifyGradlew()) {
      console.log('');
      console.log('   Tentative de régénération...');
      
      // Supprimer le dossier android et régénérer
      try {
        if (fs.existsSync(androidDir)) {
          fs.rmSync(androidDir, { recursive: true, force: true });
          console.log('   Dossier android supprimé');
        }
      } catch (e) {
        console.log('   ⚠️  Impossible de supprimer le dossier android');
      }
      
      // Réessayer le prebuild
      const retrySuccess = runCommand(
        'npx expo prebuild --platform android --clean',
        'Régénération du projet Android'
      );
      
      if (!retrySuccess) {
        console.error('❌ ERREUR CRITIQUE: expo prebuild a échoué lors de la régénération!');
        process.exit(1);
      }
      
      // Attendre à nouveau
      await sleep(3000);
      
      // Vérifier à nouveau
      if (!verifyGradlew()) {
        console.error('❌ ERREUR CRITIQUE: gradlew toujours absent après régénération!');
        
        // Tentative de génération manuelle de gradlew avec Gradle
        console.log('   Tentative de génération manuelle de gradlew...');
        try {
          // Vérifier si gradle est disponible
          execSync('gradle --version', { stdio: 'pipe' });
          console.log('   Gradle trouvé, génération du wrapper...');
          
          // Générer le wrapper Gradle
          console.log(`   Exécution de: gradle wrapper --gradle-version 8.14.3`);
          console.log(`   Dans le répertoire: ${androidDir}`);
          execSync('gradle wrapper --gradle-version 8.14.3', { 
            stdio: 'inherit', 
            cwd: androidDir 
          });
          console.log('✅ Gradle wrapper généré avec succès');
          
          await sleep(2000);
          if (verifyGradlew()) {
            console.log('✅ gradlew généré avec succès via Gradle wrapper!');
          } else {
            console.error('❌ gradlew toujours absent après génération Gradle wrapper');
            process.exit(1);
          }
        } catch (e) {
          console.log('   Gradle n\'est pas disponible, impossible de générer le wrapper');
          console.log(`   Erreur: ${e.message}`);
          
          // Chercher tous les fichiers gradlew dans le projet
          console.log('   Recherche de fichiers gradlew dans le projet...');
          function findGradlew(dir, depth = 0) {
            if (depth > 5) return; // Limiter la profondeur
            try {
              const files = fs.readdirSync(dir);
              for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                  findGradlew(filePath, depth + 1);
                } else if (file === 'gradlew' || file === 'gradlew.bat') {
                  console.log(`     Trouvé: ${filePath}`);
                }
              }
            } catch (e) {
              // Ignorer les erreurs
            }
          }
          findGradlew(process.cwd());
          
          process.exit(1);
        }
      }
    }
    
    // Vérifier si EAS Build cherche dans build/android (problème connu)
    // TOUJOURS créer/copier dans build/android pour éviter l'erreur de chemin
    const buildAndroidDir = path.join(process.cwd(), 'build', 'android');
    const gradlewPath = path.join(androidDir, 'gradlew');
    
    if (fs.existsSync(gradlewPath)) {
      console.log('📦 Préparation de build/android pour EAS Build...');
      try {
        const buildDir = path.join(process.cwd(), 'build');
        if (!fs.existsSync(buildDir)) {
          fs.mkdirSync(buildDir, { recursive: true });
        }
        
        // Supprimer build/android s'il existe déjà pour une copie propre
        if (fs.existsSync(buildAndroidDir)) {
          console.log('   Suppression de l\'ancien build/android...');
          fs.rmSync(buildAndroidDir, { recursive: true, force: true });
        }
        
        // Fonction pour copier récursivement (compatible cross-platform)
        function copyRecursive(src, dest) {
          const stats = fs.statSync(src);
          if (stats.isDirectory()) {
            if (!fs.existsSync(dest)) {
              fs.mkdirSync(dest, { recursive: true });
            }
            const files = fs.readdirSync(src);
            for (const file of files) {
              copyRecursive(path.join(src, file), path.join(dest, file));
            }
          } else {
            fs.copyFileSync(src, dest);
          }
        }
        
        // Copier le dossier android dans build/android (solution de contournement)
        console.log('   Copie de android vers build/android...');
        copyRecursive(androidDir, buildAndroidDir);
        console.log('✅ Dossier android copié dans build/android');
        
        // Vérifier que gradlew existe dans build/android
        const buildGradlew = path.join(buildAndroidDir, 'gradlew');
        if (fs.existsSync(buildGradlew)) {
          try {
            fs.chmodSync(buildGradlew, 0o755);
            console.log('✅ gradlew dans build/android rendu exécutable');
            
            // Vérification finale
            const buildStats = fs.statSync(buildGradlew);
            console.log(`   Taille: ${buildStats.size} bytes`);
            console.log(`   Chemin: ${buildGradlew}`);
          } catch (e) {
            console.log('⚠️  Impossible de changer les permissions (normal sur Windows)');
          }
        } else {
          console.error('❌ ERREUR: gradlew non trouvé dans build/android après copie!');
          console.log('   Vérification du contenu de build/android...');
          try {
            const buildFiles = fs.readdirSync(buildAndroidDir);
            buildFiles.forEach(file => {
              const filePath = path.join(buildAndroidDir, file);
              const stats = fs.statSync(filePath);
              const type = stats.isDirectory() ? 'DIR' : 'FILE';
              console.log(`     ${type}: ${file}`);
            });
          } catch (e) {
            console.log('     (Impossible de lire le dossier)');
          }
          process.exit(1);
        }
      } catch (e) {
        console.error('❌ ERREUR: Impossible de créer build/android!');
        console.error(`   Erreur: ${e.message}`);
        console.error(`   Stack: ${e.stack}`);
        process.exit(1);
      }
    } else {
      console.error('❌ ERREUR: gradlew n\'existe pas dans android, impossible de copier vers build/android!');
      process.exit(1);
    }
    
    console.log('✅ Prebuild Android completed');
  }
  
  // Pour iOS aussi, au cas où
  if (platform === 'ios' || !platform) {
    console.log('🔨 Running expo prebuild for iOS...');
    const iosSuccess = runCommand(
      'npx expo prebuild --platform ios --clean',
      'Exécution de expo prebuild pour iOS'
    );
    if (!iosSuccess) {
      console.log('⚠️  WARNING: expo prebuild iOS a échoué, mais on continue...');
    } else {
      console.log('✅ Prebuild iOS completed');

      // Attendre un peu pour que les fichiers soient écrits
      console.log('⏳ Attente de l\'écriture des fichiers iOS...');
      await sleep(2000);

      // Appliquer les corrections de nullability pour iOS
      console.log('\n🔧 Applying iOS nullability fixes...');

      // 1. Corriger react-native-maps
      console.log('📝 Fixing react-native-maps nullability issues...');
      const rnmapsSuccess = runCommand(
        'node scripts/fix-react-native-maps-nullability.js',
        'Correction des erreurs NS_ASSUME_NONNULL dans react-native-maps'
      );
      if (!rnmapsSuccess) {
        console.log('⚠️  WARNING: react-native-maps fix a échoué, mais on continue...');
      }

      // 2. Corriger react-native-svg
      console.log('📝 Fixing react-native-svg nullability issues...');
      const rnsvgSuccess = runCommand(
        'node scripts/fix-react-native-svg-nullability.js',
        'Correction des erreurs de nullability dans react-native-svg'
      );
      if (!rnsvgSuccess) {
        console.log('⚠️  WARNING: react-native-svg fix a échoué, mais on continue...');
      }

      // 3. Corriger expo-file-system (via bash script)
      if (process.platform !== 'win32') {
        console.log('📝 Fixing expo-file-system nullability issues...');
        const fileSystemSuccess = runCommand(
          'bash scripts/fix-ios-nullability.sh',
          'Correction des erreurs de nullability dans expo-file-system'
        );
        if (!fileSystemSuccess) {
          console.log('⚠️  WARNING: expo-file-system fix a échoué, mais on continue...');
        }
      } else {
        console.log('ℹ️  Skipping bash script on Windows');
      }

      // 4. Appliquer les corrections automatiques des APIs iOS
      console.log('📝 Applying automatic iOS API fixes...');
      const apiFixSuccess = runCommand(
        'node scripts/auto-fix-and-patch-ios.js',
        'Correction automatique des APIs iOS'
      );
      if (!apiFixSuccess) {
        console.log('⚠️  WARNING: iOS API fix a échoué, mais on continue...');
      }

      console.log('✅ iOS nullability fixes completed');
    }
  }

  console.log('');
  console.log('✅ EAS Build Post-Install Hook completed');
})().catch(error => {
  console.error('❌ ERREUR FATALE:', error);
  process.exit(1);
});

