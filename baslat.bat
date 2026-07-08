@echo off
title Hak Rehberi - Sunucu
cd /d "%~dp0"

if not exist "node_modules" (
    echo Gerekli paketler kuruluyor, bu islem sadece ilk seferde birkac dakika surer...
    call npm install
)

if not exist ".env" (
    copy ".env.example" ".env" >nul
)

echo.
echo ============================================
echo  Sunucu baslatiliyor...
echo  Tarayicinda su adresi ac: http://localhost:3000
echo  Kapatmak icin bu pencereyi kapatabilirsin.
echo ============================================
echo.

start "" "http://localhost:3000"
call npm start

pause
