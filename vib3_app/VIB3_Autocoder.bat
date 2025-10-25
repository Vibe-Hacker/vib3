@echo off
REM VIB3 Autocoder Launcher - Master Coder for VIB3

cd /d "C:\Users\VIBE\Desktop\VIB3\vib3_app"

echo ===============================================================================
echo VIB3 MASTER CODER (GPT-5)
echo ===============================================================================
echo.
echo This is an autonomous agent that will:
echo - Analyze your VIB3 project
echo - Search for relevant files
echo - Make targeted code changes
echo - Test and iterate until goal achieved
echo.
echo All changes are:
echo - Backed up to .vib3_backups/
echo - Auto-committed to git branch: autocoder/vib3
echo - Logged to .vib3_autocoder.log
echo.
echo ===============================================================================
echo.

echo Launching VIB3 autocoder in INTERACTIVE MODE...
echo.
echo ===============================================================================
echo.

python vib3_autocoder.py

echo.
echo ===============================================================================
echo AUTOCODER FINISHED
echo ===============================================================================
echo.
echo Check:
echo - .vib3_autocoder.log for full logs
echo - .vib3_backups/ for file backups
echo - git log on branch autocoder/vib3 for commits
echo.
pause
