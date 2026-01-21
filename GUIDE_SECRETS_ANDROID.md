# 🔐 Guide : Créer et ajouter les secrets Android à GitHub

Ce guide vous explique comment créer toutes les clés nécessaires pour le déploiement Android et les ajouter aux secrets GitHub.

---

## ⚡ Démarrage rapide : Peut-on faire ça par étapes ?

**OUI !** Vous pouvez procéder progressivement :

### ✅ Ce que vous pouvez faire MAINTENANT (même si Google Play n'est pas configuré) :

1. **Créer le keystore** → C'est indépendant de Google Play
2. **Ajouter les 4 premiers secrets** :
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_PASSWORD`

### ⏳ Ce qui peut attendre :

- **`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`** → À ajouter quand votre compte Google Play est configuré

### 🔄 Comportement :

- **Sans le secret Google Play** : 
  - ✅ Le workflow peut builder l'AAB/APK
  - ❌ Le déploiement vers Google Play échouera
  - 💡 Vous pourrez télécharger l'artefact buildé pour tester

- **Avec tous les secrets** :
  - ✅ Le workflow déploie automatiquement sur Google Play

**Conseil** : Ajoutez les 4 premiers secrets maintenant, puis ajoutez `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` une fois votre compte prêt !

---

## 📋 Prérequis

- Java JDK installé (pour créer le keystore)
- Un compte Google Play Console avec accès développeur
- Un dépôt GitHub avec accès administrateur

---

## 🔑 Étape 1 : Créer le Keystore Android

### 1.1 Générer le fichier keystore

Ouvrez un terminal et exécutez la commande suivante :

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore maya-release.keystore -alias maya-key -keyalg RSA -keysize 2048 -validity 10000
```

**Informations à renseigner :**
- **Mot de passe du keystore** : Choisissez un mot de passe sécurisé (ex: `MonMotDePasseKeystore123!`)
- **Mot de passe de la clé** : Même mot de passe ou différent (ex: `MonMotDePasseCle123!`)
- **Nom et prénom** : Votre nom ou celui de votre organisation
- **Unité organisationnelle** : Département/Section (ex: `Mobile Dev`)
- **Organisation** : Nom de votre entreprise (ex: `Maya`)
- **Ville** : Votre ville
- **État/Province** : Votre région
- **Code pays** : Code ISO à 2 lettres (ex: `FR` pour France)

⚠️ **IMPORTANT** : Notez précieusement ces informations, vous en aurez besoin pour les secrets GitHub :
- **Alias de la clé** : `maya-key` (ou celui que vous avez choisi)
- **Mot de passe du keystore** : (celui que vous venez de créer)
- **Mot de passe de la clé** : (celui que vous venez de créer)

### 1.2 Vérifier le keystore

```bash
keytool -list -v -keystore maya-release.keystore
```

Entrez le mot de passe du keystore pour voir les détails.

### 1.3 Encoder le keystore en Base64

#### Sur Windows (PowerShell) :

```powershell
$keystoreContent = [Convert]::ToBase64String([IO.File]::ReadAllBytes("maya-release.keystore"))
$keystoreContent | Out-File -FilePath "maya-release-base64.txt" -Encoding utf8
Get-Content "maya-release-base64.txt"
```

Copiez tout le contenu affiché (une longue chaîne de caractères).

#### Sur macOS/Linux :

```bash
base64 -i maya-release.keystore | pbcopy  # Sur macOS (copie automatique)
# OU
base64 maya-release.keystore > maya-release-base64.txt  # Sauvegarde dans un fichier
cat maya-release-base64.txt
```

---

## 🔑 Étape 2 : Créer le compte de service Google Play

### 2.1 Accéder à Google Play Console

