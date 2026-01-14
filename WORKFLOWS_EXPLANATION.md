# 📋 Explication des GitHub Actions Workflows (100% Fastlane)

## Vue d'ensemble

Votre projet utilise maintenant **3 workflows GitHub Actions** qui utilisent exclusivement **Fastlane** pour tous les builds et déploiements. Plus aucune dépendance à EAS Build.

---

## 🔍 1. Build Check (`build.yml`)

**Quand ?** Automatiquement sur chaque Pull Request

**Objectif :** Vérifier que le code compile correctement avant de merger

### Ce qu'il fait :
- ✅ Build Android APK (sans signer avec le vrai keystore)
- ✅ Build iOS (compilation seulement, sans signature)
- ✅ Upload les artifacts pour téléchargement

### Utilisation :
```bash
# Automatique sur chaque PR vers main/master/develop
git checkout -b feature/nouvelle-feature
git push origin feature/nouvelle-feature
# → Créer une PR → Le build check se lance automatiquement
```

**Coût :** ~25 minutes (15 min iOS macOS × 10 + 10 min Android Linux)

### Particularités :
- Crée un keystore "dummy" temporaire pour Android
- Build iOS pour simulateur uniquement (pas besoin de certificats)
- Ne déploie nulle part, juste vérifie la compilation

---

## 🚀 2. Deploy to TestFlight & Google Play (`deploy.yml`)

**Quand ?**
- Automatiquement sur push vers `master` ou `main`
- OU manuellement depuis GitHub Actions

**Objectif :** Builder et déployer automatiquement sur les environnements de test

### Ce qu'il fait :

#### Android :
1. Génère le dossier `android/` natif avec `expo prebuild`
2. Configure le keystore de production
3. Build avec Fastlane : `bundle exec fastlane internal`
4. Déploie sur **Google Play Internal Testing**
5. Upload le fichier .aab

#### iOS :
1. Génère le dossier `ios/` natif avec `expo prebuild`
2. Configure l'API Key App Store Connect
3. Récupère les certificats avec Match
4. Build avec Fastlane : `bundle exec fastlane beta`
5. Déploie sur **TestFlight**
6. Upload le fichier .ipa

### Utilisation automatique :
```bash
# Après avoir codé
git add .
git commit -m "Add new feature"
git push origin master

# → Le workflow se lance automatiquement
# → 20-30 minutes plus tard : app sur TestFlight + Google Play Internal
```

### Utilisation manuelle :
1. Aller sur GitHub → **Actions**
2. Cliquer sur **"Deploy to TestFlight & Google Play"**
3. Cliquer **"Run workflow"**
4. Choisir :
   - `both` : Android + iOS
   - `android` : Seulement Android
   - `ios` : Seulement iOS
5. Cliquer **"Run workflow"**

**Coût par déploiement complet :**
- Android : ~10-12 min (Linux × 1) = 10-12 minutes
- iOS : ~15-20 min (macOS × 10) = 150-200 minutes
- **Total : ~160-210 minutes** par déploiement complet

### Optimisation des coûts :
Pour économiser, déployez manuellement seulement quand nécessaire au lieu d'automatiquement.

Modifier dans `.github/workflows/deploy.yml` :
```yaml
on:
  # Commenter ces lignes pour désactiver le déploiement automatique
  # push:
  #   branches:
  #     - master
  #     - main

  # Garder seulement le manuel
  workflow_dispatch:
    # ...
```

---

## 🏭 3. Submit to Production (`submit.yml`)

**Quand ?** Manuellement uniquement (sécurité)

**Objectif :** Déployer en PRODUCTION sur les stores

### Ce qu'il fait :

#### Android :
- Build avec Fastlane : `bundle exec fastlane production`
- Déploie sur **Google Play Production**

#### iOS :
- Build avec Fastlane : `bundle exec fastlane release`
- Soumet à l'**App Store** (review d'Apple nécessaire)

### Utilisation :
1. Aller sur GitHub → **Actions**
2. Cliquer sur **"Submit to Production with Fastlane"**
3. Cliquer **"Run workflow"**
4. Choisir la plateforme (both/android/ios)
5. Confirmer

⚠️ **ATTENTION :** Ceci déploie en PRODUCTION réelle !

### Après le workflow :
- **Android** : L'app est publiée en production immédiatement
- **iOS** : L'app est soumise pour review Apple (24-48h), puis vous devez la publier manuellement dans App Store Connect

**Coût :** Identique au workflow `deploy.yml`

---

## 📊 Comparaison des 3 workflows

| Workflow | Trigger | Signe l'app ? | Déploie ? | Coût (minutes) |
|----------|---------|---------------|-----------|----------------|
| **build.yml** | Automatique (PR) | ❌ Non | ❌ Non | ~25 |
| **deploy.yml** | Auto (push master) ou Manuel | ✅ Oui | ✅ Oui (Testing) | ~160-210 |
| **submit.yml** | Manuel uniquement | ✅ Oui | ✅ Oui (Production) | ~160-210 |

---

## 🔄 Workflow typique de développement

### 1. Développement d'une feature
```bash
git checkout -b feature/mon-feature
# ... coder ...
git push origin feature/mon-feature
```
→ Créer une PR
→ **build.yml** se lance automatiquement
→ Vérifier que les checks passent ✅

### 2. Merge vers master
```bash
git checkout master
git merge feature/mon-feature
git push origin master
```
→ **deploy.yml** se lance automatiquement
→ 20-30 min plus tard : app disponible sur TestFlight + Google Play Internal

