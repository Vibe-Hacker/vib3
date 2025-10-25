@echo off
echo ====================================
echo Setting up GPT-5 Helper for VIB3
echo ====================================
echo.

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo To use GPT-5 helper:
echo   1. Set your API key: set OPENAI_API_KEY=your-key-here
echo   2. Run: python gpt_helper.py "your question"
echo.
echo Example:
echo   python gpt_helper.py "How do I add a chat feature to my Flutter app?"
echo.
pause
