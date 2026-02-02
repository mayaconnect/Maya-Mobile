# Script PowerShell pour verifier les variables d'environnement liees a Apple/Fastlane
# Cela aide a identifier si altool utilise des credentials en cache

Write-Host "Verification des variables d'environnement Apple/Fastlane..." -ForegroundColor Cyan
Write-Host ""

# Variables a verifier
$variables = @(
    "FASTLANE_APPLE_ID",
    "FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD",
    "APPLE_ID",
    "APPLE_APPLICATION_SPECIFIC_PASSWORD",
    "APP_STORE_CONNECT_KEY_ID",
    "APP_STORE_CONNECT_ISSUER_ID",
    "APPLE_TEAM_ID"
)

$found = $false

foreach ($var in $variables) {
    $value = [Environment]::GetEnvironmentVariable($var, "User")
    if ($null -ne $value) {
        Write-Host "ATTENTION: Variable trouvee: $var" -ForegroundColor Yellow
        if ($var -like "*PASSWORD*" -or $var -like "*KEY*") {
            Write-Host "   Valeur: [MASQUEE]" -ForegroundColor Gray
        } else {
            Write-Host "   Valeur: $value" -ForegroundColor Gray
        }
        $found = $true
    }
}

if (-not $found) {
    Write-Host "OK: Aucune variable d'environnement Apple/Fastlane trouvee" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Si vous voyez FASTLANE_APPLE_ID ou FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD," -ForegroundColor Yellow
    Write-Host "cela peut faire basculer fastlane sur altool." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour supprimer ces variables:" -ForegroundColor Cyan
    Write-Host "   Remove-Item Env:VARIABLE_NAME" -ForegroundColor Gray
    Write-Host "   Exemple: Remove-Item Env:FASTLANE_APPLE_ID" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Verification des fichiers fastlane locaux..." -ForegroundColor Cyan

# Verifier les fichiers fastlane
$fastlanePaths = @(
    "ios\fastlane\Appfile",
    "fastlane\Appfile",
    "$env:USERPROFILE\.fastlane\credentials.json"
)

foreach ($path in $fastlanePaths) {
    if (Test-Path $path) {
        Write-Host "ATTENTION: Fichier trouve: $path" -ForegroundColor Yellow
        $content = Get-Content $path -Raw -ErrorAction SilentlyContinue
        if ($content -match "apple_id|FASTLANE_APPLE_ID") {
            Write-Host "   Contient une reference a Apple ID" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Verification terminee" -ForegroundColor Green
