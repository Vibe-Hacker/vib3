@echo off
echo ========================================
echo VIB3 Backend - DigitalOcean Deployment Helper
echo ========================================
echo.

echo Step 1: Checking Git status...
git status --short
echo.

echo Step 2: Current branch...
git branch --show-current
echo.

echo ========================================
echo DEPLOYMENT CHECKLIST:
echo ========================================
echo.
echo [1] Commit your changes to Git
echo [2] Push to GitHub
echo [3] Deploy via DigitalOcean Console
echo.

:menu
echo.
echo What would you like to do?
echo.
echo 1. Commit all changes
echo 2. Push to GitHub
echo 3. View environment variables (for DO setup)
echo 4. Test server locally
echo 5. Open DigitalOcean Console
echo 6. Exit
echo.
set /p choice="Enter choice (1-6): "

if "%choice%"=="1" goto commit
if "%choice%"=="2" goto push
if "%choice%"=="3" goto showenv
if "%choice%"=="4" goto test
if "%choice%"=="5" goto openDO
if "%choice%"=="6" goto end

echo Invalid choice!
goto menu

:commit
echo.
echo ========================================
echo Committing changes...
echo ========================================
git add .
set /p message="Enter commit message: "
git commit -m "%message%"
echo.
echo ✅ Changes committed!
goto menu

:push
echo.
echo ========================================
echo Pushing to GitHub...
echo ========================================
git push origin main
echo.
echo ✅ Pushed to GitHub!
echo.
echo Next: Deploy via DigitalOcean Console
echo https://cloud.digitalocean.com/apps
goto menu

:showenv
echo.
echo ========================================
echo Environment Variables for DigitalOcean
echo ========================================
echo.
echo Copy these to DigitalOcean App Settings:
echo.
type .env
echo.
echo ========================================
echo IMPORTANT: Also add these secrets:
echo ========================================
echo JWT_SECRET=<generate-strong-random-string>
echo SESSION_SECRET=<generate-strong-random-string>
echo.
pause
goto menu

:test
echo.
echo ========================================
echo Testing server locally...
echo ========================================
npm start
goto menu

:openDO
echo.
echo Opening DigitalOcean Console...
start https://cloud.digitalocean.com/apps
goto menu

:end
echo.
echo Goodbye!
timeout /t 2
exit
