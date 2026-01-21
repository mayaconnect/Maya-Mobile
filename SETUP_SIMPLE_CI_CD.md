# Guide Simplifié : CI/CD Automatique avec GitHub Actions

## 🎯 Objectif
**Vous configurez les credentials une seule fois, et après chaque push sur `master` déploie automatiquement sur TestFlight + Google Play.**

---

## 📋 Ce que VOUS devez faire (une seule fois)

### Partie 1 : Prérequis (30 min)

#### 1.1 Comptes nécessaires
- [ ] Compte Apple Developer (99$/an)
- [ ] Compte Google Play Console (25$ one-time)
- [ ] Application créée dans App Store Connect
- [ ] Application créée dans Google Play Console

---

### Partie 2 : Configuration Android (20 min)

#### 2.1 Créer le Keystore
Sur votre PC Windows :

```powershell
# Ouvrir PowerShell dans le dossier du projet
cd "c:\Users\guill\Documents\Freelance\Maya-Copie\Maya Mobile App"

# Créer le keystore
keytool -genkey -v -keystore maya-release.keystore -alias maya-release -keyalg RSA -keysize 2048 -validity 10000
```

Quand on vous demande :
- **Keystore password** : Choisissez un mot de passe fort (ex: `MayaKeystore2024!`)
- **Key password** : Même mot de passe ou différent
- Nom, organisation, etc. : Remplissez vos informations

⚠️ **GARDEZ ce fichier et ces mots de passe en lieu sûr ! Si vous les perdez, vous ne pourrez plus mettre à jour votre app.**

**Notez :**
- Keystore password : `___________________`
- Key alias : `maya-release`
- Key password : `___________________`

