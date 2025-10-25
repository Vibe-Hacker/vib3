# Create desktop shortcut for Simple GPT-5 Assistant
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$Home\Desktop\GPT-5 Simple Assistant.lnk")
$Shortcut.TargetPath = "C:\Users\VIBE\Desktop\VIB3\vib3_app\GPT5_Simple.bat"
$Shortcut.WorkingDirectory = "C:\Users\VIBE\Desktop\VIB3\vib3_app"
$Shortcut.Description = "GPT-5 Simple Conversational Assistant for VIB3"
$Shortcut.Save()
Write-Host "Desktop shortcut created: GPT-5 Simple Assistant"
