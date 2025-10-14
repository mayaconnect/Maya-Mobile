@echo off
REM Script de démarrage rapide pour Maya - à placer à la racine du projet
echo === Maya - Serveur de developpement ===
echo.

REM Vérifier si nous sommes dans le bon répertoire
if not exist "package.json" (
    echo Erreur: Ce script doit etre execute depuis la racine du projet Maya
    echo (repertoire contenant package.json)
    pause
    exit /b 1
)

echo Verification de l'etat du serveur...
powershell -ExecutionPolicy Bypass -Command "& { $processes = Get-Process -Name 'node' -ErrorAction SilentlyContinue | Where-Object { try { $cmd = (Get-WmiObject Win32_Process -Filter \"ProcessId = $($_.Id)\").CommandLine; $cmd -like '*expo*' } catch { $false } }; if ($processes) { Write-Host 'Serveur deja en cours d''execution' -ForegroundColor Green; Write-Host 'Acces: http://localhost:8081' -ForegroundColor Cyan; exit 1 } else { exit 0 } }"

if errorlevel 1 (
    set /p choice="Voulez-vous redemarrer le serveur? (o/N): "
    if /i not "%choice%"=="o" (
        echo.
        echo Serveur accessible sur: http://localhost:8081
        echo App Expo Go: Scannez le QR code affiche dans le terminal
        echo.
        pause
        exit /b 0
    )
)

echo.
echo Demarrage du serveur Expo...
echo Appuyez sur Ctrl+C pour arreter
echo.

npx expo start --web
