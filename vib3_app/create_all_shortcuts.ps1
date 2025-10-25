# Create desktop shortcuts for all 3 GPT-5 versions

$WshShell = New-Object -comObject WScript.Shell

# 1. GPT-5 Simple Assistant (chat only)
Write-Host "Creating shortcut: GPT-5 Simple..."
$Shortcut1 = $WshShell.CreateShortcut("$Home\Desktop\GPT-5 Simple.lnk")
$Shortcut1.TargetPath = "C:\Users\VIBE\Desktop\VIB3\vib3_app\GPT5_Simple.bat"
$Shortcut1.WorkingDirectory = "C:\Users\VIBE\Desktop\VIB3\vib3_app"
$Shortcut1.Description = "GPT-5 Simple - Chat Only (No Tools)"
$Shortcut1.Save()
Write-Host "Created: GPT-5 Simple"

# 2. GPT-5 Assistant (interactive with tools)
Write-Host "Creating shortcut: GPT-5 Assistant..."
$Shortcut2 = $WshShell.CreateShortcut("$Home\Desktop\GPT-5 Assistant.lnk")
$Shortcut2.TargetPath = "C:\Users\VIBE\Desktop\VIB3\vib3_app\GPT5_Assistant.bat"
$Shortcut2.WorkingDirectory = "C:\Users\VIBE\Desktop\VIB3\vib3_app"
$Shortcut2.Description = "GPT-5 Assistant - Interactive with Tools (Like Claude Code)"
$Shortcut2.Save()
Write-Host "Created: GPT-5 Assistant"

# 3. VIB3 Autocoder (autonomous)
Write-Host "Creating shortcut: VIB3 Autocoder..."
$Shortcut3 = $WshShell.CreateShortcut("$Home\Desktop\VIB3 Autocoder.lnk")
$Shortcut3.TargetPath = "C:\Users\VIBE\Desktop\VIB3\vib3_app\VIB3_Autocoder.bat"
$Shortcut3.WorkingDirectory = "C:\Users\VIBE\Desktop\VIB3\vib3_app"
$Shortcut3.Description = "VIB3 Autocoder - Autonomous Master Coder (Multi-Project)"
$Shortcut3.Save()
Write-Host "Created: VIB3 Autocoder"

Write-Host ""
Write-Host "==============================================================================="
Write-Host "ALL SHORTCUTS CREATED"
Write-Host "==============================================================================="
Write-Host ""
Write-Host "Your desktop now has:"
Write-Host "  1. GPT-5 Simple      - Chat only, no tools"
Write-Host "  2. GPT-5 Assistant   - Interactive with full project access"
Write-Host "  3. VIB3 Autocoder    - Autonomous agent that runs until goal achieved"
Write-Host ""
