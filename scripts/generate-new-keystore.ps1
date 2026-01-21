# Script pour generer une nouvelle keystore Android
# Usage: .\scripts\generate-new-keystore.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Generation d'une nouvelle keystore Android" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Demander les informations
$keystoreName = Read-Host "Nom du fichier keystore (ex: maya-release.keystore)"
$alias = Read-Host "Alias de la cle (ex: maya-key)"
$validity = Read-Host "Validite en jours (ex: 10000 pour ~27 ans)"

Write-Host ""
Write-Host "ATTENTION: Vous allez devoir entrer:" -ForegroundColor Yellow
Write-Host "  1. Un mot de passe pour le keystore (GARDEZ-LE PRECIEUSEMENT!)" -ForegroundColor Yellow
Write-Host "  2. Un mot de passe pour la cle (peut etre le meme)" -ForegroundColor Yellow
Write-Host "  3. Vos informations (nom, organisation, etc.)" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continuer? (O/N)"
if ($confirm -ne "O" -and $confirm -ne "o") {
    Write-Host "Operation annulee." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Generation de la keystore..." -ForegroundColor Cyan

# Generer la keystore
keytool -genkeypair -v -storetype PKCS12 `
    -keystore $keystoreName `
    -alias $alias `
    -keyalg RSA `
    -keysize 2048 `
    -validity $validity

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Keystore generee avec succes!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Fichier cree: $keystoreName" -ForegroundColor Cyan
    Write-Host ""
    
    # Afficher l'empreinte SHA1
    Write-Host "Extraction de l'empreinte SHA1..." -ForegroundColor Yellow
    $storePassword = Read-Host "Entrez le mot de passe du keystore pour afficher l'empreinte SHA1"
    
    $keytoolOutput = keytool -list -v -keystore $keystoreName -alias $alias -storepass $storePassword 2>&1
    if ($LASTEXITCODE -eq 0) {
        $sha1Line = $keytoolOutput | Select-String -Pattern "SHA1:"
        if ($sha1Line) {
            $sha1 = ($sha1Line -split "SHA1:")[1].Trim()
            Write-Host ""
            Write-Host "Empreinte SHA1: $sha1" -ForegroundColor Green
            Write-Host ""
            Write-Host "IMPORTANT: Notez cette empreinte SHA1!" -ForegroundColor Yellow
            Write-Host "Vous en aurez besoin pour configurer Google Play." -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "1. Gardez ce fichier et les mots de passe en securite" -ForegroundColor White
    Write-Host "2. Encodez la keystore en base64:" -ForegroundColor White
    Write-Host "   `$keystoreContent = [Convert]::ToBase64String([IO.File]::ReadAllBytes(`"$keystoreName`"))" -ForegroundColor Gray
    Write-Host "   `$keystoreContent | Out-File -FilePath `"$keystoreName-base64.txt`" -Encoding utf8 -NoNewline" -ForegroundColor Gray
    Write-Host "3. Mettez a jour le secret ANDROID_KEYSTORE_BASE64 sur GitHub" -ForegroundColor White
    Write-Host "4. Mettez a jour les secrets ANDROID_KEY_ALIAS, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_PASSWORD" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERREUR: La generation de la keystore a echoue!" -ForegroundColor Red
    exit 1
}

