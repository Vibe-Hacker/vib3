@echo off
title AUTONOMOUS VIB3 AI DEVELOPER - GPT-5
color 0A
cd /d "C:\Users\VIBE\Desktop\VIB3\vib3_app"

REM Environment variable OPENAI_API_KEY should be set via setx
REM If you get an error, run: setx OPENAI_API_KEY "your-key-here"

echo.
echo ========================================
echo  AUTONOMOUS VIB3 AI - LAUNCHING...
echo ========================================
echo.

python autonomous_dev.py

pause