### 3. Test par les beta testeurs
- Ajouter des testeurs dans TestFlight
- Ajouter des testeurs dans Google Play Console (Internal Testing)
- Recevoir les retours

### 4. Déploiement en production (quand prêt)
- Aller sur GitHub Actions
- Lancer manuellement **submit.yml**
- Attendre la review Apple (iOS seulement)
- Publier ! 🎉

---

## 💰 Estimation des coûts GitHub Actions

### Plan Gratuit (2000 minutes/mois)
- Linux : x1 multiplicateur
- macOS : x10 multiplicateur

### Exemple de consommation mensuelle :

**Scénario conservateur** (12 PRs + 4 déploiements + 1 production) :
```
Build checks (PR) : 12 × 25 min = 300 minutes
Déploiements test : 4 × 200 min = 800 minutes
Production : 1 × 200 min = 200 minutes
─────────────────────────────────────────────
TOTAL : 1300 minutes/mois ✅ Dans le plan gratuit
```

**Scénario intensif** (30 PRs + 10 déploiements + 2 production) :
```
Build checks : 30 × 25 min = 750 minutes
Déploiements : 10 × 200 min = 2000 minutes
Production : 2 × 200 min = 400 minutes
─────────────────────────────────────────────
TOTAL : 3150 minutes/mois ⚠️ Dépassement
→ Coût additionnel : ~11.50$ (1150 min × 0.01$/min)
```

### Conseils pour optimiser :
1. **Désactiver le déploiement automatique** sur push master (garder manuel)
2. **Skiper iOS** quand seul Android a changé
3. **Utiliser des conditions de path** :
   ```yaml
   on:
     push:
       paths:
         - 'app/**'
         - 'components/**'
         # Ignorer README.md, docs, etc.
   ```

---

## 🛠️ Commandes Fastlane disponibles

### Android
```bash
cd android

# Build APK pour test
bundle exec fastlane build_apk

# Build AAB pour Google Play
bundle exec fastlane build_aab

# Déployer en internal testing
bundle exec fastlane internal

# Déployer en beta
bundle exec fastlane beta

# Déployer en production
bundle exec fastlane production
```

### iOS
```bash
cd ios

# Récupérer les certificats
bundle exec fastlane setup_certificates

# Builder l'app
bundle exec fastlane build

# Déployer sur TestFlight
bundle exec fastlane beta

# Déployer sur App Store
bundle exec fastlane release
```

---

## 🔐 Secrets GitHub requis

### Android (5 secrets)
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

### iOS (6 secrets)
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_KEY_BASE64`
- `APPLE_TEAM_ID`
- `MATCH_PASSWORD`
- `MATCH_GIT_BASIC_AUTHORIZATION`
- `MATCH_GIT_URL`

Voir le guide détaillé dans `SETUP_SIMPLE_CI_CD.md`

---

## ❓ FAQ

### Q : Pourquoi expo prebuild dans les workflows ?
**R :** Expo prebuild génère les dossiers natifs `android/` et `ios/` à partir de votre configuration Expo. C'est nécessaire car on ne commit pas ces dossiers (ils sont dans `.gitignore`). Fastlane a besoin de ces dossiers natifs pour builder.

### Q : Je peux builder localement avec Fastlane ?
**R :** Oui ! Mais vous devez d'abord générer les dossiers natifs :
```bash
npx expo prebuild --clean
cd android
bundle exec fastlane build_apk
```

### Q : Pourquoi ne pas commiter android/ et ios/ ?
**R :** Vous POUVEZ les commiter si vous voulez. Avantages :
- Pas besoin de `expo prebuild` dans le CI (plus rapide)
- Contrôle total sur les fichiers natifs

Inconvénients :
- Repository plus gros
- Conflits Git plus fréquents
- Perd la flexibilité d'Expo

**Recommandation :** Ne pas commiter, laisser `expo prebuild` les générer.

### Q : Je peux utiliser ces workflows sans Expo ?
**R :** Oui ! Il suffit de :
1. Retirer l'étape `expo prebuild` des workflows
2. Commiter les dossiers `android/` et `ios/` dans Git
3. Les workflows Fastlane fonctionneront exactement pareil

### Q : Différence entre deploy.yml et submit.yml ?
**R :**
- **deploy.yml** → Environnements de TEST (TestFlight, Internal Testing)
- **submit.yml** → PRODUCTION réelle (App Store, Google Play Production)

---

## 🎯 Points importants

1. ✅ **Aucune dépendance EAS** : Tout est géré par Fastlane
2. ✅ **Totalement automatisable** : Push = déploiement
3. ✅ **Contrôle total** : Vous gérez vos certificats avec Match
4. ✅ **Flexible** : Deploy Android only si besoin
5. ⚠️ **Coût macOS** : Les runners macOS sont 10x plus chers
6. ⚠️ **Nécessite configuration initiale** : Certificats, keystores, service accounts

---

## 📚 Fichiers créés

```
.github/workflows/
├── build.yml       # Build check sur PR
├── deploy.yml      # Déploiement TestFlight + Internal Testing
└── submit.yml      # Soumission Production

android/fastlane/
├── Fastfile        # Configuration des lanes Android
└── Appfile         # Config app Android

ios/fastlane/
├── Fastfile        # Configuration des lanes iOS
└── Appfile         # Config app iOS

Gemfile             # Dépendances Ruby/Fastlane
```

---

**Prêt à déployer ! 🚀**

Suivez le guide `SETUP_SIMPLE_CI_CD.md` pour configurer les secrets, puis poussez votre code !
