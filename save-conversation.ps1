# PowerShell script to save Claude conversation
# Run this in PowerShell to save the current conversation

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$filename = "claude-conversation-$timestamp.md"

Write-Host "To save this conversation:"
Write-Host "1. Select all text in the Claude window (Ctrl+A)"
Write-Host "2. Copy it (Ctrl+C)"
Write-Host "3. Press Enter here to create the file"
Read-Host

# Create conversations directory if it doesn't exist
New-Item -ItemType Directory -Force -Path ".\conversations" | Out-Null

# Create the file and open it in notepad for pasting
$filepath = ".\conversations\$filename"
New-Item -ItemType File -Force -Path $filepath | Out-Null
Start-Process notepad.exe $filepath

Write-Host "Paste the conversation into Notepad and save it."
Write-Host "File created at: $filepath"