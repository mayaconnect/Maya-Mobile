# ☕ Guide : Installer Java JDK sur Windows

Ce guide vous explique comment installer Java JDK correctement sur Windows pour créer le keystore Android.

---

## 📋 Quelle version de Java installer ?

Pour Android, vous avez besoin du **Java JDK (Java Development Kit)** version 17 ou supérieure (pas juste JRE).

**Recommandation** : JDK 17 ou JDK 21 (LTS - Long Term Support)

---

## 🚀 Méthode 1 : Installation avec Chocolatey (Recommandée)

### Étape 1 : Installer Chocolatey (si pas déjà installé)

1. Ouvrez **PowerShell en tant qu'administrateur** :
   - Cliquez droit sur le menu Démarrer
   - Sélectionnez **Windows PowerShell (Admin)** ou **Terminal (Admin)**

2. Exécutez cette commande :
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

3. Attendez la fin de l'installation

4. Fermez et rouvrez PowerShell en administrateur

### Étape 2 : Installer Java JDK avec Chocolatey

```powershell
choco install openjdk17 -y
```

Ou pour la version 21 :
```powershell
choco install openjdk21 -y
```

---

## 🚀 Méthode 2 : Installation manuelle (Alternative)

### Étape 1 : Télécharger Java JDK

1. Allez sur [Adoptium Eclipse Temurin](https://adoptium.net/fr/temurin/releases/)
2. Sélectionnez :
   - **Version** : `17` ou `21` (LTS)
   - **Operating System** : `Windows`
   - **Architecture** : `x64`
   - **Package Type** : `JDK`
3. Cliquez sur **Download** et téléchargez le fichier `.msi`

### Étape 2 : Installer Java JDK

1. Double-cliquez sur le fichier `.msi` téléchargé
2. Cliquez sur **Next** plusieurs fois
3. ✅ **IMPORTANT** : Cochez la case **Add to PATH** (Ajouter au PATH) si disponible
4. Cliquez sur **Install**
5. Attendez la fin de l'installation
6. Cliquez sur **Close**

### Étape 3 : Vérifier l'installation

1. Fermez et rouvrez PowerShell ou CMD
2. Exécutez :
```powershell
java -version
```

Vous devriez voir quelque chose comme :
```
openjdk version "17.0.10" 2024-01-16
OpenJDK Runtime Environment Temurin-17.0.10+7 (build 17.0.10+7)
OpenJDK 64-Bit Server VM Temurin-17.0.10+7 (build 17.0.10+7, mixed mode, sharing)
```

3. Vérifiez aussi `keytool` (nécessaire pour créer le keystore) :
```powershell
keytool -version
```

Vous devriez voir :
```
keytool version "17.0.10"
```

---

## 🔧 Configuration des variables d'environnement (si nécessaire)

Si `java` ou `keytool` ne sont pas reconnus, vous devez configurer les variables d'environnement manuellement :

### Étape 1 : Trouver le chemin d'installation de Java

Par défaut, Java s'installe dans :
```
C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
```

Ou avec Chocolatey :
```
C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
```

### Étape 2 : Ajouter au PATH

1. Ouvrez le menu Démarrer
2. Tapez `variables d'environnement` et sélectionnez **Modifier les variables d'environnement système**
3. Cliquez sur **Variables d'environnement...**
4. Dans **Variables système**, trouvez `Path` et cliquez sur **Modifier**
5. Cliquez sur **Nouveau**
6. Ajoutez le chemin vers le dossier `bin` de Java, par exemple :
   ```
   C:\Program Files\Eclipse Adoptium\jdk-17.0.10.7-hotspot\bin
   ```
   (Remplacez `17.0.10.7` par votre version)
7. Cliquez sur **OK** sur toutes les fenêtres

### Étape 3 : Vérifier à nouveau

1. **Fermez complètement PowerShell/CMD** (important !)
2. Rouvrez un nouveau PowerShell/CMD
3. Testez à nouveau :
```powershell
java -version
keytool -version
```

---

## ✅ Vérification finale

Exécutez ces commandes dans PowerShell pour vérifier que tout fonctionne :

```powershell
# Vérifier Java
java -version

# Vérifier Java compiler
javac -version

# Vérifier keytool (pour le keystore)
keytool -version

# Vérifier le JAVA_HOME (optionnel mais recommandé)
echo $env:JAVA_HOME
```

**Résultat attendu :**
- ✅ `java -version` affiche la version de Java
- ✅ `javac -version` affiche la version du compilateur
- ✅ `keytool -version` affiche la version de keytool
- ⚠️ `JAVA_HOME` peut être vide, ce n'est pas critique pour créer un keystore

---

## 🧪 Test : Créer un keystore de test

Pour vérifier que tout fonctionne, essayez de créer un keystore de test :

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore test-keystore.keystore -alias test-key -keyalg RSA -keysize 2048 -validity 10000
```

**Remplissez les informations** (appuyez sur Entrée pour utiliser les valeurs par défaut) :
- Mot de passe : `test123`
- Nom complet : `Test User`
- Nom d'unité organisationnelle : `Test`
- Nom d'organisation : `Test`
- Ville : `Paris`
- État ou province : `Ile-de-France`
- Code pays : `FR`

Si la commande réussit, vous verrez :
```
Génération d'une paire de clés RSA de 2 048 bits et d'un certificat auto-signé (SHA256withRSA) d'une validité de 10 000 jours
    pour: CN=Test User, OU=Test, O=Test, L=Paris, ST=Ile-de-France, C=FR
```

**Supprimez le keystore de test** :
```powershell
Remove-Item test-keystore.keystore
```

Si tout fonctionne, vous êtes prêt à créer le vrai keystore ! 🎉

---

## 🔍 Dépannage

### ❌ Erreur : "java n'est pas reconnu en tant que commande"

**Solution 1** : Redémarrer PowerShell/CMD (fermer complètement et rouvrir)

**Solution 2** : Vérifier que Java est bien dans le PATH :
```powershell
$env:Path -split ';' | Select-String -Pattern "java|jdk"
```

**Solution 3** : Ajouter manuellement au PATH (voir section "Configuration des variables d'environnement")

### ❌ Erreur : "keytool n'est pas reconnu en tant que commande"

**Solution** : `keytool` est dans le même dossier que `java`. Si `java` fonctionne, redémarrez PowerShell. Sinon, suivez la solution ci-dessus.

### ❌ Erreur : "The system cannot find the path specified"

**Solution** : Vérifiez que le chemin d'installation de Java est correct. Utilisez :
```powershell
Get-ChildItem "C:\Program Files\Eclipse Adoptium\" -ErrorAction SilentlyContinue
```
ou
```powershell
Get-ChildItem "C:\Program Files\Java\" -ErrorAction SilentlyContinue
```

### ❌ Erreur : Java installé mais ancienne version

**Solution** : Désinstallez l'ancienne version et installez une version plus récente (17 ou 21).

### ✅ Vérifier toutes les versions de Java installées

```powershell
Get-Command java | Select-Object -ExpandProperty Source
```

Cela vous montrera tous les chemins où Java est installé.

---

## 📚 Ressources supplémentaires

- [Site officiel Adoptium Eclipse Temurin](https://adoptium.net/)
- [Documentation Oracle JDK](https://www.oracle.com/java/technologies/downloads/)
- [Guide Android - Outils requis](https://developer.android.com/studio)

---

## 🎯 Prochaine étape

Une fois Java correctement installé et vérifié, vous pouvez :

1. Passer à l'étape suivante : **Créer le keystore Android**
   - Consultez `GUIDE_SECRETS_ANDROID.md` → Étape 1

2. Créer votre keystore avec cette commande :
   ```powershell
   keytool -genkeypair -v -storetype PKCS12 -keystore maya-release.keystore -alias maya-key -keyalg RSA -keysize 2048 -validity 10000
   ```

**Besoin d'aide ?** Vérifiez d'abord que toutes les commandes de vérification fonctionnent ! ☕

