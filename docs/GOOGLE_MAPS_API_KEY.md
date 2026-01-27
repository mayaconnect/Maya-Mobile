# Configuration de la clé API Google Maps

## Où obtenir votre clé API Google Maps

### 1. Console Google Cloud Platform

**Lien direct :** https://console.cloud.google.com/google/maps-apis

### 2. Étapes pour créer une clé API

1. **Accéder à la console Google Cloud**
   - Allez sur : https://console.cloud.google.com/
   - Connectez-vous avec votre compte Google

2. **Créer ou sélectionner un projet**
   - Cliquez sur le sélecteur de projet en haut
   - Créez un nouveau projet ou sélectionnez un projet existant

3. **Activer l'API Maps SDK for Android**
   - Allez sur : https://console.cloud.google.com/apis/library/maps-android-backend.googleapis.com
   - Cliquez sur "Activer"

4. **Activer l'API Maps SDK for iOS**
   - Allez sur : https://console.cloud.google.com/apis/library/maps-ios-backend.googleapis.com
   - Cliquez sur "Activer"

5. **Créer une clé API**
   - Allez sur : https://console.cloud.google.com/apis/credentials
   - Cliquez sur "Créer des identifiants" > "Clé API"
   - Une nouvelle clé API sera créée

6. **Restreindre la clé API (recommandé pour la production)**
   - Cliquez sur la clé API créée
   - Dans "Restrictions d'application" :
     - Pour Android : Ajoutez le nom du package : `com.maya.connect`
     - Pour iOS : Ajoutez l'ID du bundle : `com.maya.connect`
   - Dans "Restrictions d'API" : Sélectionnez "Restreindre la clé" et choisissez :
     - Maps SDK for Android
     - Maps SDK for iOS

### 3. Configuration dans le projet

Une fois que vous avez votre clé API, ajoutez-la dans le fichier `app.json` :

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "VOTRE_CLE_API_ICI"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "VOTRE_CLE_API_ICI"
      }
    },
    "extra": {
      "googleMapsApiKey": "VOTRE_CLE_API_ICI"
    }
  }
}
```

### 4. Liens utiles

- **Console Google Cloud** : https://console.cloud.google.com/
- **APIs & Services > Credentials** : https://console.cloud.google.com/apis/credentials
- **Maps SDK for Android** : https://console.cloud.google.com/apis/library/maps-android-backend.googleapis.com
- **Maps SDK for iOS** : https://console.cloud.google.com/apis/library/maps-ios-backend.googleapis.com
- **Documentation Expo Maps** : https://docs.expo.dev/versions/latest/sdk/maps/
- **Documentation react-native-maps** : https://github.com/react-native-maps/react-native-maps

### 5. Notes importantes

⚠️ **Important** :
- Ne commitez jamais votre clé API dans le dépôt Git
- Utilisez des variables d'environnement pour la production
- Restreignez votre clé API par application et par API pour la sécurité
- Google Maps nécessite un compte de facturation activé (mais offre un crédit gratuit de $200/mois)

### 6. Crédit gratuit

Google Maps offre **$200 de crédit gratuit par mois**, ce qui correspond généralement à :
- ~28 000 chargements de carte
- ~100 000 requêtes de géocodage

Pour plus d'informations sur la tarification : https://mapsplatform.google.com/pricing/

