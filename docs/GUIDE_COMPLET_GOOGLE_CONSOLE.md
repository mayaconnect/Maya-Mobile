# Guide Complet : Mise en Place sur Google Play Console

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Étape 1 : Créer un compte développeur Google Play](#étape-1--créer-un-compte-développeur-google-play)
3. [Étape 2 : Créer une application dans Google Play Console](#étape-2--créer-une-application-dans-google-play-console)
4. [Étape 3 : Configuration initiale de l'application](#étape-3--configuration-initiale-de-lapplication)
5. [Étape 4 : Configurer le compte de service Google Cloud](#étape-4--configurer-le-compte-de-service-google-cloud)
6. [Étape 5 : Configurer les certificats de signature](#étape-5--configurer-les-certificats-de-signature)
7. [Étape 6 : Configurer les tracks de test](#étape-6--configurer-les-tracks-de-test)
8. [Étape 7 : Configurer les métadonnées de l'application](#étape-7--configurer-les-métadonnées-de-lapplication)
9. [Étape 8 : Vérifications finales](#étape-8--vérifications-finales)
10. [Dépannage](#dépannage)

---

## 🎯 Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte Google (Gmail)
- ✅ Une carte de crédit pour payer les frais d'inscription (25$ USD, paiement unique)
- ✅ Les informations de votre application :
  - Nom de l'application : **Maya**
  - Package name : **com.maya.connect**
  - Version : **1.0.0**
  - Version code : **2**
- ✅ Un keystore Android pour signer votre application
- ✅ Les assets de l'application (icône, captures d'écran, etc.)

---

## 📋 Étape 1 : Créer un compte développeur Google Play

### 1.1 Accéder à Google Play Console

1. Allez sur **https://play.google.com/console**
2. Connectez-vous avec votre compte Google
3. Si c'est votre première fois, vous verrez une page d'accueil

### 1.2 S'inscrire en tant que développeur

1. Cliquez sur **"Créer un compte"** ou **"S'inscrire"**
2. Remplissez le formulaire :
   - **Nom du développeur** : Le nom qui apparaîtra sur Google Play (ex: "Maya" ou votre nom d'entreprise)
   - **Email** : Votre adresse email
   - **Numéro de téléphone** : Pour la vérification
   - **Pays/Région** : Votre pays
3. Acceptez les conditions d'utilisation
4. Cliquez sur **"Payer les frais d'inscription"** (25$ USD, paiement unique)

### 1.3 Compléter le profil développeur

1. Remplissez votre **profil développeur** :
   - **Nom public** : Le nom affiché sur Google Play
   - **Email de contact** : Pour les communications Google
   - **Site web** (optionnel) : Votre site web
   - **Adresse** : Votre adresse complète
2. Cliquez sur **"Enregistrer"**

### 1.4 Vérifier votre compte

- Google peut demander une vérification d'identité
- Cela peut prendre quelques jours
- Vous recevrez un email de confirmation une fois approuvé

---

## 📋 Étape 2 : Créer une application dans Google Play Console

### 2.1 Créer une nouvelle application

1. Dans Google Play Console, cliquez sur **"Créer une application"** (ou "Create app")
2. Remplissez les informations :
   - **Nom de l'application** : `Maya`
   - **Langue par défaut** : `Français (France)` ou votre langue
   - **Type d'application** : `Application`
   - **Gratuit ou payant** : `Gratuit` (ou `Payant` si applicable)
3. Cochez les cases de conformité :
   - ✅ Politique de confidentialité
   - ✅ Déclaration US Export
   - ✅ Restrictions de contenu
4. Cliquez sur **"Créer"**

### 2.2 Configurer le package name

1. Dans la page de configuration de l'application, allez dans **"Configuration de l'application"** (ou "App content")
2. Dans la section **"Identité de l'application"**, vous verrez :
   - **Package name** : `com.maya.connect` (défini lors de la création, ne peut pas être modifié)
   - **Nom de l'application** : `Maya`
3. Vérifiez que le package name correspond exactement à celui de votre application Android

---

## 📋 Étape 3 : Configuration initiale de l'application

### 3.1 Accéder au tableau de bord

Une fois l'application créée, vous serez redirigé vers le tableau de bord de l'application.

### 3.2 Compléter les informations de base

Dans le menu de gauche, vous verrez plusieurs sections à compléter :

1. **Configuration de l'application** (App content)
2. **Politique et programmes** (Policy)
3. **Programmes et fonctionnalités** (Programs)
4. **Prix et distribution** (Pricing & distribution)
5. **Configuration** (Setup)

### 3.3 Configuration minimale requise

Pour pouvoir publier votre application, vous devez compléter au minimum :

- ✅ **Identité de l'application** : Nom, icône, etc.
- ✅ **Politique de confidentialité** : URL vers votre politique
- ✅ **Cibles de contenu** : Classification de contenu
- ✅ **Prix et distribution** : Pays de distribution
- ✅ **Certificat de signature** : Upload du premier AAB/APK

---

## 📋 Étape 4 : Configurer le compte de service Google Cloud

Cette étape permet à Fastlane d'uploader automatiquement vos AAB vers Google Play Console.

### 4.1 Créer un projet dans Google Cloud Console

1. Allez sur **https://console.cloud.google.com**
2. Connectez-vous avec le **même compte Google** que celui utilisé pour Google Play Console
3. Si vous n'avez pas de projet, créez-en un :
   - Cliquez sur le sélecteur de projet (en haut)
   - Cliquez sur **"Nouveau projet"** (ou "New Project")
   - Nommez-le (ex: "Maya Mobile App")
   - Cliquez sur **"Créer"**

### 4.2 Sélectionner le projet

- Sélectionnez le projet que vous venez de créer (ou un projet existant)

### 4.3 Activer l'API Google Play Android Developer

1. Dans Google Cloud Console, allez dans **"APIs & Services"** > **"Library"** (ou "Bibliothèque")
2. Recherchez **"Google Play Android Developer API"**
3. Cliquez dessus
4. Cliquez sur **"Enable"** (ou "Activer")
5. Vérifiez que vous voyez "API enabled" (API activée)

### 4.4 Créer un compte de service

1. Dans Google Cloud Console, allez dans **"IAM & Admin"** > **"Service Accounts"** (ou "Comptes de service")
2. Cliquez sur **"Create Service Account"** (ou "Créer un compte de service")
3. Remplissez les informations :
   - **Service account name** : `fastlane-upload` (ou un nom de votre choix)
   - **Service account ID** : Généré automatiquement
   - **Description** : `Service account for Fastlane to upload AAB to Google Play`
4. Cliquez sur **"Create and Continue"**

### 4.5 Attribuer un rôle au compte de service

1. Dans "Grant this service account access to project" :
   - **Role** : Sélectionnez **"Editor"** (ou "Éditeur")
   - Cliquez sur **"Continue"**
2. Cliquez sur **"Done"** (ou "Terminé")

### 4.6 Créer et télécharger la clé JSON

1. Dans la liste des comptes de service, cliquez sur celui que vous venez de créer
2. Allez dans l'onglet **"Keys"** (ou "Clés")
3. Cliquez sur **"Add Key"** > **"Create new key"**
4. Sélectionnez **"JSON"**
5. Cliquez sur **"Create"** (ou "Créer")
6. Le fichier JSON sera téléchargé automatiquement

**⚠️ IMPORTANT** : 
- Gardez ce fichier en sécurité, vous ne pourrez le télécharger qu'une seule fois
- Notez l'email du compte de service (format : `fastlane-upload@votre-projet.iam.gserviceaccount.com`)

### 4.7 Lier le compte de service à Google Play Console

1. Allez sur **https://play.google.com/console**
2. Sélectionnez votre **application** (Maya)
3. Allez dans **"Setup"** (ou "Configuration") > **"API access"** (ou "Accès API")
4. Dans la section **"Service accounts"**, cliquez sur **"Invite new service account"** (ou "Inviter un nouveau compte de service")
5. Collez l'**email du compte de service** (celui noté à l'étape 4.6)
   - Format : `fastlane-upload@votre-projet.iam.gserviceaccount.com`
6. Cliquez sur **"Invite user"** (ou "Inviter l'utilisateur")

### 4.8 Attribuer les permissions au compte de service

1. Dans la liste des comptes de service, trouvez celui que vous venez d'ajouter
2. Cliquez sur **"Grant access"** (ou "Accorder l'accès")
3. Sélectionnez les permissions nécessaires :
   - ✅ **"View app information and download bulk reports"** (Voir les informations de l'app)
   - ✅ **"Manage production releases"** (Gérer les versions de production)
   - ✅ **"Manage testing track releases"** (Gérer les versions de test)
   - ✅ **"Manage testing track releases and edit store listing"** (si vous voulez modifier la fiche)
4. Cliquez sur **"Invite user"** (ou "Inviter l'utilisateur")

### 4.9 Accepter l'invitation

1. Le compte de service recevra une invitation
2. Dans Google Cloud Console, allez dans **"IAM & Admin"** > **"Service Accounts"**
3. Cliquez sur votre compte de service
4. Allez dans l'onglet **"Permissions"**
5. Vous devriez voir l'invitation Google Play - **acceptez-la**

### 4.10 Ajouter le JSON comme secret GitHub

1. Ouvrez le fichier JSON téléchargé et copiez **tout son contenu**
2. Allez sur votre dépôt GitHub
3. **Settings** > **Secrets and variables** > **Actions**
4. Cliquez sur **"New repository secret"**
5. **Name** : `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
6. **Secret** : Collez le contenu complet du fichier JSON
7. Cliquez sur **"Add secret"**

---

## 📋 Étape 5 : Configurer les certificats de signature

### 5.1 Comprendre les certificats de signature

Google Play nécessite que votre application soit signée avec un certificat de signature. Ce certificat doit être le même pour toutes les versions de votre application.

### 5.2 Créer un keystore (si vous n'en avez pas)

Si vous n'avez pas encore de keystore, créez-en un :

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore maya-release.keystore -alias maya-upload-key -keyalg RSA -keysize 2048 -validity 10000
```

Remplissez les informations demandées :
- **Mot de passe du keystore** : Choisissez un mot de passe fort
- **Nom et prénom** : Votre nom
- **Organisation** : Votre organisation
- **Ville** : Votre ville
- **Pays** : Code pays (ex: FR)

### 5.3 Obtenir le SHA-1 du certificat

Pour vérifier que vous utilisez le bon keystore, obtenez le SHA-1 :

```bash
keytool -list -v -keystore maya-release.keystore -alias maya-upload-key
```

Notez le **SHA1** affiché (format : `XX:XX:XX:...`)

### 5.4 Uploader le premier AAB/APK

La première fois que vous uploadez un AAB ou APK, Google Play enregistre automatiquement le certificat de signature.

**Méthode 1 : Via Fastlane (recommandé)**

```bash
cd android
bundle exec fastlane upload_internal
```

**Méthode 2 : Via Google Play Console**

1. Allez dans **"Production"** > **"Créer une nouvelle version"** (ou "Create new release")
2. Cliquez sur **"Télécharger"** (ou "Upload")
3. Sélectionnez votre fichier AAB
4. Cliquez sur **"Enregistrer"**

### 5.5 Vérifier le certificat enregistré

1. Dans Google Play Console, allez dans **"Setup"** > **"App signing"** (ou "Signature de l'application")
2. Vous verrez le certificat de signature enregistré
3. Vérifiez que le SHA-1 correspond à celui de votre keystore

### 5.6 Configurer les secrets GitHub pour le keystore

1. Encodez votre keystore en Base64 :

**Sur macOS :**
```bash
base64 -i maya-release.keystore | pbcopy
```

**Sur Windows (PowerShell) :**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("maya-release.keystore")) | clip
```

**Sur Linux :**
```bash
base64 maya-release.keystore | xclip -selection clipboard
```

2. Ajoutez les secrets GitHub suivants :

   - **`MAYA_UPLOAD_KEYSTORE_BASE64`** : Le keystore encodé en Base64
   - **`MAYA_UPLOAD_STORE_PASSWORD`** : Le mot de passe du keystore
   - **`MAYA_UPLOAD_KEY_ALIAS`** : L'alias de la clé (ex: `maya-upload-key`)
   - **`MAYA_UPLOAD_KEY_PASSWORD`** : Le mot de passe de la clé (généralement le même que le keystore)
   - **`MAYA_UPLOAD_EXPECTED_SHA1`** : Le SHA-1 du certificat (sans les deux-points, ex: `A1B2C3D4...`)

---

## 📋 Étape 6 : Configurer les tracks de test

Google Play propose plusieurs tracks pour tester votre application avant la publication en production.

### 6.1 Comprendre les tracks

- **Internal testing** (Test interne) : Tests rapides avec jusqu'à 100 testeurs
- **Closed testing** (Test fermé) : Tests avec des groupes de testeurs spécifiques
- **Open testing** (Test ouvert) : Tests publics avec tous les utilisateurs
- **Production** (Production) : Version publique de l'application

### 6.2 Configurer Internal Testing

1. Dans Google Play Console, allez dans **"Testing"** > **"Internal testing"**
2. Cliquez sur **"Create new release"** (ou "Créer une nouvelle version")
3. Upload votre AAB
4. Ajoutez des notes de version (optionnel)
5. Cliquez sur **"Save"** (ou "Enregistrer")
6. Cliquez sur **"Review release"** (ou "Examiner la version")
7. Cliquez sur **"Start rollout to Internal testing"** (ou "Lancer le déploiement")

### 6.3 Ajouter des testeurs

1. Dans **"Internal testing"**, allez dans l'onglet **"Testers"**
2. Cliquez sur **"Create email list"** (ou "Créer une liste d'emails")
3. Ajoutez les emails des testeurs (jusqu'à 100)
4. Cliquez sur **"Save changes"** (ou "Enregistrer")

### 6.4 Obtenir le lien de test

1. Dans **"Internal testing"**, allez dans l'onglet **"Testers"**
2. Copiez le **lien de test** (format : `https://play.google.com/apps/internaltest/...`)
3. Partagez ce lien avec vos testeurs

---

## 📋 Étape 7 : Configurer les métadonnées de l'application

### 7.1 Informations de base

1. Allez dans **"Store presence"** > **"Main store listing"** (ou "Fiche principale")
2. Remplissez les informations :
   - **Nom de l'application** : `Maya`
   - **Description courte** : Description en 80 caractères maximum
   - **Description complète** : Description détaillée
   - **Icône de l'application** : Upload de l'icône (512x512 px)
   - **Capture d'écran** : Upload de captures d'écran (minimum 2, maximum 8)

### 7.2 Graphismes

1. **Icône de l'application** :
   - Format : PNG
   - Taille : 512x512 px
   - Pas de transparence
   - Pas de coins arrondis (Google les ajoute automatiquement)

2. **Captures d'écran** :
   - Format : PNG ou JPG
   - Taille minimale : 320 px de hauteur
   - Taille maximale : 3840 px de largeur
   - Ratio : 16:9 ou 9:16 recommandé
   - Minimum : 2 captures
   - Maximum : 8 captures

3. **Bannière promotionnelle** (optionnel) :
   - Format : PNG ou JPG
   - Taille : 1024x500 px

### 7.3 Classification de contenu

1. Allez dans **"App content"** > **"Content rating"** (ou "Classification de contenu")
2. Remplissez le questionnaire sur le contenu de votre application
3. Soumettez pour examen
4. Attendez l'approbation (généralement quelques heures)

### 7.4 Politique de confidentialité

1. Allez dans **"App content"** > **"Privacy policy"** (ou "Politique de confidentialité")
2. Ajoutez l'URL de votre politique de confidentialité
3. La politique doit être accessible publiquement

### 7.5 Cibles de contenu

1. Allez dans **"App content"** > **"Target audience"** (ou "Cibles de contenu")
2. Indiquez si votre application cible les enfants
3. Remplissez les informations sur le contenu

---

## 📋 Étape 8 : Vérifications finales

### 8.1 Checklist avant publication

Avant de publier votre application en production, vérifiez :

- ✅ **Identité de l'application** : Nom, icône, package name corrects
- ✅ **Métadonnées** : Description, captures d'écran complètes
- ✅ **Classification de contenu** : Approuvée
- ✅ **Politique de confidentialité** : URL valide
- ✅ **Certificat de signature** : Enregistré et vérifié
- ✅ **Compte de service** : Configuré et avec les bonnes permissions
- ✅ **Secrets GitHub** : Tous configurés
- ✅ **AAB** : Construit et signé correctement
- ✅ **Tests** : Application testée sur différents appareils

### 8.2 Vérifier dans Google Play Console

1. Allez dans **"Setup"** > **"API access"**
   - Vérifiez que votre compte de service apparaît dans la liste
   - Vérifiez que les permissions sont correctement attribuées

2. Allez dans **"Setup"** > **"App signing"**
   - Vérifiez que le certificat de signature est enregistré
   - Vérifiez que le SHA-1 correspond à votre keystore

3. Allez dans **"Store presence"** > **"Main store listing"**
   - Vérifiez que toutes les informations sont complètes
   - Vérifiez que les graphismes sont uploadés

### 8.3 Vérifier dans Google Cloud Console

1. Allez dans **"IAM & Admin"** > **"Service Accounts"**
   - Vérifiez que votre compte de service existe
   - Vérifiez que l'API "Google Play Android Developer API" est activée

### 8.4 Test d'upload

Testez l'upload automatique avec Fastlane :

```bash
cd android
bundle exec fastlane upload_internal
```

Si l'upload réussit, votre configuration est correcte !

---

## 🔧 Dépannage

### Problème : "API not enabled"

**Solution** : 
1. Vérifiez que l'API "Google Play Android Developer API" est bien activée dans Google Cloud Console
2. Allez dans **"APIs & Services"** > **"Enabled APIs"**
3. Recherchez "Google Play Android Developer API"
4. Si elle n'est pas listée, activez-la (voir Étape 4.3)

### Problème : "Service account not found" dans Google Play Console

**Solution** : 
1. Vérifiez que vous avez bien invité le compte de service dans Google Play Console
2. Vérifiez que l'email du compte de service est correct
3. Attendez quelques minutes si vous venez de créer le compte
4. Vérifiez que le compte de service a accepté l'invitation

### Problème : "Permission denied" lors de l'upload

**Solution** :
1. Vérifiez que les permissions sont correctement attribuées dans Google Play Console
2. Vérifiez que le compte de service a accepté l'invitation
3. Vérifiez que le JSON est correct dans le secret GitHub
4. Vérifiez que le package name dans `Appfile` correspond à celui de Google Play Console

### Problème : "Invalid certificate" ou "Signature mismatch"

**Solution** :
1. Vérifiez que vous utilisez le même keystore que celui enregistré dans Google Play Console
2. Vérifiez que le SHA-1 du keystore correspond à celui enregistré
3. Si vous avez perdu le keystore original, vous devrez créer une nouvelle application dans Google Play Console
4. Vérifiez que les secrets GitHub contiennent les bonnes informations

### Problème : "Package name mismatch"

**Solution** :
1. Vérifiez que le package name dans `app.json` correspond à celui dans Google Play Console
2. Vérifiez que le package name dans `android/app/build.gradle` correspond
3. Vérifiez que le package name dans `android/fastlane/Appfile` correspond

### Problème : "AAB upload failed"

**Solution** :
1. Vérifiez que l'AAB est signé avec le certificat de release (pas debug)
2. Vérifiez que le versionCode est supérieur à la version précédente
3. Vérifiez que toutes les métadonnées requises sont complètes
4. Vérifiez les logs dans Google Play Console pour plus de détails

---

## 🔗 Liens utiles

- **Google Play Console** : https://play.google.com/console
- **Google Cloud Console** : https://console.cloud.google.com
- **API Library** : https://console.cloud.google.com/apis/library
- **Service Accounts** : https://console.cloud.google.com/iam-admin/serviceaccounts
- **Documentation Google Play** : https://support.google.com/googleplay/android-developer
- **Documentation Fastlane** : https://docs.fastlane.tools/getting-started/android/setup/

---

## ✅ Résumé des étapes

1. ✅ Créer un compte développeur Google Play (25$ USD)
2. ✅ Créer une application dans Google Play Console
3. ✅ Configurer le compte de service Google Cloud
4. ✅ Activer l'API Google Play Android Developer
5. ✅ Créer et configurer le compte de service
6. ✅ Lier le compte de service à Google Play Console
7. ✅ Configurer les certificats de signature
8. ✅ Uploader le premier AAB pour enregistrer le certificat
9. ✅ Configurer les secrets GitHub
10. ✅ Configurer les tracks de test
11. ✅ Configurer les métadonnées de l'application
12. ✅ Vérifier toutes les configurations
13. ✅ Tester l'upload automatique avec Fastlane

---

## 🎉 C'est terminé !

Une fois toutes ces étapes complétées, votre application est prête à être déployée automatiquement sur Google Play Console via Fastlane et GitHub Actions.

Pour déployer, il suffit de :
- Pousser du code sur la branche `master` ou `main`
- Ou déclencher manuellement le workflow depuis GitHub Actions

L'application sera automatiquement :
- Construite
- Signée avec le certificat de release
- Uploadée sur Google Play Internal Testing

---

**Note** : Ce guide couvre la configuration complète. Pour des questions spécifiques, consultez la documentation officielle de Google Play Console.
