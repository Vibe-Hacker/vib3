# Create desktop shortcut for VIB3 Autocoder
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$Home\Desktop\VIB3 Autocoder.lnk")
$Shortcut.TargetPath = "C:\Users\VIBE\Desktop\VIB3\vib3_app\VIB3_Autocoder.bat"
$Shortcut.WorkingDirectory = "C:\Users\VIBE\Desktop\VIB3\vib3_app"
$Shortcut.Description = "VIB3 Master Coder - GPT-5 Autonomous Agent"
$Shortcut.Save()
Write-Host "Desktop shortcut created: VIB3 Autocoder"
