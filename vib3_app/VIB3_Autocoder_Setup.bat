@echo off
REM VIB3 Autocoder Setup - Following GPT-5 Official Instructions

echo ===============================================================================
echo VIB3 AUTOCODER SETUP
echo ===============================================================================
echo.
echo This will configure the GPT-5 Master Coder for VIB3
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.8+ and add it to PATH
    pause
    exit /b 1
)

echo Installing required packages...
python -m pip install --upgrade openai regex tiktoken

echo.
echo ===============================================================================
echo CONFIGURING ENVIRONMENT
echo ===============================================================================
echo.

REM Set environment variables
echo Setting OPENAI_API_KEY...
setx OPENAI_API_KEY "your-openai-api-key-here"

echo Setting GPT_MODEL=gpt-5...
setx GPT_MODEL gpt-5

echo Setting AUTO_RUN=1 (commands execute automatically)...
setx AUTO_RUN 1

echo Setting AUTO_APPLY=1 (file writes applied automatically)...
setx AUTO_APPLY 1

echo Setting MAX_STEPS=80...
setx MAX_STEPS 80

echo Setting MAX_MINUTES=45...
setx MAX_MINUTES 45

echo Setting ROOT_ONLY=1 (confined to VIB3 project)...
setx ROOT_ONLY 1

echo.
echo ===============================================================================
echo SETUP COMPLETE!
echo ===============================================================================
echo.
echo Environment variables set. You MUST open a NEW command prompt for them to take effect.
echo.
echo To run the VIB3 autocoder:
echo   python vib3_autocoder.py "Fix the front-facing camera issue"
echo.
echo Or use the desktop shortcut: "VIB3 Autocoder"
echo.
pause
