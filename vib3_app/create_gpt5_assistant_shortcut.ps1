# Create desktop shortcut for GPT-5 Assistant (like Claude Code)
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$Home\Desktop\GPT-5 Assistant.lnk")
$Shortcut.TargetPath = "C:\Users\VIBE\Desktop\VIB3\vib3_app\GPT5_Assistant.bat"
$Shortcut.WorkingDirectory = "C:\Users\VIBE\Desktop\VIB3\vib3_app"
$Shortcut.Description = "GPT-5 Assistant for VIB3 - Works like Claude Code"
$Shortcut.Save()
Write-Host "Desktop shortcut created: GPT-5 Assistant"