1. Allez sur [Google Play Console](https://play.google.com/console/)
2. Sélectionnez votre application
3. Allez dans **Réglages** → **Accès API** (ou **Settings** → **API access**)

### 2.2 Créer un compte de service

1. Cliquez sur **Créer un compte de service** (ou **Create service account**)
2. Cliquez sur le lien qui ouvre Google Cloud Console
3. Dans Google Cloud Console :
   - Créez un nouveau projet ou sélectionnez un projet existant
   - Allez dans **IAM & Admin** → **Service Accounts**
   - Cliquez sur **Créer un compte de service** (ou **Create Service Account**)
   - Remplissez les informations :
     - **Nom** : `fastlane-play-store` (ou autre nom)
     - **Description** : `Compte de service pour le déploiement automatique sur Google Play`
   - Cliquez sur **Créer et continuer** (ou **Create and Continue**)
   - **Rôle** : Sélectionnez `Editor` ou `Service Account User`
   - Cliquez sur **Continuer** puis **Terminé**

### 2.3 Créer et télécharger la clé JSON

1. Dans la liste des comptes de service, cliquez sur celui que vous venez de créer
2. Allez dans l'onglet **Clés** (ou **Keys**)
3. Cliquez sur **Ajouter une clé** → **Créer une clé** (ou **Add Key** → **Create new key**)
4. Sélectionnez **JSON**
5. Cliquez sur **Créer** (ou **Create**)
6. Un fichier JSON sera téléchargé (ex: `your-project-xxxxx.json`)

### 2.4 Activer l'accès dans Google Play Console

1. Retournez dans Google Play Console
2. Dans **Réglages** → **Accès API**, trouvez votre compte de service
3. Cliquez sur **Accorder l'accès** (ou **Grant access**)
4. Cochez les permissions nécessaires :
   - ✅ **Voir les informations sur les applications** (View app information)
   - ✅ **Gérer les versions de production** (Manage production releases)
   - ✅ **Gérer les versions en bêta** (Manage beta releases)
   - ✅ **Gérer les versions en version alpha** (Manage alpha releases)
5. Cliquez sur **Inviter l'utilisateur** (ou **Invite user**)

### 2.5 Récupérer le contenu JSON

Ouvrez le fichier JSON téléchargé et copiez **tout son contenu** (gardez-le pour l'étape suivante).

Exemple de structure :
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "fastlane-play-store@your-project.iam.gserviceaccount.com",
  ...
}
```

---

## 🔐 Étape 3 : Ajouter les secrets dans GitHub

💡 **Note** : Vous pouvez ajouter les 4 premiers secrets maintenant (keystore) et ajouter `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` plus tard quand votre compte sera configuré.

### 3.1 Accéder aux secrets GitHub

1. Allez sur votre dépôt GitHub
2. Cliquez sur **Settings** (Réglages)
3. Dans le menu de gauche, allez dans **Secrets and variables** → **Actions**
4. Cliquez sur **New repository secret** (Nouveau secret de dépôt)

### 3.2 Ajouter les secrets (vous pouvez commencer par les 4 premiers)

#### Secret 1 : `ANDROID_KEYSTORE_BASE64`
- **Name** : `ANDROID_KEYSTORE_BASE64`
- **Secret** : Collez la chaîne Base64 complète du keystore (celle créée à l'étape 1.3)
- Cliquez sur **Add secret**

#### Secret 2 : `ANDROID_KEY_ALIAS`
- **Name** : `ANDROID_KEY_ALIAS`
- **Secret** : `maya-key` (ou l'alias que vous avez utilisé lors de la création du keystore)
- Cliquez sur **Add secret**

#### Secret 3 : `ANDROID_KEYSTORE_PASSWORD`
- **Name** : `ANDROID_KEYSTORE_PASSWORD`
- **Secret** : Le mot de passe du keystore (créé à l'étape 1.1)
- Cliquez sur **Add secret**

#### Secret 4 : `ANDROID_KEY_PASSWORD`
- **Name** : `ANDROID_KEY_PASSWORD`
- **Secret** : Le mot de passe de la clé (créé à l'étape 1.1)
- Cliquez sur **Add secret**

#### Secret 5 : `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (peut être ajouté plus tard)
- **Name** : `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
- **Secret** : Collez le contenu **complet** du fichier JSON (celui téléchargé à l'étape 2.5)
- ⚠️ **Important** : Copiez le JSON en une seule ligne ou tel quel (avec retours à la ligne)
- ⏳ **Optionnel pour l'instant** : Si vous n'avez pas encore configuré Google Play Console, ajoutez ce secret plus tard
- Cliquez sur **Add secret**

---

## 🎯 Configuration progressive recommandée

### Phase 1 : Maintenant (sans Google Play configuré)
1. ✅ Créer le keystore (Étape 1)
2. ✅ Ajouter les secrets 1-4 dans GitHub (Étape 3.2)
3. ✅ Tester le build : Le workflow peut créer l'AAB/APK même sans le secret Google Play

### Phase 2 : Plus tard (quand Google Play sera prêt)
1. ⏳ Créer le compte de service Google Play (Étape 2)
2. ⏳ Ajouter le secret 5 (`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`)
3. ✅ Le déploiement automatique fonctionnera !

---

## ✅ Vérification

Après avoir ajouté tous les secrets, vous devriez voir 5 secrets dans la liste :

1. ✅ `ANDROID_KEYSTORE_BASE64`
2. ✅ `ANDROID_KEY_ALIAS`
3. ✅ `ANDROID_KEYSTORE_PASSWORD`
4. ✅ `ANDROID_KEY_PASSWORD`
5. ✅ `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

---

## 🔒 Sécurité

⚠️ **Important pour la sécurité :**

1. **Ne commitez JAMAIS** le fichier `maya-release.keystore` dans Git
2. **Ne commitez JAMAIS** le fichier JSON du compte de service
3. **Stockez en sécurité** les mots de passe (utilisez un gestionnaire de mots de passe)
4. **Vérifiez** que `.keystore` et `*.json` sont dans `.gitignore`

### Vérifier le .gitignore

Assurez-vous que votre `.gitignore` contient :

```gitignore
# Keystore files
*.keystore
*.jks

# Google Play service account
**/google-play-service-account.json
**/*-service-account.json
*.json
!package.json
!tsconfig.json
# (ajoutez d'autres exceptions si nécessaire)
```

---

## 🧪 Tester le déploiement

Une fois tous les secrets configurés, vous pouvez tester le déploiement :

1. **Manuellement** : Allez dans **Actions** → **Deploy to TestFlight & Google Play** → **Run workflow**
2. **Automatiquement** : Faites un push sur la branche `master` ou `main`

---

## ❓ Dépannage

### Le workflow échoue avec "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON" manquant
- **C'est normal !** Si vous n'avez pas encore ajouté ce secret, le déploiement vers Google Play échouera
- ✅ **Mais** : Le build de l'AAB/APK fonctionnera quand même (vous pourrez le télécharger dans les artifacts)
- 💡 **Solution** : Une fois votre compte Google Play configuré, ajoutez le secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (voir Étape 2)

### Le workflow échoue avec "Invalid keystore format"
- Vérifiez que `ANDROID_KEYSTORE_BASE64` contient bien la chaîne Base64 complète
- Réessayez l'encodage en Base64

### Le workflow échoue avec "Authentication failed"
- Vérifiez que le JSON du compte de service est correct
- Vérifiez que le compte de service a bien les permissions dans Google Play Console

### Le workflow échoue avec "Wrong password"
- Vérifiez que `ANDROID_KEYSTORE_PASSWORD` et `ANDROID_KEY_PASSWORD` sont corrects
- Vérifiez que `ANDROID_KEY_ALIAS` correspond exactement à celui utilisé lors de la création

---

## 📚 Ressources supplémentaires

- [Documentation Android Keystore](https://developer.android.com/studio/publish/app-signing)
- [Documentation Google Play API](https://developers.google.com/android-publisher)
- [Documentation GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Besoin d'aide ?** Consultez les autres guides :
- `WORKFLOWS_EXPLANATION.md` - Explication des workflows
- `FASTLANE_SETUP_GUIDE.md` - Guide complet Fastlane

