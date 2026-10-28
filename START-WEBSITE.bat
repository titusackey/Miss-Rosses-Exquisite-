@echo off
title Miss Roses Exquisite - Local Server Launcher
color 0E

echo ==============================================================
echo        MISS ROSES EXQUISITE - LAUNCHING LOCAL SERVER
echo ==============================================================
echo.
echo Checking project directory...
cd /d "c:\Users\Nii Bortey\Desktop\Miss Roses Exquisite\website"

if not exist node_modules (
    echo [INFO] Installing required dependencies...
    npm install
)

echo.
echo [INFO] Seeding initial database and starting server...
echo.
echo --------------------------------------------------------------
echo Storefront URL:      http://localhost:3000
echo Super Admin Portal:  http://localhost:3000/admin
echo Admin Login:         admin@missrosesexquisite.com
echo Admin Password:      AdminRose2026!
echo --------------------------------------------------------------
echo.
npm run dev

pause