#### 2.2 Créer une Service Account Google Play

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet (ou utiliser l'existant)
3. Aller dans **IAM & Admin** > **Service Accounts**
4. Cliquer **Create Service Account**
   - Nom : `github-actions-deploy`
   - Rôle : **Editor**
5. Cliquer sur la service account créée > **Keys** > **Add Key** > **Create new key**
6. Type : **JSON**
7. Télécharger le fichier JSON

8. Aller sur [Google Play Console](https://play.google.com/console/)
9. Sélectionner votre app Maya
10. **Setup** > **API access**
11. Cliquer **Link** à côté de votre service account
12. **Grant access** > Cocher :
    - **Releases** : Release to testing tracks + Release to production
    - **App access** : View app information
13. Inviter l'utilisateur

---

### Partie 3 : Configuration iOS (30 min)

⚠️ **Cette partie nécessite un Mac** (mais une seule fois)

#### 3.1 Créer une App Store Connect API Key

1. Aller sur [App Store Connect](https://appstoreconnect.apple.com/)
2. **Users and Access** > **Integrations** > **App Store Connect API**
3. Cliquer **Generate API Key** (ou le + en haut)
4. Nom : `GitHub Actions Deploy`
5. Accès : **App Manager**
6. Télécharger le fichier `.p8`

**Notez immédiatement :**
- Key ID : `___________________` (ex: `AB12CD34EF`)
- Issuer ID : `___________________` (ex: `12345678-1234-1234-1234-123456789012`)
- Fichier téléchargé : `AuthKey_AB12CD34EF.p8`

⚠️ **Vous ne pourrez télécharger ce fichier qu'UNE SEULE FOIS !**

#### 3.2 Créer un repository privé pour les certificats iOS

1. Sur GitHub, créer un nouveau repository **PRIVÉ** : `maya-ios-certificates`
2. Ne rien ajouter dedans (pas de README, rien)
3. Copier l'URL : `https://github.com/VOTRE_USERNAME/maya-ios-certificates.git`

#### 3.3 Créer un Personal Access Token GitHub

1. GitHub > **Settings** (votre profil) > **Developer settings** > **Personal access tokens** > **Tokens (classic)**
2. **Generate new token (classic)**
3. Nom : `Maya iOS Certificates Access`
4. Expiration : **No expiration** (ou 1 an)
5. Scopes : Cocher **repo** (tout)
6. Générer et **COPIER LE TOKEN** (vous ne le reverrez plus jamais)

**Notez :**
- GitHub Token : `___________________`

---

### Partie 4 : Configurer les Secrets GitHub (15 min)

Aller sur votre repository Maya > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

Créer ces secrets un par un :

#### Secrets Android (4 secrets)

1. **ANDROID_KEYSTORE_BASE64**
   ```powershell
   # Sur Windows PowerShell
   $bytes = [System.IO.File]::ReadAllBytes("maya-release.keystore")
   $base64 = [Convert]::ToBase64String($bytes)
   $base64 | Set-Clipboard
   # Le base64 est copié dans votre presse-papier, collez-le dans GitHub
   ```

2. **ANDROID_KEYSTORE_PASSWORD**
   - Coller le mot de passe du keystore

3. **ANDROID_KEY_ALIAS**
   - Valeur : `maya-release`

4. **ANDROID_KEY_PASSWORD**
   - Coller le mot de passe de la clé (souvent le même que le keystore)

5. **GOOGLE_PLAY_SERVICE_ACCOUNT_JSON**
   ```powershell
   # Ouvrir le fichier JSON téléchargé avec Notepad
   # Copier TOUT le contenu (du { jusqu'au } final)
   # Coller dans GitHub
   ```

#### Secrets iOS (6 secrets)

6. **APP_STORE_CONNECT_KEY_ID**
   - Le Key ID noté plus tôt (ex: `AB12CD34EF`)

7. **APP_STORE_CONNECT_ISSUER_ID**
   - L'Issuer ID noté plus tôt

8. **APP_STORE_CONNECT_KEY_BASE64**
   ```bash
   # Sur Mac, dans le dossier où est le fichier .p8
   base64 -i AuthKey_XXXXXXXX.p8 | pbcopy
   # Coller dans GitHub
   ```

9. **APPLE_TEAM_ID**
   - Aller sur [Apple Developer](https://developer.apple.com/account/)
   - **Membership** > copier le **Team ID**

10. **MATCH_PASSWORD**
    - Choisir un mot de passe fort pour chiffrer les certificats
    - Ex: `MayaCerts2024Secure!`

11. **MATCH_GIT_BASIC_AUTHORIZATION**
    ```bash
    # Remplacer VOTRE_USERNAME et VOTRE_TOKEN par vos vraies valeurs
    echo -n "VOTRE_USERNAME:VOTRE_TOKEN" | base64
    # Coller le résultat dans GitHub
    ```

12. **MATCH_GIT_URL**
    - L'URL du repository certificats : `https://github.com/VOTRE_USERNAME/maya-ios-certificates.git`

---

### Partie 5 : Déployer les fichiers de configuration (5 min)

Je vais créer tous les fichiers nécessaires. Vous n'avez qu'à commit et push.

**Vous allez commit :**
- `.github/workflows/deploy.yml` (GitHub Actions)
- `android/fastlane/Fastfile` (Config Android)
- `android/fastlane/Appfile` (Config Android)
- `ios/fastlane/Fastfile` (Config iOS - template)
- `ios/fastlane/Appfile` (Config iOS - template)
- `Gemfile` (Dépendances Ruby)

---

### Partie 6 : Premier déploiement (automatique!)

Une fois tout configuré :

```bash
git add .
git commit -m "Setup CI/CD with Fastlane and GitHub Actions"
git push origin master
```

**C'est tout ! GitHub Actions va automatiquement :**
1. ✅ Installer toutes les dépendances
2. ✅ Générer les dossiers natifs iOS et Android
3. ✅ Configurer les certificats iOS automatiquement
4. ✅ Builder l'app Android (.aab)
5. ✅ Builder l'app iOS (.ipa)
6. ✅ Déployer sur Google Play Internal Testing
7. ✅ Déployer sur TestFlight

Vous pouvez suivre la progression dans **Actions** sur GitHub.

---

## 🚀 Utilisation quotidienne

### Déploiement automatique
Chaque fois que vous pushez sur `master` :
```bash
git push origin master
```
→ Déploiement automatique sur TestFlight + Google Play 🎉

### Déploiement manuel
Si vous voulez déployer sans push :
1. Aller sur GitHub > **Actions**
2. Cliquer sur **Deploy to Stores**
3. **Run workflow**
4. Choisir la plateforme (android, ios, ou both)
5. **Run workflow**

### Déployer seulement sur une branche spécifique
Par défaut configuré pour `master`. Si vous voulez aussi `develop` :
```yaml
# Dans .github/workflows/deploy.yml
on:
  push:
    branches:
      - master
      - develop  # Ajouter ici
```

---

## 📊 Coûts GitHub Actions

### Minutes gratuites par mois
- **Free** : 2,000 minutes/mois
- **Pro** : 3,000 minutes/mois
- **Team** : 10,000 minutes/mois

### Multiplicateur selon OS
- Linux : x1
- macOS : x10 ⚠️
- Windows : x2

### Exemple de coût par build
- Android (Linux) : ~10 min → 10 minutes utilisées
- iOS (macOS) : ~15 min → 150 minutes utilisées

**Total par déploiement both** : ~160 minutes

→ Avec le plan gratuit : ~12 déploiements complets/mois

### Optimisations pour réduire les coûts

#### Option 1 : Builder iOS seulement quand nécessaire
Ajouter un paramètre dans le commit :
```bash
git commit -m "Fix bug [skip ios]"
```

#### Option 2 : Builder selon les fichiers modifiés
```yaml
# Dans le workflow
on:
  push:
    branches:
      - master
    paths:
      - 'app/**'
      - 'components/**'
      - 'android/**'  # Android seulement si ces fichiers changent
      # Pas ios/** donc iOS ne build pas si seul Android change
```

#### Option 3 : Déploiement manuel uniquement
Retirer le `push:` et garder seulement `workflow_dispatch:` pour ne builder que quand vous déclenchez manuellement.

---

## ❓ FAQ

### Q : Je n'ai pas de Mac, comment faire pour iOS ?
**R :** Deux options :
1. Emprunter/louer un Mac pour 1h pour la config initiale (Match va créer les certificats)
2. Utiliser un service cloud : [MacStadium](https://www.macstadium.com/), [MacinCloud](https://www.macincloud.com/)
3. Demander à un ami avec un Mac de faire la partie 3

Une fois Match configuré, vous n'aurez plus jamais besoin de Mac ! GitHub Actions s'occupe de tout.

### Q : Combien de temps prend un build complet ?
**R :**
- Android : 8-12 minutes
- iOS : 12-20 minutes
- **Total** : ~15-30 minutes

### Q : Je peux tester avant de déployer en production ?
**R :** Oui ! Par défaut, le workflow déploie sur :
- Google Play **Internal Testing** (pas en production)
- **TestFlight** (pas en production)

Vous devez manuellement promouvoir vers la production depuis les consoles.

### Q : Je veux déployer en production automatiquement
**R :** Modifier les Fastfile :
```ruby
# Android : internal → production
# iOS : beta → release
```
⚠️ Attention : pas de validation manuelle !

### Q : Ça marche avec d'autres CI/CD ? (Azure, GitLab, etc.)
**R :** Oui ! Le principe est le même :
1. Les secrets dans les variables d'environnement du CI
2. Les mêmes commandes Fastlane
3. Runner avec macOS pour iOS

---

## ✅ Checklist finale

### Configuration initiale (une seule fois)
- [ ] Keystore Android créé et sauvegardé
- [ ] Service Account Google Play créée et fichier JSON téléchargé
- [ ] API Key App Store Connect créée et fichier .p8 téléchargé
- [ ] Repository GitHub privé pour certificats iOS créé
- [ ] Personal Access Token GitHub créé
- [ ] Tous les 12 secrets configurés dans GitHub
- [ ] Fichiers de workflow commitées et pushées

### Vérification du premier déploiement
- [ ] GitHub Actions s'est exécuté sans erreur
- [ ] Build Android visible dans Google Play Console > Internal Testing
- [ ] Build iOS visible dans App Store Connect > TestFlight
- [ ] Testeurs ajoutés dans TestFlight
- [ ] App testée sur un device réel

---

## 🎉 C'est terminé !

Vous n'avez plus qu'à coder et pusher. Le CI/CD s'occupe du reste ! 🚀

**Prochains pushs :**
```bash
# Vous codez...
git add .
git commit -m "Add new feature"
git push origin master

# → GitHub Actions déploie automatiquement ! 🎊
```

---

## 📞 Support

Si ça ne fonctionne pas :
1. Vérifier les logs dans GitHub Actions (onglet Actions)
2. Vérifier que tous les secrets sont correctement configurés
3. Vérifier que les apps existent bien dans les consoles
4. Consulter la section Dépannage dans `FASTLANE_SETUP_GUIDE.md`
