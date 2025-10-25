# Create Desktop Shortcut for GPT-5 Autonomous AI
$TargetFile = "C:\Users\VIBE\Desktop\VIB3\vib3_app\GPT5_Autonomous.bat"
$ShortcutFile = "$env:USERPROFILE\Desktop\GPT5 VIB3 AI.lnk"
$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($ShortcutFile)
$Shortcut.TargetPath = $TargetFile
$Shortcut.WorkingDirectory = "C:\Users\VIBE\Desktop\VIB3\vib3_app"
$Shortcut.Description = "GPT-5 Autonomous VIB3 AI Developer"
$Shortcut.Save()
Write-Host "Desktop shortcut created: $ShortcutFile"
