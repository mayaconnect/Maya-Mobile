# Configuration de l'authentification Google

## Étapes de configuration

### 1. Créer un projet Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API "Google+ API" ou "Google Identity Services"

### 2. Configurer OAuth 2.0

1. Allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Configurez l'écran de consentement OAuth si nécessaire
4. Créez un **OAuth 2.0 Client ID** pour :
   - **Application type**: Web application (pour le développement)
   - **Authorized redirect URIs**: 
     - `exp://127.0.0.1:8081` (pour Expo Go)
     - `maya://auth` (pour le build de production)
     - Votre URL de callback personnalisée

### 3. Configurer les variables d'environnement

Le Client ID Google est déjà configuré par défaut dans le code. Si vous souhaitez utiliser un autre Client ID, créez un fichier `.env` à la racine du projet :

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=votre-client-id-google.apps.googleusercontent.com
```

**Client ID actuellement configuré** :
- `535870809549-kanp7rd1hmu5ubq88aejlg2pk78htjhi.apps.googleusercontent.com`

**Important**: 
- Le Client ID doit être celui d'une application **Web** (pas Android/iOS)
- Pour Expo Go, utilisez le Client ID Web
- Pour les builds de production, vous devrez créer des Client IDs séparés pour Android et iOS
- Le Client ID est aussi configuré dans `app.json` dans la section `extra`

### 4. Configuration dans app.json (optionnel)

Vous pouvez aussi ajouter la configuration directement dans `app.json` :

```json
{
  "expo": {
    "extra": {
      "googleClientId": "votre-client-id-google.apps.googleusercontent.com"
    }
  }
}
```

Puis utiliser `Constants.expoConfig?.extra?.googleClientId` dans le code.

### 5. Tester la connexion

1. Lancez l'application : `npm start`
2. Allez sur l'écran de connexion
3. Cliquez sur "Continuer avec Google"
4. Sélectionnez votre compte Google
5. Autorisez l'application

## Dépannage

### Erreur "Client ID non configuré"
- Vérifiez que `EXPO_PUBLIC_GOOGLE_CLIENT_ID` est défini dans votre `.env`
- Redémarrez le serveur Expo après avoir modifié `.env`

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URI de redirection dans Google Cloud Console correspond à celui utilisé par l'app
- Pour Expo Go, utilisez : `exp://127.0.0.1:8081`
- Pour le développement, vous pouvez voir l'URI exact dans les logs de l'application

### L'authentification s'ouvre mais ne se termine pas
- Vérifiez que l'API backend `/api/v1/auth/google` est correctement configurée
- Vérifiez les logs de l'application pour voir les erreurs détaillées

## Notes importantes

- Le Client ID doit être celui d'une application **Web** pour fonctionner avec Expo Go
- Pour les builds de production (Android/iOS), vous devrez créer des Client IDs spécifiques
- L'API backend doit être configurée pour accepter les tokens Google et créer/connecter les utilisateurs

