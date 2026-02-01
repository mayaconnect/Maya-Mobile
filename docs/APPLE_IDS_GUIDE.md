# Guide complet des IDs Apple pour Maya

Ce document liste **tous les identifiants Apple** nécessaires pour configurer et déployer l'application Maya sur iOS.

---

## 📋 Liste des IDs requis

### 1. **Bundle Identifier (App ID)**

**Valeur actuelle :**
- Dans `app.json` : `com.maya.connect`
- Dans `ios/fastlane/Appfile` et `Matchfile` : `com.maya.app`

⚠️ **Action requise :** Uniformiser le Bundle ID dans tous les fichiers.

**Où le trouver/créer :**
1. Connecte-toi à [Apple Developer Portal](https://developer.apple.com/account)
2. Va dans **Certificates, Identifiers & Profiles**
3. Clique sur **Identifiers** → **+** (nouveau)
4. Sélectionne **App IDs** → **Continue**
5. Choisis **App** → **Continue**
6. Renseigne :
   - **Description** : `Maya App`
   - **Bundle ID** : `com.maya.connect` (ou `com.maya.app` selon ton choix)
7. Active les **Capabilities** nécessaires (Push Notifications, etc.)
8. **Register** → **Done**

**Où l'utiliser :**
- `app.json` → `ios.bundleIdentifier`
- `ios/fastlane/Appfile` → `app_identifier()`
- `ios/fastlane/Matchfile` → `app_identifier()`
- Xcode → Target → General → Bundle Identifier

---

### 2. **Apple ID (Email du compte développeur)**

**Nom de la variable :** `FASTLANE_APPLE_ID`

**Où le trouver :**
- C'est l'**email** que tu utilises pour te connecter à :
  - [developer.apple.com](https://developer.apple.com)
  - [appstoreconnect.apple.com](https://appstoreconnect.apple.com)

**Exemple :** `votre-email@example.com`

**Où l'utiliser :**
- `ios/fastlane/Appfile` → `apple_id()`
- `ios/fastlane/Matchfile` → `username()`
- Variable d'environnement : `FASTLANE_APPLE_ID`

---

### 3. **Apple Team ID**

**Nom de la variable :** `APPLE_TEAM_ID`

**Où le trouver :**
1. Connecte-toi à [developer.apple.com/account](https://developer.apple.com/account)
2. Va dans la section **Membership**
3. Le **Team ID** est affiché (format : `ABCDEFG123` ou `1234567890`)

**Alternative :**
- Dans Xcode : `Preferences` → `Accounts` → sélectionne ton compte → détails de l'équipe → **Team ID**

**Où l'utiliser :**
- `ios/fastlane/Appfile` → `team_id()`
- Variable d'environnement : `APPLE_TEAM_ID`
- Secret GitHub : `APPLE_TEAM_ID`

---

### 4. **App Store Connect Key ID**

**Nom de la variable :** `APP_STORE_CONNECT_KEY_ID`

**Où le trouver :**
1. Connecte-toi à [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Va dans **Users and Access** → onglet **Keys** → **App Store Connect API**
3. Si tu n'as pas de clé :
   - Clique sur **"+"** ou **Generate API Key**
   - Donne un nom (ex: `Maya CI/CD`)
   - Sélectionne le rôle : **App Manager** (minimum) ou **Admin**
   - Clique sur **Generate**
   - **Télécharge le fichier** `AuthKey_XXXXXXXXXX.p8` (⚠️ **télécharge-le immédiatement, tu ne pourras plus le récupérer**)
4. Dans la liste des clés, la colonne **Key ID** = valeur de `APP_STORE_CONNECT_KEY_ID`

**Format :** `ABC123DEF4` (10 caractères alphanumériques)

**Où l'utiliser :**
- Variable d'environnement : `APP_STORE_CONNECT_KEY_ID`
- Secret GitHub : `APP_STORE_CONNECT_KEY_ID`
- `ios/fastlane/Fastfile` → `key_id:`

---

### 5. **App Store Connect Issuer ID**

**Nom de la variable :** `APP_STORE_CONNECT_ISSUER_ID`

**Où le trouver :**
1. Même écran que pour le Key ID :
   - [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Users and Access** → **Keys** → **App Store Connect API**
2. L'**Issuer ID** est affiché **en haut de la page** (format UUID : `1A2B3C4D-5E6F-7G8H-9I0J-K1L2M3N4O5P6`)

**Alternative :**
- Va directement sur [appstoreconnect.apple.com/access/api](https://appstoreconnect.apple.com/access/api) (connecté avec ton compte développeur)
- L'Issuer ID y est affiché

**Où l'utiliser :**
- Variable d'environnement : `APP_STORE_CONNECT_ISSUER_ID`
- Secret GitHub : `APP_STORE_CONNECT_ISSUER_ID`
- `ios/fastlane/Fastfile` → `issuer_id:`

---

### 6. **App Store Connect API Key (.p8 file)**

**Nom de la variable :** `APP_STORE_CONNECT_KEY_BASE64`

**Où le trouver :**
- C'est le fichier `AuthKey_XXXXXXXXXX.p8` téléchargé lors de la création de la clé API (étape 4)

**Comment le convertir en base64 (pour GitHub Actions) :**

**⚠️ IMPORTANT : Le secret base64 ne doit contenir AUCUN espace ni retour à la ligne !**

**Sous Windows (PowerShell) :**
```powershell
$path = "AuthKey_XXXXXXXXXX.p8"  # Remplace par le nom réel du fichier
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes($path)) | Set-Clipboard
```
Le contenu base64 est maintenant dans le presse-papier (sans espaces ni retours à la ligne).

**Sous macOS/Linux :**
```bash
base64 -i AuthKey_XXXXXXXXXX.p8 | pbcopy  # macOS
# ou
base64 AuthKey_XXXXXXXXXX.p8 | xclip -selection clipboard  # Linux
```

**Où l'utiliser :**
- Secret GitHub : `APP_STORE_CONNECT_KEY_BASE64`
- Le fichier `.p8` doit être placé dans `ios/fastlane/keys/AuthKey_XXXXXXXXXX.p8` (localement)

**⚠️ Dépannage - Erreur "invalid curve name" :**

Cette erreur se produit quand le fichier `.p8` est corrompu ou mal formaté. Solutions :

1. **Le secret base64 contient des espaces ou retours à la ligne** :
   - Le secret `APP_STORE_CONNECT_KEY_BASE64` doit être **une seule ligne** sans espaces
   - Vérifie dans GitHub → Settings → Secrets → `APP_STORE_CONNECT_KEY_BASE64`
   - Si tu vois des espaces ou retours à la ligne, supprime-les et recrée le secret

2. **Recréer le secret base64 correctement** :
   - Télécharge à nouveau le fichier `.p8` depuis App Store Connect
   - Reconvertis-le en base64 avec la commande PowerShell ci-dessus
   - **Important** : copie-colle directement dans le secret GitHub (pas de modification manuelle)

3. **Vérifier le format du fichier .p8** :
   - Le fichier doit commencer par `-----BEGIN PRIVATE KEY-----`
   - Le fichier doit se terminer par `-----END PRIVATE KEY-----`
   - Pas d'espaces ou caractères supplémentaires

**⚠️ Dépannage - Erreur "Authentication credentials are missing or invalid" :**

Si tu obtiens une erreur d'authentification App Store Connect, vérifie :

1. **La clé API n'est pas expirée** :
   - Va sur [appstoreconnect.apple.com/access/api](https://appstoreconnect.apple.com/access/api)
   - Vérifie que la clé est toujours active (pas expirée)
   - Si elle est expirée, crée une nouvelle clé et mets à jour les secrets

2. **Le Key ID correspond au fichier .p8** :
   - Le nom du fichier doit être `AuthKey_KEYID.p8` où `KEYID` = `APP_STORE_CONNECT_KEY_ID`
   - Vérifie que les deux correspondent exactement

3. **Le fichier .p8 est correctement encodé en base64** :
   - Le secret `APP_STORE_CONNECT_KEY_BASE64` doit contenir le contenu du fichier .p8 encodé en base64
   - Vérifie qu'il n'y a pas d'espaces ou de retours à la ligne supplémentaires
   - Teste le décodage : `echo "BASE64_STRING" | base64 -d` doit afficher le contenu du fichier .p8

4. **L'Issuer ID est correct** :
   - Va sur [appstoreconnect.apple.com/access/api](https://appstoreconnect.apple.com/access/api)
   - Copie l'Issuer ID affiché en haut de la page
   - Vérifie qu'il correspond exactement au secret `APP_STORE_CONNECT_ISSUER_ID`

5. **La clé a les bonnes permissions** :
   - La clé doit avoir le rôle **App Manager** (minimum) ou **Admin**
   - Vérifie dans App Store Connect → Users and Access → Keys
   - Si les permissions sont insuffisantes, crée une nouvelle clé avec plus de permissions

6. **Le Bundle ID existe** :
   - Vérifie que le Bundle ID `com.mayaconnect.app` existe dans App Store Connect
   - Va dans App Store Connect → My Apps → vérifie que l'app existe

7. **Recréer les secrets si nécessaire** :
   - Si rien ne fonctionne, recrée la clé API :
     1. Supprime l'ancienne clé dans App Store Connect
     2. Crée une nouvelle clé avec le rôle **Admin**
     3. Télécharge le nouveau fichier .p8
     4. Reconvertis en base64
     5. Mets à jour tous les secrets GitHub

---

### 7. **App Store Connect Team ID (optionnel)**

**Nom de la variable :** `ITC_TEAM_ID`

**Où le trouver :**
- Si ton **App Store Connect Team ID** est différent de ton **Apple Team ID** :
  1. Connecte-toi à [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
  2. Va dans **Users and Access** → **Teams**
  3. Le Team ID est affiché

**Quand l'utiliser :**
- Seulement si tu as plusieurs équipes ou si l'ID est différent
- Décommente dans `ios/fastlane/Appfile` : `itc_team_id("123456789")`

---

### 8. **Match Password**

**Nom de la variable :** `MATCH_PASSWORD`

**Où le trouver :**
- C'est **une passphrase que TU choisis** pour chiffrer les certificats gérés par `fastlane match`
- Choisis une phrase forte et sécurisée (ex: `Maya2024SecureMatch!@#`)

⚠️ **Important :** Garde la **même valeur** partout et ne la perds pas. Sans elle, tu ne pourras plus accéder aux certificats.

**Où l'utiliser :**
- Variable d'environnement locale : `MATCH_PASSWORD`
- Secret GitHub : `MATCH_PASSWORD`
- Utilisé lors de l'exécution de `fastlane match`

---

### 9. **Match Git URL**

**Nom de la variable :** `MATCH_GIT_URL`

**⚠️ IMPORTANT : Ce doit être un repository SÉPARÉ de ton application !**

Le repository pour les certificats Match doit être **un repository privé différent** de celui où se trouve ton code source. Par exemple :
- **Repo de l'app** : `Maya-Mobile` (ton repo actuel)
- **Repo des certificats** : `maya-ios-certificates` (nouveau repo à créer)

**Pourquoi un repo séparé ?**
- ✅ Sécurité : les certificats sont sensibles et ne doivent pas être dans le code source
- ✅ Accès : tu peux limiter l'accès au repo de certificats
- ✅ Performance : pas besoin de cloner les certificats à chaque fois
- ✅ Bonnes pratiques : recommandé par fastlane/match

**Où le trouver :**
1. Crée un **nouveau repo Git privé** sur GitHub (ex: `maya-ios-certificates`)
   - ⚠️ **Ce doit être un repo VIDE et NOUVEAU**, pas ton repo d'application !
2. Récupère l'URL :
   - **SSH** : `git@github.com:TON-USERNAME/maya-ios-certificates.git`
   - **HTTPS** : `https://github.com/TON-USERNAME/maya-ios-certificates.git`

**Où l'utiliser :**
- `ios/fastlane/Matchfile` → `git_url()`
- Variable d'environnement : `MATCH_GIT_URL`
- Secret GitHub : `MATCH_GIT_URL`

---

### 10. **Match Git Basic Authorization**

**Nom de la variable :** `MATCH_GIT_BASIC_AUTHORIZATION`

**Où le trouver :**
1. Sur GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Clique sur **Generate new token (classic)**
3. Donne un nom (ex: `Maya Match Access`)
4. Sélectionne le scope : **`repo`** (accès complet aux repos privés)
5. Clique sur **Generate token**
6. **Copie le token** (⚠️ tu ne pourras plus le voir après)

7. Construit la chaîne : `username:token`
   - `username` = ton pseudo GitHub
   - `token` = le PAT créé à l'étape 5

8. **Sous Windows (PowerShell)** :
```powershell
$plain = "username:token"  # Remplace par tes vraies valeurs
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($plain))
```

9. Copie la sortie (base64) et mets-la dans le secret GitHub

**Où l'utiliser :**
- Secret GitHub : `MATCH_GIT_BASIC_AUTHORIZATION`
- Utilisé par GitHub Actions pour accéder au repo Match via HTTPS

**⚠️ Dépannage - Erreur 403 "Write access to repository not granted" :**

Si tu obtiens une erreur 403 lors du clonage du repo Match, suis ce guide étape par étape :

### Étape 1 : Vérifier que le repository existe

1. Va sur GitHub et vérifie que le repository existe
2. L'URL doit être exactement celle dans le secret `MATCH_GIT_URL`
3. Le repository doit être **privé** (Private)
4. Si le repository n'existe pas, **crée-le maintenant** :
   - New repository → Nom (ex: `maya-ios-certificates`)
   - Coche **Private**
   - Ne coche **aucune option** (pas de README, pas de .gitignore)
   - Clique sur "Create repository"

### Étape 2 : Vérifier le token PAT

1. Va sur GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Trouve ton token (ou crée-en un nouveau)
3. Le token **DOIT** avoir le scope **`repo`** (Full control of private repositories)
4. Si le token n'a pas le scope `repo`, **crée un nouveau token** :
   - Generate new token (classic)
   - Donne un nom (ex: `Maya Match Access`)
   - Coche **uniquement** `repo` (tout le scope repo)
   - Generate token
   - **Copie le token immédiatement** (tu ne pourras plus le voir)

### Étape 3 : Vérifier ton username GitHub

1. Va sur ton profil GitHub
2. Note ton **username exact** (sensible à la casse)
   - Exemple : si l'URL est `https://github.com/Mayaconnect`, le username est `Mayaconnect` (avec M majuscule)

### Étape 4 : Recréer la chaîne base64 correctement

**Sous Windows (PowerShell)** :
```powershell
# Remplace par TON username GitHub et TON token PAT
$plain = "TON_USERNAME_GITHUB:TON_TOKEN_PAT"
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($plain))
```

**Exemple** :
```powershell
$plain = "mayaconnect:github_pat_11B4RUHIY0E43BbLcCVQCSVQPgOt9Basr"
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($plain))
```

**⚠️ Points importants** :
- Format exact : `username:token` (un seul `:`, pas d'espaces)
- Le username doit être **exactement** celui de GitHub (même casse)
- Le token doit être le **token complet** (commence par `github_pat_`)

### Étape 5 : Vérifier le secret GitHub

1. Va dans ton repository → **Settings** → **Secrets and variables** → **Actions**
2. Trouve le secret `MATCH_GIT_BASIC_AUTHORIZATION`
3. **Supprime-le** et **recrée-le** avec la nouvelle valeur base64
4. Assure-toi qu'il n'y a **pas d'espaces** avant ou après
5. Assure-toi qu'il n'y a **pas de retours à la ligne**

### Étape 6 : Vérifier le secret MATCH_GIT_URL

1. Dans **Settings** → **Secrets and variables** → **Actions**
2. Trouve le secret `MATCH_GIT_URL`
3. Vérifie que l'URL est correcte :
   - Format HTTPS : `https://github.com/USERNAME/REPO-NAME.git`
   - L'URL doit pointer vers le **repository de certificats** (pas le repo de l'app)
   - Le repository doit exister et être privé

### Étape 7 : Test manuel (optionnel)

Pour tester manuellement l'authentification :

```bash
# Remplace BASE64_STRING par ta valeur base64
echo "BASE64_STRING" | base64 -d
# Devrait afficher : username:token

# Teste le clonage (remplace les valeurs)
git clone -c http.extraheader="Authorization: Basic BASE64_STRING" \
  https://github.com/USERNAME/REPO-NAME.git \
  /tmp/test-clone
```

### Checklist finale

Avant de relancer le workflow, vérifie que :

- [ ] Le repository de certificats existe et est privé
- [ ] Le token PAT a le scope `repo`
- [ ] Le format base64 est `username:token` (vérifié avec `base64 -d`)
- [ ] Le username correspond exactement à ton GitHub (même casse)
- [ ] Le secret `MATCH_GIT_BASIC_AUTHORIZATION` a été mis à jour
- [ ] Le secret `MATCH_GIT_URL` pointe vers le bon repository
- [ ] Les deux secrets n'ont pas d'espaces ou retours à la ligne

---

### 11. **Apple Application-Specific Password (optionnel)**

**Nom de la variable :** `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD`

**Où le trouver :**
1. Connecte-toi à [appleid.apple.com](https://appleid.apple.com)
2. Va dans **Sign-In and Security** → **App-Specific Passwords**
3. Clique sur **Generate an app-specific password**
4. Donne un nom (ex: `Fastlane CI/CD`)
5. Copie le mot de passe généré (format : `xxxx-xxxx-xxxx-xxxx`)

**Quand l'utiliser :**
- Seulement si tu utilises l'authentification à deux facteurs et que Fastlane en a besoin
- Secret GitHub : `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD`

---

## 📝 Checklist de configuration

### Dans Apple Developer Portal
- [ ] Bundle ID créé (`com.maya.connect` ou `com.maya.app`)
- [ ] Apple Team ID noté
- [ ] Apple ID (email) noté

### Dans App Store Connect
- [ ] App Store Connect Key ID créé et noté
- [ ] App Store Connect Issuer ID noté
- [ ] Fichier `.p8` téléchargé et sauvegardé
- [ ] Fichier `.p8` converti en base64

### Pour Fastlane Match
- [ ] Repo Git privé créé pour les certificats
- [ ] URL du repo notée (`MATCH_GIT_URL`)
- [ ] Personal Access Token GitHub créé
- [ ] Authorization Basic encodée en base64 (`MATCH_GIT_BASIC_AUTHORIZATION`)
- [ ] Passphrase choisie (`MATCH_PASSWORD`)

### Dans GitHub Secrets
- [ ] `APP_STORE_CONNECT_KEY_ID`
- [ ] `APP_STORE_CONNECT_ISSUER_ID`
- [ ] `APP_STORE_CONNECT_KEY_BASE64`
- [ ] `APPLE_TEAM_ID`
- [ ] `MATCH_PASSWORD`
- [ ] `MATCH_GIT_URL`
- [ ] `MATCH_GIT_BASIC_AUTHORIZATION`
- [ ] `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` (optionnel)
- [ ] `TESTFLIGHT_GROUPS` (optionnel - ex: `Internal Testers,QA Team`)
- [ ] `TESTFLIGHT_DISTRIBUTE_EXTERNAL` (optionnel - `true` ou `false`)
- [ ] `TESTFLIGHT_NOTIFY_EXTERNAL` (optionnel - `true` ou `false`)
- [ ] `TESTFLIGHT_BETA_DESCRIPTION` (optionnel)
- [ ] `TESTFLIGHT_CONTACT_EMAIL` (requis si `TESTFLIGHT_DISTRIBUTE_EXTERNAL: true`)

### Dans les fichiers locaux
- [ ] `app.json` → `ios.bundleIdentifier` configuré
- [ ] `ios/fastlane/Appfile` → `app_identifier()`, `apple_id()`, `team_id()` configurés
- [ ] `ios/fastlane/Matchfile` → `git_url()`, `app_identifier()`, `username()` configurés
- [ ] Fichier `.p8` placé dans `ios/fastlane/keys/AuthKey_XXXXXXXXXX.p8`

---

## 🔗 Liens utiles

- [Apple Developer Portal](https://developer.apple.com/account)
- [App Store Connect](https://appstoreconnect.apple.com)
- [App Store Connect API Keys](https://appstoreconnect.apple.com/access/api)
- [Apple ID Management](https://appleid.apple.com)
- [Fastlane Match Documentation](https://docs.fastlane.tools/actions/match/)

---

## ⚠️ Notes importantes

1. **Bundle ID incohérence :** Il y a une différence entre `app.json` (`com.maya.connect`) et les fichiers Fastlane (`com.maya.app`). Il faut uniformiser.

2. **Sécurité :** Ne commite **JAMAIS** les fichiers `.p8`, les mots de passe ou les tokens dans le repo Git.

3. **Backup :** Sauvegarde le fichier `.p8` et la passphrase `MATCH_PASSWORD` dans un gestionnaire de mots de passe sécurisé.

4. **Première utilisation :** Pour la première fois, tu devras peut-être lancer `fastlane match` manuellement pour créer les certificats.

---

---

## 🧪 Configuration TestFlight (Optionnel)

### Configuration des groupes de testeurs

Tu peux configurer à qui envoyer l'app dans TestFlight directement depuis la CI/CD.

#### 1. Créer les groupes dans App Store Connect

1. Connecte-toi à [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Va dans **TestFlight** → **Groups** (ou **Groupes**)
3. Clique sur **+** pour créer un nouveau groupe
4. Donne un nom (ex: `Internal Testers`, `QA Team`, `Beta Testers`)
5. Ajoute les testeurs au groupe (emails Apple ID)

#### 2. Configurer les secrets GitHub

**`TESTFLIGHT_GROUPS`** (optionnel)
- Format : `"Internal Testers,QA Team,Beta Testers"` (noms séparés par des virgules)
- Si vide ou non défini : distribue à tous les testeurs internes
- Les noms doivent correspondre exactement aux groupes créés dans App Store Connect

**`TESTFLIGHT_DISTRIBUTE_EXTERNAL`** (optionnel)
- `true` : distribue aussi aux testeurs externes (nécessite une review Apple)
- `false` : uniquement les testeurs internes (par défaut)

**`TESTFLIGHT_NOTIFY_EXTERNAL`** (optionnel)
- `true` : envoie une notification email aux testeurs externes
- `false` : pas de notification (par défaut)

**`TESTFLIGHT_BETA_DESCRIPTION`** (optionnel)
- Description affichée aux testeurs dans TestFlight
- Exemple : `"Nouvelle version avec corrections de bugs et améliorations"`

**Informations de contact pour la review externe** (requis si `TESTFLIGHT_DISTRIBUTE_EXTERNAL: true`)
- `TESTFLIGHT_CONTACT_EMAIL` : Email de contact pour Apple
- `TESTFLIGHT_CONTACT_FIRST_NAME` : Prénom
- `TESTFLIGHT_CONTACT_LAST_NAME` : Nom
- `TESTFLIGHT_CONTACT_PHONE` : Téléphone (optionnel)
- `TESTFLIGHT_DEMO_ACCOUNT` : Compte de démo pour tester l'app (optionnel)
- `TESTFLIGHT_DEMO_PASSWORD` : Mot de passe du compte de démo (optionnel)
- `TESTFLIGHT_REVIEW_NOTES` : Notes pour les reviewers Apple

#### 3. Exemples de configuration

**Configuration minimale (testeurs internes uniquement) :**
```
TESTFLIGHT_GROUPS: (vide ou non défini)
TESTFLIGHT_DISTRIBUTE_EXTERNAL: false
```

**Configuration avec groupes spécifiques :**
```
TESTFLIGHT_GROUPS: "Internal Testers,QA Team"
TESTFLIGHT_DISTRIBUTE_EXTERNAL: false
```

**Configuration avec testeurs externes :**
```
TESTFLIGHT_GROUPS: "Beta Testers"
TESTFLIGHT_DISTRIBUTE_EXTERNAL: true
TESTFLIGHT_NOTIFY_EXTERNAL: true
TESTFLIGHT_CONTACT_EMAIL: "contact@maya.com"
TESTFLIGHT_CONTACT_FIRST_NAME: "Maya"
TESTFLIGHT_CONTACT_LAST_NAME: "Team"
TESTFLIGHT_REVIEW_NOTES: "Application de test pour Maya"
```

#### 4. Comment ça fonctionne

1. Lors du déploiement, Fastlane upload l'app sur TestFlight
2. Si `TESTFLIGHT_GROUPS` est défini, l'app est distribuée uniquement aux groupes spécifiés
3. Si `TESTFLIGHT_GROUPS` est vide, l'app est distribuée à tous les testeurs internes
4. Si `TESTFLIGHT_DISTRIBUTE_EXTERNAL: true`, l'app est aussi envoyée aux testeurs externes (nécessite une review Apple qui peut prendre 24-48h)

---

## 📞 Support

Si tu rencontres des problèmes :
1. Vérifie que tous les IDs sont corrects
2. Vérifie que les secrets GitHub sont bien configurés
3. Consulte les logs GitHub Actions pour plus de détails
4. Consulte la [documentation Fastlane](https://docs.fastlane.tools/)
5. Pour TestFlight : vérifie que les noms des groupes correspondent exactement à ceux dans App Store Connect

