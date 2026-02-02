# 🔧 Forcer l'utilisation de la clé API dans EAS Submit

## ❌ Problème

Fastlane (utilisé par EAS Submit) peut basculer sur `altool` avec de mauvais credentials si :
1. La clé API n'est pas correctement configurée dans EAS
2. Le Key ID ne correspond pas au fichier `.p8`
3. L'Issuer ID est incorrect

## ✅ Solution : Vérifier et corriger la clé API dans EAS

### Étape 1 : Vérifier la clé actuelle dans EAS

1. Allez sur [expo.dev](https://expo.dev)
2. Sélectionnez votre projet **maya-mobile-app**
3. Allez dans **Credentials** → **iOS** → **Service Credentials**
4. Vérifiez **App Store Connect API Key** :
   - **Key ID** : Doit être `77TBY8NS79` (correspond au fichier `AuthKey_77TBY8NS79.p8`)
   - **Issuer ID** : Doit être `5a1bb2ff-02b3-4d58-b9d9-ab4639893fba`

### Étape 2 : Si le Key ID ne correspond pas

**Supprimez l'ancienne clé et ajoutez la bonne** :

1. Cliquez sur les **3 points** (⋮) → **Delete**
2. Cliquez sur **"Add"** ou **"Upload new ASC API key"**
3. Remplissez :
   - **ASC API Key File** : `C:\Users\guill\Downloads\AuthKey_77TBY8NS79.p8`
   - **Key Identifier** : `77TBY8NS79` (exactement, sans espaces)
   - **Issuer Identifier** : `5a1bb2ff-02b3-4d58-b9d9-ab4639893fba`
   - **Name** : `Maya Production`
4. Cliquez sur **Save**

### Étape 3 : Vérifier avant de soumettre

**Option 1 : Script PowerShell (Windows - recommandé)**

```powershell
npm run eas:configure-api-key
```

Ce script :
- ✅ Vérifie que vous êtes connecté à EAS
- ✅ Cherche le fichier `.p8` localement
- ✅ Vous guide pour configurer la clé API dans EAS
- ✅ Ouvre le dossier contenant le fichier `.p8` si trouvé

**Option 2 : Script Node.js (tous systèmes)**

```bash
npm run eas:verify-credentials
```

Ce script vérifie :
- ✅ Que vous êtes connecté à EAS
- ✅ Que la configuration dans `eas.json` est correcte
- ✅ Que le fichier `.p8` existe (si présent localement)

### Étape 4 : Soumettre avec vérification automatique

Le script de soumission vérifie automatiquement les credentials :

```bash
npm run eas:submit:ios
```

Ou manuellement :

```bash
eas submit --platform ios --profile production --latest
```

## 🔍 Si fastlane utilise encore altool

Si fastlane utilise encore `altool` après avoir configuré la clé API, c'est que :
1. La clé API n'est pas correctement configurée dans EAS
2. Le Key ID ou l'Issuer ID ne correspondent pas
3. Le fichier `.p8` est corrompu

**Solution** : Vérifiez à nouveau dans EAS que :
- ✅ **Key ID** : `77TBY8NS79` (correspond au fichier)
- ✅ **Issuer ID** : `5a1bb2ff-02b3-4d58-b9d9-ab4639893fba`
- ✅ **Fichier .p8** : Le bon fichier uploadé

## ✅ Vérifications finales

Avant de soumettre, vérifiez dans EAS :
- ✅ **Key ID** : `77TBY8NS79` (correspond au fichier)
- ✅ **Issuer ID** : `5a1bb2ff-02b3-4d58-b9d9-ab4639893fba`
- ✅ **Fichier .p8** : Le bon fichier uploadé
- ✅ **ascAppId** dans `eas.json` : `6758561059`

## 🚀 Après correction

```bash
npm run eas:submit:ios
```

Les logs devraient montrer que la clé API est utilisée, pas `altool`.

## 📝 Identifiants corrects

- **Key ID** : `77TBY8NS79`
- **Issuer ID** : `5a1bb2ff-02b3-4d58-b9d9-ab4639893fba`
- **ASC App ID** : `6758561059`
- **Fichier .p8** : `AuthKey_77TBY8NS79.p8`
