# Guide Complet : Fastlane + GitHub Actions pour Maya Mobile App

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Phase 1 : Configuration locale](#phase-1--configuration-locale)
3. [Phase 2 : Configuration Android](#phase-2--configuration-android)
4. [Phase 3 : Configuration iOS](#phase-3--configuration-ios)
5. [Phase 4 : Configuration GitHub Actions](#phase-4--configuration-github-actions)
6. [Phase 5 : Premier déploiement](#phase-5--premier-déploiement)
7. [Dépannage](#dépannage)

---

## Prérequis

### Comptes et accès nécessaires
- [ ] Compte Google Play Console avec accès développeur (25$ one-time fee)
- [ ] Compte Apple Developer (99$/an)
- [ ] Compte GitHub avec accès au repository
- [ ] Application créée dans App Store Connect
- [ ] Application créée dans Google Play Console

### Logiciels à installer

#### Sur Windows (pour Android)
```powershell
# 1. Installer Ruby via RubyInstaller
# Télécharger depuis : https://rubyinstaller.org/downloads/
# Choisir : Ruby+Devkit 3.2.x (x64)

# 2. Vérifier l'installation
ruby --version
gem --version

# 3. Installer Bundler
gem install bundler

# 4. Installer Fastlane
gem install fastlane -NV
```

#### Sur macOS (pour iOS - nécessaire au moins une fois)
```bash
# 1. Installer Homebrew si pas déjà installé
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Installer Ruby via rbenv (recommandé)
brew install rbenv ruby-build

# 3. Installer Ruby 3.2
rbenv install 3.2.2
rbenv global 3.2.2

# 4. Installer Bundler et Fastlane
gem install bundler
gem install fastlane -NV

# 5. Installer Xcode Command Line Tools
xcode-select --install
```

---

## Phase 1 : Configuration locale

### Étape 1.1 : Créer la structure Fastlane

Le dossier `android` a déjà été généré. Créons maintenant la structure complète.

```bash
# Dans le dossier racine du projet
cd "c:\Users\guill\Documents\Freelance\Maya-Copie\Maya Mobile App"

# Créer les dossiers Fastlane
mkdir android\fastlane
mkdir ios\fastlane  # Sera créé quand vous serez sur macOS
```

### Étape 1.2 : Créer le Gemfile

Créer un fichier `Gemfile` à la racine du projet :

```ruby
source "https://rubygems.org"

gem "fastlane", "~> 2.219"

# Plugins utiles
plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
```

### Étape 1.3 : Installer les dépendances

```bash
# À la racine du projet
bundle install
```

---

## Phase 2 : Configuration Android

### Étape 2.1 : Créer le Keystore Android

⚠️ **IMPORTANT** : Gardez ce fichier en sécurité ! Si vous le perdez, vous ne pourrez plus mettre à jour votre app.

```bash
# Sur Windows, utiliser PowerShell ou CMD
cd android\app

# Générer le keystore
keytool -genkey -v -keystore maya-release-key.keystore -alias maya-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Vous serez invité à entrer :
# - Un mot de passe pour le keystore (GARDEZ-LE PRÉCIEUSEMENT)
# - Vos informations (nom, organisation, etc.)
# - Un mot de passe pour l'alias de la clé
```

**Notez ces informations :**
- Keystore password : `___________________`
- Key alias : `maya-key-alias`
- Key password : `___________________`
- Chemin du keystore : `android/app/maya-release-key.keystore`

### Étape 2.2 : Configurer Gradle pour la signature

Créer le fichier `android/gradle.properties` (ou modifier s'il existe déjà) :

```properties
# Ajoutez ces lignes (remplacez les valeurs)
MAYA_UPLOAD_STORE_FILE=maya-release-key.keystore
MAYA_UPLOAD_KEY_ALIAS=maya-key-alias
MAYA_UPLOAD_STORE_PASSWORD=votre_keystore_password
MAYA_UPLOAD_KEY_PASSWORD=votre_key_password
```

⚠️ **NE JAMAIS COMMIT ce fichier avec les vraies valeurs !**

Modifier `android/app/build.gradle` :

```gradle
android {
    ...

    signingConfigs {
        release {
            if (project.hasProperty('MAYA_UPLOAD_STORE_FILE')) {
                storeFile file(MAYA_UPLOAD_STORE_FILE)
                storePassword MAYA_UPLOAD_STORE_PASSWORD
                keyAlias MAYA_UPLOAD_KEY_ALIAS
                keyPassword MAYA_UPLOAD_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Étape 2.3 : Créer le Fastfile Android

Créer `android/fastlane/Fastfile` :

```ruby
default_platform(:android)

platform :android do

  desc "Build APK for testing"
  lane :build_apk do
    gradle(
      task: "clean assembleRelease",
      project_dir: "android/"
    )
  end

  desc "Build AAB for Google Play"
  lane :build_aab do
    gradle(
      task: "clean bundleRelease",
      project_dir: "android/"
    )
  end

  desc "Deploy to Google Play Internal Testing"
  lane :internal do
    # Build
    gradle(
      task: "clean bundleRelease",
      project_dir: "android/"
    )

    # Upload to Google Play
    upload_to_play_store(
      track: 'internal',
      aab: 'android/app/build/outputs/bundle/release/app-release.aab',
      skip_upload_screenshots: true,
      skip_upload_images: true,
      skip_upload_metadata: true
    )
  end

  desc "Deploy to Google Play Beta Testing"
  lane :beta do
    gradle(
      task: "clean bundleRelease",
      project_dir: "android/"
    )

    upload_to_play_store(
      track: 'beta',
      aab: 'android/app/build/outputs/bundle/release/app-release.aab',
      skip_upload_screenshots: true,
      skip_upload_images: true,
      skip_upload_metadata: true
    )
  end

  desc "Deploy to Google Play Production"
  lane :production do
    gradle(
      task: "clean bundleRelease",
      project_dir: "android/"
    )

    upload_to_play_store(
      track: 'production',
      aab: 'android/app/build/outputs/bundle/release/app-release.aab'
    )
  end

end
```

### Étape 2.4 : Créer le fichier Appfile Android

Créer `android/fastlane/Appfile` :

```ruby
json_key_file("./fastlane/google-play-service-account.json")
package_name("com.maya.app")
```

### Étape 2.5 : Configurer Google Play Console

1. **Créer une Service Account**
   - Aller sur [Google Cloud Console](https://console.cloud.google.com/)
   - Créer un nouveau projet ou sélectionner celui existant
   - Aller dans "IAM & Admin" > "Service Accounts"
   - Cliquer "Create Service Account"
   - Nom : `maya-fastlane-deploy`
   - Rôle : Editor
   - Créer une clé JSON et télécharger

2. **Lier la Service Account à Google Play**
   - Aller sur [Google Play Console](https://play.google.com/console/)
   - Ouvrir votre app Maya
   - Aller dans "Setup" > "API access"
   - Cliquer sur "Link" à côté de votre service account
   - Accorder les permissions : "Release to testing tracks" + "Release to production"

3. **Copier la clé JSON**
   ```bash
   # Copier le fichier téléchargé vers :
   android/fastlane/google-play-service-account.json
   ```

### Étape 2.6 : Tester le build Android localement

```bash
cd android
bundle exec fastlane build_aab

# Si succès, tester le déploiement en internal
bundle exec fastlane internal
```

---

## Phase 3 : Configuration iOS

⚠️ **Cette partie DOIT être faite sur un Mac**

### Étape 3.1 : Générer le projet iOS

```bash
# Sur macOS, depuis la racine du projet
npx expo prebuild --platform ios --clean
```

### Étape 3.2 : Initialiser Fastlane pour iOS

```bash
cd ios
fastlane init
```

Fastlane va vous demander :
1. What would you like to use fastlane for?
   - Choisir : **4. Manual setup**
2. Le reste sera configuré manuellement

### Étape 3.3 : Configurer App Store Connect

1. **Créer une App Store Connect API Key**
   - Aller sur [App Store Connect](https://appstoreconnect.apple.com/)
   - Aller dans "Users and Access" > "Keys" > "App Store Connect API"
   - Cliquer "Generate API Key"
   - Nom : `Maya Fastlane Deploy`
   - Rôle : **App Manager**
   - Télécharger le fichier `.p8`
   - **Notez** : Issuer ID et Key ID

2. **Sauvegarder la clé**
   ```bash
   # Copier le fichier .p8 téléchargé vers :
   ios/fastlane/AuthKey_XXXXXXXXXX.p8
   ```

### Étape 3.4 : Créer le Fastfile iOS

Créer `ios/fastlane/Fastfile` :

```ruby
default_platform(:ios)

platform :ios do

  desc "Setup certificates and provisioning profiles"
  lane :setup_certificates do
    # Utilise match pour gérer les certificats
    match(type: "appstore", readonly: true)
  end

  desc "Build iOS app"
  lane :build do
    # Incrémenter le build number
    increment_build_number(
      xcodeproj: "maya.xcodeproj",
      build_number: latest_testflight_build_number + 1
    )

    # Build
    build_app(
      workspace: "maya.xcworkspace",
      scheme: "maya",
      export_method: "app-store",
      export_options: {
        provisioningProfiles: {
          "com.maya.app" => "match AppStore com.maya.app"
        }
      }
    )
  end

  desc "Upload to TestFlight"
  lane :beta do
    # Setup API Key
    app_store_connect_api_key(
      key_id: ENV["APP_STORE_CONNECT_KEY_ID"],
      issuer_id: ENV["APP_STORE_CONNECT_ISSUER_ID"],
      key_filepath: "./fastlane/AuthKey_XXXXXXXXXX.p8"
    )

    # Build
    build

    # Upload to TestFlight
    upload_to_testflight(
      skip_waiting_for_build_processing: true,
      skip_submission: true
    )
  end

  desc "Deploy to App Store"
  lane :release do
    app_store_connect_api_key(
      key_id: ENV["APP_STORE_CONNECT_KEY_ID"],
      issuer_id: ENV["APP_STORE_CONNECT_ISSUER_ID"],
      key_filepath: "./fastlane/AuthKey_XXXXXXXXXX.p8"
    )

    build

    upload_to_app_store(
      skip_metadata: false,
      skip_screenshots: false,
      submit_for_review: false
    )
  end

end
```

### Étape 3.5 : Créer le fichier Appfile iOS

Créer `ios/fastlane/Appfile` :

```ruby
app_identifier("com.maya.app")
apple_id("votre-email@apple.com")
team_id("VOTRE_TEAM_ID")
```

Pour trouver votre Team ID :
- Aller sur [Apple Developer](https://developer.apple.com/account/)
- Membership > Team ID

### Étape 3.6 : Configurer Match pour les certificats

⚠️ **Match gère automatiquement vos certificats iOS dans un repository Git privé**

```bash
cd ios
fastlane match init
```

Choisir :
1. Storage mode : **git**
2. URL du repository : Créer un repository privé sur GitHub (ex: `maya-ios-certificates`)

Ensuite :
```bash
# Générer les certificats et profiles
fastlane match appstore
```

Fastlane va :
- Créer les certificats nécessaires
- Créer les provisioning profiles
- Les stocker dans votre repository privé
- Les chiffrer avec une passphrase (GARDEZ-LA PRÉCIEUSEMENT)

**Notez** :
- Match repository : `___________________`
- Match passphrase : `___________________`

### Étape 3.7 : Tester le build iOS localement

```bash
cd ios
bundle exec fastlane beta
```

---

## Phase 4 : Configuration GitHub Actions

### Étape 4.1 : Créer les secrets GitHub

Aller sur votre repository GitHub > Settings > Secrets and variables > Actions

Créer ces secrets :

#### Secrets Android
- `ANDROID_KEYSTORE_BASE64` :
  ```bash
  # Sur Windows (PowerShell)
  $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("android\app\maya-release-key.keystore"))
  echo $base64
  ```
- `ANDROID_KEYSTORE_PASSWORD` : Votre keystore password
- `ANDROID_KEY_ALIAS` : `maya-key-alias`
- `ANDROID_KEY_PASSWORD` : Votre key password
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` :
  ```bash
  # Copier le contenu de android/fastlane/google-play-service-account.json
  cat android/fastlane/google-play-service-account.json
  ```

#### Secrets iOS
- `APP_STORE_CONNECT_KEY_ID` : Le Key ID de votre API key
- `APP_STORE_CONNECT_ISSUER_ID` : L'Issuer ID
- `APP_STORE_CONNECT_KEY_BASE64` :
  ```bash
  # Sur macOS
  base64 -i ios/fastlane/AuthKey_XXXXXXXXXX.p8 | pbcopy
  ```
- `MATCH_PASSWORD` : La passphrase de Match
- `MATCH_GIT_BASIC_AUTHORIZATION` :
  ```bash
  # Créer un Personal Access Token sur GitHub avec accès au repo certificates
  # Puis encoder : echo -n "username:token" | base64
  ```

### Étape 4.2 : Créer le workflow GitHub Actions

Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to TestFlight & Google Play

on:
  push:
    branches:
      - master
      - main
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform to deploy'
        required: true
        type: choice
        options:
          - android
          - ios
          - both

jobs:
  deploy-android:
    if: github.event_name == 'workflow_dispatch' && (github.event.inputs.platform == 'android' || github.event.inputs.platform == 'both') || github.event_name == 'push'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'
          bundler-cache: true

      - name: Setup Android keystore
        run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/app/maya-release-key.keystore

      - name: Create gradle.properties
        run: |
          cat << EOF > android/gradle.properties
          MAYA_UPLOAD_STORE_FILE=maya-release-key.keystore
          MAYA_UPLOAD_KEY_ALIAS=${{ secrets.ANDROID_KEY_ALIAS }}
          MAYA_UPLOAD_STORE_PASSWORD=${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          MAYA_UPLOAD_KEY_PASSWORD=${{ secrets.ANDROID_KEY_PASSWORD }}
          EOF

      - name: Create Google Play service account JSON
        run: |
          echo '${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}' > android/fastlane/google-play-service-account.json

      - name: Deploy to Google Play Internal Testing
        run: |
          cd android
          bundle exec fastlane internal

      - name: Upload APK artifact
        uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: android/app/build/outputs/bundle/release/app-release.aab

  deploy-ios:
    if: github.event_name == 'workflow_dispatch' && (github.event.inputs.platform == 'ios' || github.event.inputs.platform == 'both') || github.event_name == 'push'
    runs-on: macos-14

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'
          bundler-cache: true
          working-directory: ios

      - name: Setup App Store Connect API Key
        run: |
          mkdir -p ios/fastlane
          echo "${{ secrets.APP_STORE_CONNECT_KEY_BASE64 }}" | base64 -d > ios/fastlane/AuthKey_${{ secrets.APP_STORE_CONNECT_KEY_ID }}.p8
        env:
          APP_STORE_CONNECT_KEY_ID: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}

      - name: Setup Match certificates
        run: |
          cd ios
          bundle exec fastlane match appstore --readonly
        env:
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          MATCH_GIT_BASIC_AUTHORIZATION: ${{ secrets.MATCH_GIT_BASIC_AUTHORIZATION }}

      - name: Deploy to TestFlight
        run: |
          cd ios
          bundle exec fastlane beta
        env:
          APP_STORE_CONNECT_KEY_ID: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
          APP_STORE_CONNECT_ISSUER_ID: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}

      - name: Upload IPA artifact
        uses: actions/upload-artifact@v4
        with:
          name: ios-release
          path: ios/*.ipa
```

### Étape 4.3 : Créer un workflow de build simple pour tester

Créer `.github/workflows/build-check.yml` :

```yaml
name: Build Check

on:
  pull_request:
    branches:
      - master
      - main
      - develop

jobs:
  build-android:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build Android APK
        run: |
          cd android
          ./gradlew assembleRelease

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: android-build-check
          path: android/app/build/outputs/apk/release/*.apk
```

---

## Phase 5 : Premier déploiement

### Étape 5.1 : Checklist avant le déploiement

#### Android
- [ ] Keystore créé et sauvegardé en lieu sûr
- [ ] App créée dans Google Play Console
- [ ] Service account créée et liée
- [ ] Build local réussi : `cd android && bundle exec fastlane build_aab`
- [ ] Secrets GitHub configurés

#### iOS
- [ ] Projet iOS généré sur macOS
- [ ] App créée dans App Store Connect
- [ ] API Key créée
- [ ] Match configuré avec repository privé
- [ ] Certificats générés : `cd ios && fastlane match appstore`
- [ ] Build local réussi : `cd ios && bundle exec fastlane build`
- [ ] Secrets GitHub configurés

### Étape 5.2 : Premier déploiement Android

1. **Local d'abord** :
   ```bash
   cd android
   bundle exec fastlane internal
   ```

2. **Vérifier dans Google Play Console** :
   - Aller dans "Release" > "Testing" > "Internal testing"
   - Vous devriez voir votre build

3. **Via GitHub Actions** :
   - Aller sur GitHub > Actions
   - Cliquer sur "Deploy to TestFlight & Google Play"
   - Cliquer "Run workflow"
   - Choisir "android"
   - Cliquer "Run workflow"

### Étape 5.3 : Premier déploiement iOS

1. **Local d'abord (sur macOS)** :
   ```bash
   cd ios
   bundle exec fastlane beta
   ```

2. **Vérifier dans App Store Connect** :
   - Aller dans votre app > TestFlight
   - Attendre le processing (10-30 minutes)
   - Ajouter des testeurs

3. **Via GitHub Actions** :
   - Aller sur GitHub > Actions
   - Cliquer "Run workflow"
   - Choisir "ios"
   - Cliquer "Run workflow"

### Étape 5.4 : Mettre à jour .gitignore

Ajouter à votre `.gitignore` :

```gitignore
# Fastlane
fastlane/report.xml
fastlane/Preview.html
fastlane/screenshots
fastlane/test_output
*.ipa
*.dSYM.zip
*.mobileprovision

# Android keystore
*.keystore
*.jks

# Gradle properties avec secrets
android/gradle.properties

# iOS certificates (si non utilisé avec Match)
ios/fastlane/AuthKey_*.p8
android/fastlane/google-play-service-account.json

# Mais garder les dossiers
!android/fastlane/.gitkeep
!ios/fastlane/.gitkeep
```

---

## Dépannage

### Problème : "Invalid keystore format"
**Solution** : Vérifier que le base64 du keystore est correct
```bash
# Recréer le base64
certutil -encode android\app\maya-release-key.keystore keystore.b64.txt
# Copier le contenu (sans BEGIN/END) dans le secret GitHub
```

### Problème : "No App Store Connect API key"
**Solution** : Vérifier que le fichier .p8 est au bon endroit et que les variables d'environnement sont correctes

### Problème : "Certificate not found"
**Solution** : Re-générer les certificats avec Match
```bash
cd ios
fastlane match nuke appstore  # Attention : supprime les certificats existants
fastlane match appstore
```

### Problème : Build iOS échoue avec "Code signing error"
**Solution** :
1. Ouvrir Xcode
2. Aller dans "Signing & Capabilities"
3. Vérifier que "Automatically manage signing" est DÉCOCHÉE
4. Sélectionner le bon provisioning profile

### Problème : GitHub Actions coûtent trop cher
**Solution** : Limiter les builds
- Utiliser `workflow_dispatch` uniquement
- Retirer les builds automatiques sur push
- Utiliser `paths` pour ne builder que si certains fichiers changent

### Problème : "Permission denied" sur le gradlew
**Solution** :
```bash
cd android
git update-index --chmod=+x gradlew
git commit -m "Make gradlew executable"
```

---

## 🎯 Résumé des commandes essentielles

### Déploiement local Android
```bash
cd android
bundle exec fastlane internal    # Internal testing
bundle exec fastlane beta        # Beta testing
bundle exec fastlane production  # Production
```

### Déploiement local iOS
```bash
cd ios
bundle exec fastlane beta        # TestFlight
bundle exec fastlane release     # App Store
```

### GitHub Actions
```bash
# Via l'interface GitHub
GitHub > Actions > Deploy to TestFlight & Google Play > Run workflow
```

---

## 📚 Ressources utiles

- [Documentation Fastlane](https://docs.fastlane.tools/)
- [Fastlane Match](https://docs.fastlane.tools/actions/match/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Google Play Console](https://play.google.com/console/)
- [App Store Connect](https://appstoreconnect.apple.com/)

---

## ⚠️ Sécurité : Fichiers à NE JAMAIS commiter

- `android/app/*.keystore`
- `android/app/*.jks`
- `android/gradle.properties` (avec les vraies valeurs)
- `android/fastlane/google-play-service-account.json`
- `ios/fastlane/AuthKey_*.p8`
- `ios/fastlane/*.mobileprovision`
- `ios/fastlane/*.p12`

**Utilisez toujours les secrets GitHub pour ces fichiers sensibles !**

---

## ✅ Checklist finale

- [ ] Ruby installé (Windows + macOS)
- [ ] Bundler installé
- [ ] Fastlane installé
- [ ] Dossiers android/ et ios/ générés
- [ ] Keystore Android créé et sauvegardé
- [ ] Service Account Google Play créée
- [ ] App Store Connect API Key créée
- [ ] Match configuré pour iOS
- [ ] Tous les secrets GitHub configurés
- [ ] .gitignore mis à jour
- [ ] Build local Android réussi
- [ ] Build local iOS réussi
- [ ] Workflow GitHub Actions créé
- [ ] Premier déploiement Android réussi
- [ ] Premier déploiement iOS réussi
- [ ] Documentation sauvegardée

---

**Bon courage ! 🚀**

Si vous rencontrez des problèmes à une étape précise, référez-vous à la section Dépannage ou consultez les logs détaillés dans GitHub Actions.
