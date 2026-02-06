# Configuration Google OAuth - Solution au problème

## ⚠️ Problème identifié

Vous utilisez actuellement un **Client ID de type "Application Web"**, mais Google **ne permet PAS** d'ajouter des URIs de redirection avec des schémas personnalisés (`exp://` ou `maya://`) pour ce type de client.

Les erreurs que vous voyez :
- ❌ "L'URI doit se terminer par une extension de domaine public de premier niveau"
- ❌ "Vous devez utiliser un principal domaine privé valide"

C'est **normal** : Google n'accepte que des URLs HTTPS pour les applications web.

## ✅ Solution : Créer un Client ID de type "Application mobile"

Pour une application React Native/Expo, vous devez créer un **nouveau Client ID de type "Application mobile"** (Android ou iOS).

### Option 1 : Client ID Android (recommandé pour commencer)

1. **Allez dans Google Cloud Console**
   - https://console.cloud.google.com/
   - APIs & Services > Credentials

2. **Créez un nouveau Client ID**
   - Cliquez sur **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
   - Sélectionnez **"Application type"** : **"Android"**
   - Cliquez sur **"CREATE"**

3. **Configurez le Client ID Android**
   - **Nom** : `Maya Connect Android` (ou ce que vous voulez)
   - **Package name** : `com.maya.connect` (votre package Android)
   - **SHA-1 certificate fingerprint** : (optionnel pour l'instant, vous pouvez l'ajouter plus tard)
   - Cliquez sur **"CREATE"**

4. **Copiez le nouveau Client ID**
   - Un nouveau Client ID sera généré (ex: `xxxxx-xxxxx.apps.googleusercontent.com`)
   - **Copiez ce Client ID**

5. **Mettez à jour votre application**
   - Remplacez l'ancien Client ID dans votre code par le nouveau
   - Pas besoin de redirect URI pour un Client ID Android !

### Option 2 : Client ID iOS

Si vous développez aussi pour iOS :

1. Créez un autre Client ID de type **"iOS"**
2. **Bundle ID** : `com.mayaconnect.app`
3. Pas besoin de redirect URI non plus !

## 🔄 Alternative : Utiliser le proxy Expo (si vous gardez le Client ID Web)

Si vous voulez garder votre Client ID web actuel, vous devez utiliser le **proxy Expo** qui génère une URL HTTPS valide :

1. **Activez le proxy dans votre code** (déjà fait si `useProxy: __DEV__`)
2. **Ajoutez cette URL dans Google Console** :
   ```
   https://auth.expo.io/@votre-username/maya-mobile-app
   ```
   (Remplacez `votre-username` par votre nom d'utilisateur Expo)

⚠️ **Note** : Le proxy Expo ne fonctionne qu'en développement avec Expo Go. Pour la production, vous devrez quand même créer un Client ID mobile.

## 📝 Mise à jour du code

Une fois que vous avez créé le nouveau Client ID Android/iOS :

1. **Mettez à jour `app.json`** ou votre variable d'environnement :
   ```json
   "extra": {
     "googleClientId": "VOTRE_NOUVEAU_CLIENT_ID_ANDROID.apps.googleusercontent.com"
   }
   ```

2. **Ou utilisez une variable d'environnement** :
   ```
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=VOTRE_NOUVEAU_CLIENT_ID_ANDROID.apps.googleusercontent.com
   ```

3. **Le code actuel fonctionnera automatiquement** car il utilise déjà le Client ID configuré.

## 🎯 Résumé

- ❌ **Ne fonctionne PAS** : Client ID Web avec `exp://` ou `maya://`
- ✅ **Fonctionne** : Client ID Android/iOS (pas besoin de redirect URI)
- ✅ **Fonctionne aussi** : Client ID Web avec proxy Expo (`https://auth.expo.io/...`)

**Recommandation** : Créez un Client ID Android, c'est le plus simple et ça fonctionne en production !

## ✅ Vérification

Après avoir créé le Client ID Android et mis à jour votre code :

1. **Redémarrez votre application** (pour charger le nouveau Client ID)
2. **Testez la connexion Google** dans votre app
3. **Vérifiez les logs** : vous devriez voir `✅ [Google OAuth] Redirect URI généré: maya://` (mais ce n'est plus nécessaire de le configurer dans Google Console)
4. **La connexion devrait fonctionner** sans erreur 400 !

