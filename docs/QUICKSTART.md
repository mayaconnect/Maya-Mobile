# 🚀 Quick Start - CI/CD Fastlane + GitHub Actions

## Ce qui a été configuré

✅ Dossier `android/` natif généré avec `expo prebuild`
✅ Fastlane configuré pour Android et iOS
✅ 3 workflows GitHub Actions prêts (build, deploy, submit)
✅ .gitignore mis à jour pour la sécurité

## Ce qu'il vous reste à faire

### ⚠️ IMPORTANT : Vous n'avez PAS besoin d'installer Ruby/Fastlane sur votre PC !
**Tout se fait dans GitHub Actions.** Vous avez seulement besoin de :
1. Créer les credentials (keystores, API keys)
2. Configurer les secrets GitHub
3. Push le code
4. GitHub Actions fait tout le reste ! 🚀

### 1️⃣ Créer les credentials (à faire UNE SEULE FOIS)

#### Android :
1. **Créer le keystore** (voir `SETUP_SIMPLE_CI_CD.md` section 2.1)
2. **Créer Service Account Google Play** (section 2.2)
3. **Configurer 5 secrets GitHub** (section 4)

#### iOS (PAS besoin de Mac!) :
1. **Créer API Key App Store Connect** (section 3.1)
2. **Créer repository privé pour certificats** (section 3.2)
3. **Créer Personal Access Token GitHub** (section 3.3)
4. **Configurer 6 secrets GitHub** (section 4)
5. **Initialiser Match via GitHub Actions** (voir étape 5️⃣)

### 2️⃣ Configurer les secrets GitHub

Aller sur GitHub → Settings → Secrets and variables → Actions

**Android (5 secrets) :**
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

**iOS (6 secrets) :**
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_KEY_BASE64`
- `APPLE_TEAM_ID`
- `MATCH_PASSWORD`
- `MATCH_GIT_BASIC_AUTHORIZATION`
- `MATCH_GIT_URL`

### 3️⃣ Mettre à jour les fichiers de config

**`ios/fastlane/Appfile`** :
```ruby
apple_id("VOTRE_EMAIL@apple.com") # Remplacer ici
```

**`ios/fastlane/Matchfile`** :
```ruby
git_url("https://github.com/VOTRE_USERNAME/maya-ios-certificates.git") # Remplacer ici
username("VOTRE_EMAIL@apple.com") # Remplacer ici
```

### 4️⃣ Commit et push

```bash
git add .
git commit -m "Setup Fastlane CI/CD with GitHub Actions"
git push origin master
```

### 5️⃣ Initialiser Match pour iOS (via GitHub Actions - PAS besoin de Mac!)

**Une seule fois, pour créer les certificats iOS :**

1. Aller sur GitHub → **Actions**
2. Cliquer sur **"Setup Match (One-Time iOS Certificates)"**
3. Cliquer **"Run workflow"**
4. Entrer votre **Apple ID email**
5. Entrer votre **Apple Team ID** (trouvable sur [developer.apple.com/account](https://developer.apple.com/account/) → Membership)
6. Cliquer **"Run workflow"**

**Le workflow va :**
- Générer le projet iOS natif
- Créer automatiquement les certificats Apple
- Créer les provisioning profiles
- Les stocker dans votre repository privé de certificats

⏱️ Prend ~15-20 minutes

✅ Après ça, les certificats sont prêts et vous n'avez plus jamais besoin de retoucher à ça !

**Vous pouvez ensuite désactiver ou supprimer ce workflow** (il ne sert qu'une fois).

### 6️⃣ Déployer automatiquement

Une fois Match initialisé (étape 5), chaque push sur `master` déploie automatiquement :

```bash
# Coder votre feature...
git add .
git commit -m "Add new feature"
git push origin master
```

🎉 **C'est fait !** Le workflow GitHub Actions se lance automatiquement et déploie sur TestFlight + Google Play Internal Testing.

---

## 📖 Documentation complète

- **`SETUP_SIMPLE_CI_CD.md`** - Guide détaillé étape par étape pour créer tous les credentials
- **`WORKFLOWS_EXPLANATION.md`** - Explication des 3 workflows GitHub Actions
- **`FASTLANE_SETUP_GUIDE.md`** - Guide technique complet Fastlane

---

## 🎯 Utilisation quotidienne

### Développement normal :
```bash
# Coder...
git add .
git commit -m "Add feature X"
git push origin master
```
→ Automatiquement déployé sur TestFlight + Google Play Internal ! 🚀

### Déploiement manuel (si auto désactivé) :
1. GitHub → Actions
2. "Deploy to TestFlight & Google Play"
3. Run workflow → Choisir plateforme
4. ✅

### Déploiement en production :
1. GitHub → Actions
2. "Submit to Production"
3. Run workflow → Choisir plateforme
4. ⚠️ Attention, c'est la PROD !

---

## 🆘 Besoin d'aide ?

1. Consulter `SETUP_SIMPLE_CI_CD.md` pour la config détaillée
2. Consulter `WORKFLOWS_EXPLANATION.md` pour comprendre les workflows
3. Vérifier les logs dans GitHub Actions (onglet Actions)
4. Vérifier que tous les secrets sont configurés correctement

---

**Questions fréquentes :**

**Q : Je n'ai pas de Mac, comment faire pour iOS ?**
R : Pas de problème ! Utilisez le workflow "Setup Match" dans GitHub Actions (étape 5️⃣). Tout se fait dans le cloud, pas besoin de Mac du tout ! 🎉

**Q : Combien ça coûte ?**
R : Plan gratuit GitHub = 2000 minutes/mois. Un déploiement complet = ~200 minutes. Soit ~10 déploiements/mois gratuits.

**Q : Je peux utiliser seulement Android ?**
R : Oui ! Configurez seulement les secrets Android et lancez les workflows avec `platform: android`.

---

Bon déploiement ! 🎉
