@echo off
REM Script pour lancer BaoPixel Studio OS en local

cd /d "%CD%"
echo === BaoPixel Studio OS v4 - Serveur Local ===
echo.
echo Installation des dépendances...
call "C:\Program Files\nodejs\npm.cmd" install

echo.
echo Lancement du serveur de développement...
echo L'app démarre sur: http://localhost:3000
echo.

set PATH=C:\Program Files\nodejs;%PATH%
"C:\Program Files\nodejs\npm.cmd" run dev

pause
