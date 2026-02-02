# Script PowerShell pour configurer la clé API App Store Connect dans EAS
# Ce script aide à éviter que fastlane bascule sur altool

Write-Host "🔧 Configuration de la clé API App Store Connect pour EAS" -ForegroundColor Cyan
Write-Host ""

# Identifiants corrects
$CORRECT_KEY_ID = "77TBY8NS79"
$CORRECT_ISSUER_ID = "5a1bb2ff-02b3-4d58-b9d9-ab4639893fba"
$ASC_APP_ID = "6758561059"

# Vérifier que eas-cli est installé
Write-Host "🔍 Vérification de eas-cli..." -ForegroundColor Yellow
try {
    $easVersion = eas --version 2>&1
    Write-Host "✅ eas-cli installé: $easVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ eas-cli n'est pas installé." -ForegroundColor Red
    Write-Host "   Installez-le avec: npm install -g eas-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Vérifier que l'utilisateur est connecté
Write-Host "🔍 Vérification de la connexion EAS..." -ForegroundColor Yellow
try {
    $whoami = eas whoami 2>&1
    Write-Host "✅ Connecté à EAS" -ForegroundColor Green
    Write-Host "   $whoami" -ForegroundColor Gray
} catch {
    Write-Host "❌ Vous n'êtes pas connecté à EAS." -ForegroundColor Red
    Write-Host "   Connectez-vous avec: eas login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Vérifier si le fichier .p8 existe
Write-Host "🔍 Recherche du fichier .p8..." -ForegroundColor Yellow
$p8Paths = @(
    "$PWD\AuthKey_$CORRECT_KEY_ID.p8",
    "$env:USERPROFILE\Downloads\AuthKey_$CORRECT_KEY_ID.p8",
    "$env:USERPROFILE\Documents\AuthKey_$CORRECT_KEY_ID.p8"
)

$p8Found = $false
foreach ($path in $p8Paths) {
    if (Test-Path $path) {
        Write-Host "✅ Fichier .p8 trouvé: $path" -ForegroundColor Green
        $p8Found = $true
        break
    }
}

if (-not $p8Found) {
    Write-Host "⚠️  Fichier .p8 non trouvé localement." -ForegroundColor Yellow
    Write-Host "   Assurez-vous qu'il est uploadé dans EAS." -ForegroundColor Yellow
}

Write-Host ""

# Instructions pour configurer dans EAS
Write-Host "📋 Instructions pour configurer la clé API dans EAS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Allez sur https://expo.dev" -ForegroundColor White
Write-Host "2. Sélectionnez votre projet 'maya-mobile-app'" -ForegroundColor White
Write-Host "3. Allez dans Credentials → iOS → Service Credentials" -ForegroundColor White
Write-Host "4. Vérifiez App Store Connect API Key:" -ForegroundColor White
Write-Host ""
Write-Host "   ✅ Key ID doit être: $CORRECT_KEY_ID" -ForegroundColor Green
Write-Host "   ✅ Issuer ID doit être: $CORRECT_ISSUER_ID" -ForegroundColor Green
Write-Host ""

# Demander si l'utilisateur veut configurer maintenant
$configure = Read-Host "Voulez-vous configurer la clé API maintenant dans EAS? (o/n)"
if ($configure -eq "o" -or $configure -eq "O") {
    Write-Host ""
    Write-Host "🔧 Configuration de la clé API..." -ForegroundColor Cyan
    
    # Essayer de trouver le fichier .p8
    $p8File = $null
    foreach ($path in $p8Paths) {
        if (Test-Path $path) {
            $p8File = $path
            break
        }
    }
    
    if ($p8File) {
        Write-Host "📁 Fichier .p8 trouvé: $p8File" -ForegroundColor Green
        Write-Host ""
        Write-Host "Pour configurer dans EAS:" -ForegroundColor Yellow
        Write-Host "1. Allez sur https://expo.dev → votre projet → Credentials → iOS" -ForegroundColor White
        Write-Host "2. Cliquez sur 'Add' ou 'Upload new ASC API key'" -ForegroundColor White
        Write-Host "3. Remplissez:" -ForegroundColor White
        Write-Host "   - ASC API Key File: $p8File" -ForegroundColor Gray
        Write-Host "   - Key Identifier: $CORRECT_KEY_ID" -ForegroundColor Gray
        Write-Host "   - Issuer Identifier: $CORRECT_ISSUER_ID" -ForegroundColor Gray
        Write-Host "   - Name: Maya Production" -ForegroundColor Gray
        Write-Host ""
        
        # Ouvrir le fichier dans l'explorateur
        $openExplorer = Read-Host "Voulez-vous ouvrir le dossier contenant le fichier .p8? (o/n)"
        if ($openExplorer -eq "o" -or $openExplorer -eq "O") {
            $folder = Split-Path -Parent $p8File
            explorer.exe $folder
        }
    } else {
        Write-Host "⚠️  Fichier .p8 non trouvé. Cherchez-le manuellement." -ForegroundColor Yellow
        Write-Host "   Il devrait être: AuthKey_$CORRECT_KEY_ID.p8" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Pour soumettre votre app:" -ForegroundColor Cyan
Write-Host "   npm run eas:submit:ios" -ForegroundColor White
Write-Host ""

