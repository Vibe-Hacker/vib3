@echo off
echo ====================================
echo VIB3 Cloud Deployment (Windows)
echo ====================================
echo.

REM Check if Git is installed
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed. Please install Git first.
    echo Download from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo Step 1: Committing your changes to GitHub...
echo.

cd /d "C:\Users\VIBE\Desktop\VIB3"

REM Add all changes
git add .

REM Commit changes
git commit -m "Add microservices architecture for 100M+ user scale"

REM Push to GitHub
echo.
echo Pushing to GitHub...
git push origin main

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to push to GitHub.
    echo Please make sure you have:
    echo 1. Set up your GitHub credentials
    echo 2. Have push access to the repository
    echo.
    echo To set up GitHub credentials:
    echo git config --global user.name "Your Name"
    echo git config --global user.email "your-email@example.com"
    pause
    exit /b 1
)

echo.
echo ====================================
echo SUCCESS: Code pushed to GitHub!
echo ====================================
echo.

echo Step 2: Deploy to your DigitalOcean server
echo.
echo You have two options:
echo.
echo OPTION 1 - Quick Deploy (Recommended):
echo ----------------------------------------
echo 1. SSH into your server:
echo    ssh root@YOUR_SERVER_IP
echo.
echo 2. Run these commands:
echo    cd /opt
echo    git clone https://github.com/Vibe-Hacker/vib3.git vib3-new
echo    cd vib3-new
echo    npm install
echo    pm2 stop all
echo    pm2 start server.js --name vib3-production
echo    pm2 save
echo.
echo OPTION 2 - Full Microservices Deploy:
echo ----------------------------------------
echo 1. SSH into your server
echo 2. Run the automated script:
echo    curl -sSL https://raw.githubusercontent.com/Vibe-Hacker/vib3/main/deploy-to-cloud.sh | bash
echo.
echo ====================================
echo.
echo Would you like me to open the DigitalOcean console for you? (Y/N)
set /p openDO=

if /i "%openDO%"=="Y" (
    start https://cloud.digitalocean.com/droplets
)

echo.
echo ====================================
echo DEPLOYMENT CHECKLIST:
echo ====================================
echo.
echo [X] Code committed and pushed to GitHub
echo [ ] SSH into your DigitalOcean server
echo [ ] Pull the latest code
echo [ ] Install dependencies (npm install)
echo [ ] Restart the application (pm2 restart)
echo [ ] Verify the app is running
echo.
echo Your app URL: https://your-domain.com
echo.
pause