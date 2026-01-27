## Secrets iOS pour Maya – Résumé

Ce fichier résume comment récupérer et configurer les secrets iOS utilisés par Fastlane et GitHub Actions.

---

### 1. `APP_STORE_CONNECT_KEY_ID`

- **Où** : App Store Connect → `Users and Access` → onglet **Keys** → **App Store Connect API**.  
- Si tu n’as pas de clé :
  - Bouton **"+" / Generate API Key** → nom au choix, rôle **App Manager** minimum.
  - Télécharge le fichier `AuthKey_XXXXXXXXXX.p8`.
- Dans la liste des clés, la colonne **Key ID** = valeur de `APP_STORE_CONNECT_KEY_ID`.

---

### 2. `APP_STORE_CONNECT_ISSUER_ID`

- **Même écran** dans App Store Connect :
  - `Users and Access` → **Keys** → **App Store Connect API**.  
  - L’**Issuer ID** est affiché en haut de la page (un UUID long, du style `1A2B3C4D-...`).
- Si tu ne le vois pas dans l’interface :
  - Va sur `https://appstoreconnect.apple.com/access/api` connecté avec ton compte développeur : l’Issuer ID y est affiché.

---

### 3. `APP_STORE_CONNECT_KEY_BASE64`

Objectif : convertir le fichier `AuthKey_XXXXXXXXXX.p8` en base64 (pour GitHub Actions).

1. Place le fichier `.p8` quelque part dans ton projet, idéalement `ios/fastlane/AuthKey_XXXXXXXXXX.p8`.
2. **Sous Windows (PowerShell)**, depuis le dossier où se trouve le fichier :

```powershell
$path = "AuthKey_XXXXXXXXXX.p8"
[Convert]::ToBase64String([IO.File]::ReadAllBytes($path)) | Set-Clipboard
```

- Le contenu base64 est maintenant dans le presse‑papier → colle‑le dans le secret GitHub `APP_STORE_CONNECT_KEY_BASE64`.

---

### 4. `APPLE_TEAM_ID`

- **Où** : `https://developer.apple.com/account` → section **Membership**.  
- Le **Team ID** est affiché (ex. `ABCDEFG123`) → valeur de `APPLE_TEAM_ID`.
- Tu peux aussi le retrouver dans Xcode → `Preferences` → `Accounts` → sélectionne ton compte → détails de l’équipe.

---

### 5. `MATCH_PASSWORD`

- C’est **une passphrase que TU choisis** pour chiffrer les certificats gérés par `fastlane match`.
- À utiliser :
  - En local (variable d’environnement `MATCH_PASSWORD` quand tu lances `fastlane match`).
  - Dans GitHub Actions comme secret `MATCH_PASSWORD`.
- Important : garde la **même valeur** partout et ne la perds pas.

---

### 6. `MATCH_GIT_URL`

- C’est l’URL du repo Git privé qui contiendra les certificats iOS.
  1. Crée un repo privé GitHub, par ex. `maya-certificates`.
  2. Récupère l’URL :
     - SSH : `git@github.com:TON-USER/maya-certificates.git`
     - ou HTTPS : `https://github.com/TON-USER/maya-certificates.git`
  3. Mets cette URL dans le secret `MATCH_GIT_URL`.
- Ce même URL sera aussi référencé dans le `Matchfile` côté iOS.

---

### 7. `MATCH_GIT_BASIC_AUTHORIZATION`

Permet à GitHub Actions d’accéder au repo `match` via HTTPS (auth Basic encodée en base64).

1. Sur GitHub → **Settings** → **Developer settings** → **Personal access tokens** :
   - Crée un token avec au moins le scope `repo` pour le repo `maya-certificates`.
2. Construit la chaîne : `username:token`
   - `username` = ton pseudo GitHub
   - `token` = le PAT créé à l’étape 1
3. **Sous Windows (PowerShell)** :

```powershell
$plain = "username:token"
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($plain))
```

- Copie la sortie et mets‑la dans le secret `MATCH_GIT_BASIC_AUTHORIZATION`.

---

### 8. Où ajouter les secrets dans GitHub

Dans ton repo GitHub :  
`Settings` → `Secrets and variables` → `Actions` → **New repository secret** :

- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_KEY_BASE64`
- `APPLE_TEAM_ID`
- `MATCH_PASSWORD`
- `MATCH_GIT_BASIC_AUTHORIZATION`
- `MATCH_GIT_URL`


