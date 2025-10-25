@echo off
REM Universal Autocoder Setup - Works Across All Projects

echo ===============================================================================
echo UNIVERSAL AUTOCODER SETUP
echo ===============================================================================
echo.
echo This will configure GPT-5 Master Coder to work across ALL your projects
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
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

echo Setting AUTO_RUN=1...
setx AUTO_RUN 1

echo Setting AUTO_APPLY=1...
setx AUTO_APPLY 1

echo Setting MAX_STEPS=80...
setx MAX_STEPS 80

echo Setting MAX_MINUTES=45...
setx MAX_MINUTES 45

echo Setting ROOT_ONLY=0 (MULTI-PROJECT MODE)...
setx ROOT_ONLY 0

echo.
echo ===============================================================================
echo CREATING UNIVERSAL LAUNCHER
echo ===============================================================================
echo.

REM Copy vib3_autocoder.py to a common location
if not exist "%USERPROFILE%\autocoder" mkdir "%USERPROFILE%\autocoder"
copy /Y vib3_autocoder.py "%USERPROFILE%\autocoder\autocoder.py"

echo Autocoder installed to: %USERPROFILE%\autocoder\autocoder.py

echo.
echo ===============================================================================
echo SETUP COMPLETE!
echo ===============================================================================
echo.
echo ROOT_ONLY=0 means the autocoder can work across ALL directories.
echo.
echo USAGE:
echo.
echo   1. Open a NEW command prompt (for env vars to take effect)
echo.
echo   2. Navigate to any project:
echo      cd D:\VIB3_Project\vib3app1
echo.
echo   3. Run autocoder:
echo      python "%USERPROFILE%\autocoder\autocoder.py" "Your goal"
echo.
echo OR use the shortcuts we'll create...
echo.
pause
