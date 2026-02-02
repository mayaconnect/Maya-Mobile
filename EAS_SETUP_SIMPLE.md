# 🚀 Configuration EAS - Guide Simple

## ✅ Configuration minimale

Votre `eas.json` est maintenant propre et minimal. Il ne contient que :
- `ascAppId` : L'ID de votre app dans App Store Connect

## 🔐 Configuration des credentials dans EAS

**IMPORTANT** : Les credentials doivent être configurés dans EAS (expo.dev), PAS dans `eas.json`.

### Étape 1 : Configurer la clé API App Store Connect

1. Allez sur [https://expo.dev](https://expo.dev)
2. Connectez-vous avec votre compte
3. Sélectionnez votre projet **maya-mobile-app**
4. Allez dans **Credentials** → **iOS** → **Service Credentials**
5. Cliquez sur **"Add"** ou **"Upload new ASC API key"**
6. Remplissez :
   - **ASC API Key File** : `C:\Users\guill\Downloads\AuthKey_77TBY8NS79.p8`
   - **Key Identifier** : `77TBY8NS79`
   - **Issuer Identifier** : `5a1bb2ff-02b3-4d58-b9d9-ab4639893fba`
   - **Name** : `Maya Production`
7. Cliquez sur **Save**

### Étape 2 : Vérifier la configuration

Après avoir ajouté la clé, vérifiez que :
- ✅ **Key ID** affiché : `77TBY8NS79`
- ✅ **Issuer ID** affiché : `5a1bb2ff-02b3-4d58-b9d9-ab4639893fba`
- ✅ Pas d'erreur rouge

### Étape 3 : Soumettre

```bash
npm run eas:submit:ios
```

## 📝 Identifiants

- **Key ID** : `77TBY8NS79`
- **Issuer ID** : `5a1bb2ff-02b3-4d58-b9d9-ab4639893fba`
- **ASC App ID** : `6758561059`
- **Fichier .p8** : `C:\Users\guill\Downloads\AuthKey_77TBY8NS79.p8`

## ⚠️ Important

- ❌ **NE PAS** mettre d'Apple ID dans `eas.json` (cela fait basculer sur altool)
- ✅ **SEULEMENT** la clé API App Store Connect dans EAS
- ✅ EAS utilisera automatiquement la clé API si elle est correctement configurée

## 🚀 C'est tout !

Une fois la clé API configurée dans EAS, vous pouvez soumettre votre app. EAS utilisera automatiquement la clé API, pas altool.

