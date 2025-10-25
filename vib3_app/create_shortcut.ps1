$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("C:\Users\VIBE\Desktop\VIB3 GPT-5 Helper.lnk")
$Shortcut.TargetPath = "C:\Users\VIBE\Desktop\VIB3\vib3_app\VIB3_GPT_Helper.bat"
$Shortcut.WorkingDirectory = "C:\Users\VIBE\Desktop\VIB3\vib3_app"
$Shortcut.Description = "VIB3 GPT-5 Helper for Flutter Development"
$Shortcut.Save()
Write-Host "Desktop shortcut created successfully!"
