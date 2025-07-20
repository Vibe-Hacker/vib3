@echo off
echo VIB3 Quick Deploy
echo =================
set /p IP="Enter your DigitalOcean server IP: "
echo.
echo Deploying to %IP%...
echo.
ssh root@%IP% "cd /opt && git clone https://github.com/Vibe-Hacker/vib3.git vib3-new 2>/dev/null || (cd vib3-new && git pull) && cd vib3-new && npm install && (pm2 restart all 2>/dev/null || pm2 start server.js --name vib3 -i max) && echo 'Deployment successful!'"
echo.
echo ✅ Done! Your app is now running at:
echo    http://%IP%:3000
echo.
echo To check status: ssh root@%IP% "pm2 status"
pause