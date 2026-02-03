#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

// Configuration - NOUVELLE CLÉ
const KEY_ID = 'V829N9XD36';
const ISSUER_ID = '5a1bb2ff-02b3-4d58-b9d9-ab4639893fba'; // Supposé identique
const KEY_PATH = './fastlane/keys/AuthKey_V829N9XD36.p8';

console.log('🔍 Test des credentials App Store Connect (NOUVELLE CLÉ)\n');

// 1. Vérifier que le fichier .p8 existe
console.log('1️⃣ Vérification du fichier .p8...');
if (!fs.existsSync(KEY_PATH)) {
  console.error(`❌ Fichier introuvable: ${KEY_PATH}`);
  process.exit(1);
}
console.log(`✅ Fichier trouvé: ${KEY_PATH}`);

// 2. Lire et valider le contenu du fichier .p8
console.log('\n2️⃣ Validation du format du fichier .p8...');
let privateKey;
try {
  privateKey = fs.readFileSync(KEY_PATH, 'utf8');
  if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
    throw new Error('Format invalide');
  }
  console.log('✅ Format du fichier .p8 valide');
} catch (error) {
  console.error(`❌ Erreur de lecture du fichier .p8: ${error.message}`);
  process.exit(1);
}

// 3. Générer un JWT (JSON Web Token) pour l'API App Store Connect
console.log('\n3️⃣ Génération du JWT...');
let token;
try {
  const header = {
    alg: 'ES256',
    kid: KEY_ID,
    typ: 'JWT'
  };

  const payload = {
    iss: ISSUER_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 1200, // 20 minutes
    aud: 'appstoreconnect-v1'
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign('SHA256');
  sign.update(signatureInput);
  sign.end();

  const signature = sign.sign(privateKey, 'base64url');
  token = `${signatureInput}.${signature}`;

  console.log('✅ JWT généré avec succès');
  console.log(`   Key ID: ${KEY_ID}`);
  console.log(`   Issuer ID: ${ISSUER_ID}`);
} catch (error) {
  console.error(`❌ Erreur lors de la génération du JWT: ${error.message}`);
  console.error('   Cela peut indiquer que le fichier .p8 est corrompu ou invalide');
  process.exit(1);
}

// 4. Tester l'authentification avec l'API App Store Connect
console.log('\n4️⃣ Test d\'authentification avec l\'API App Store Connect...');
const options = {
  hostname: 'api.appstoreconnect.apple.com',
  path: '/v1/apps',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`\n📊 Réponse de l'API (status ${res.statusCode}):\n`);

    if (res.statusCode === 200) {
      console.log('✅ ✅ ✅ AUTHENTIFICATION RÉUSSIE! ✅ ✅ ✅\n');

      try {
        const response = JSON.parse(data);
        if (response.data && response.data.length > 0) {
          console.log('Applications trouvées:');
          response.data.forEach(app => {
            console.log(`  - ${app.attributes.name} (${app.attributes.bundleId})`);
          });
        } else {
          console.log('Aucune application trouvée (compte vide)');
        }
      } catch (e) {
        console.log('Réponse valide mais données non parsables');
      }

      console.log('\n🎉 🎉 🎉 CETTE CLÉ EST VALIDE! 🎉 🎉 🎉');
      console.log('\n✅ Prochaines étapes:');
      console.log('   1. Je vais mettre à jour eas.json avec cette clé');
      console.log('   2. Je vais mettre à jour fastlane/.env');
      console.log('   3. Vous pourrez ensuite relancer eas submit\n');

    } else if (res.statusCode === 401) {
      console.log('❌ ❌ ❌ AUTHENTIFICATION ÉCHOUÉE ❌ ❌ ❌\n');
      console.log('Cette clé est AUSSI invalide.');
      console.log('\n🔧 Solutions:');
      console.log('  1. Vérifiez que l\'Issuer ID est correct');
      console.log('  2. Vérifiez que la clé V829N9XD36 est Active dans App Store Connect');
      console.log('  3. Vérifiez le rôle de la clé (App Manager minimum)\n');

      try {
        const errorData = JSON.parse(data);
        if (errorData.errors) {
          console.log('Détails de l\'erreur:');
          errorData.errors.forEach(err => {
            console.log(`  - ${err.title}: ${err.detail}`);
          });
        }
      } catch (e) {
        console.log(`Réponse brute: ${data.substring(0, 500)}`);
      }

    } else {
      console.log(`⚠️ Code de réponse inattendu: ${res.statusCode}\n`);
      console.log(`Réponse: ${data.substring(0, 500)}\n`);
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ Erreur réseau: ${error.message}`);
  console.error('   Vérifiez votre connexion internet');
});

req.end();
