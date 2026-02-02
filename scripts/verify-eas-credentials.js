#!/usr/bin/env node

/**
 * Script pour vérifier et forcer l'utilisation de la clé API App Store Connect
 * dans EAS Submit, afin d'éviter que fastlane bascule sur altool.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Identifiants corrects de la clé API
const CORRECT_KEY_ID = '77TBY8NS79';
const CORRECT_ISSUER_ID = '5a1bb2ff-02b3-4d58-b9d9-ab4639893fba';
const ASC_APP_ID = '6758561059';

console.log('🔍 Vérification des credentials EAS...\n');

// Vérifier que eas-cli est installé
try {
  execSync('eas --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ eas-cli n\'est pas installé. Installez-le avec: npm install -g eas-cli');
  process.exit(1);
}

// Vérifier que l'utilisateur est connecté à EAS
try {
  execSync('eas whoami', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Vous n\'êtes pas connecté à EAS. Connectez-vous avec: eas login');
  process.exit(1);
}

console.log('✅ Connecté à EAS\n');

// Instructions pour vérifier manuellement dans EAS
console.log('📋 Instructions pour vérifier la clé API dans EAS:\n');
console.log('1. Allez sur https://expo.dev');
console.log('2. Sélectionnez votre projet "maya-mobile-app"');
console.log('3. Allez dans Credentials → iOS → Service Credentials');
console.log('4. Vérifiez App Store Connect API Key:\n');
console.log(`   ✅ Key ID doit être: ${CORRECT_KEY_ID}`);
console.log(`   ✅ Issuer ID doit être: ${CORRECT_ISSUER_ID}\n`);

// Vérifier si le fichier .p8 existe localement
const p8Path = path.join(process.cwd(), 'AuthKey_77TBY8NS79.p8');
if (fs.existsSync(p8Path)) {
  console.log(`✅ Fichier .p8 trouvé: ${p8Path}`);
} else {
  const downloadsPath = path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', 'AuthKey_77TBY8NS79.p8');
  if (fs.existsSync(downloadsPath)) {
    console.log(`⚠️  Fichier .p8 trouvé dans Downloads: ${downloadsPath}`);
    console.log(`   Vous pouvez le copier dans le projet si nécessaire.`);
  } else {
    console.log(`⚠️  Fichier .p8 non trouvé localement.`);
    console.log(`   Assurez-vous qu'il est uploadé dans EAS.`);
  }
}

console.log('\n📝 Configuration dans eas.json:\n');
console.log(`   ✅ ascAppId: ${ASC_APP_ID}`);

// Vérifier eas.json
const easJsonPath = path.join(process.cwd(), 'eas.json');
if (fs.existsSync(easJsonPath)) {
  const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
  const ascAppId = easJson?.submit?.production?.ios?.ascAppId;
  
  if (ascAppId === ASC_APP_ID) {
    console.log(`   ✅ ascAppId correct dans eas.json`);
  } else {
    console.log(`   ❌ ascAppId incorrect dans eas.json: ${ascAppId}`);
    console.log(`   ⚠️  Il devrait être: ${ASC_APP_ID}`);
  }
}

console.log('\n🚀 Pour forcer l\'utilisation de la clé API:\n');
console.log('1. Vérifiez que la clé API est correctement configurée dans EAS (voir instructions ci-dessus)');
console.log('2. Si le Key ID ne correspond pas, supprimez l\'ancienne et ajoutez la nouvelle:');
console.log(`   - Key ID: ${CORRECT_KEY_ID}`);
console.log(`   - Issuer ID: ${CORRECT_ISSUER_ID}`);
console.log(`   - Fichier .p8: AuthKey_77TBY8NS79.p8`);
console.log('\n3. Lancez la soumission:');
console.log('   eas submit --platform ios --profile production --latest\n');

console.log('💡 EAS Submit devrait automatiquement utiliser la clé API si elle est correctement configurée.');
console.log('   Si fastlane bascule sur altool, c\'est que la clé API n\'est pas correctement configurée dans EAS.\n');

