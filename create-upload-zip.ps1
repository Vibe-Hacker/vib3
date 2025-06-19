# PowerShell script to create VIB3 upload package

Write-Host "Creating VIB3 upload package..." -ForegroundColor Green

# Create a temporary directory
$tempDir = "vib3-upload-temp"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# List of files to include
$filesToCopy = @(
    "server.js",
    "package.json",
    "package-lock.json",
    "nginx.conf",
    "pm2.config.js",
    ".env.example",
    "capacitor.config.json",
    "oracle-cloud-setup.md",
    "ORACLE_CLOUD_QUICKSTART.md",
    "setup-oracle.sh"
)

# Copy individual files
Write-Host "Copying essential files..." -ForegroundColor Yellow
foreach ($file in $filesToCopy) {
    if (Test-Path $file) {
        Copy-Item $file -Destination $tempDir
        Write-Host "  ✓ $file" -ForegroundColor Gray
    }
}

# Copy www directory
Write-Host "Copying www directory..." -ForegroundColor Yellow
Copy-Item -Path "www" -Destination "$tempDir\www" -Recurse
Write-Host "  ✓ www directory" -ForegroundColor Gray

# Create compressed archive
Write-Host "`nCreating compressed archive..." -ForegroundColor Yellow
$outputFile = "vib3-upload.tar.gz"

# Use tar (available in Windows 10/11)
tar -czf $outputFile -C $tempDir .

# Clean up
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item $tempDir -Recurse -Force

# Get file size
$fileSize = (Get-Item $outputFile).Length / 1MB
$fileSizeFormatted = "{0:N2}" -f $fileSize

Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "✅ Upload package created successfully!" -ForegroundColor Green
Write-Host "📦 File: $outputFile ($fileSizeFormatted MB)" -ForegroundColor White
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "`nTo upload to your server, run:" -ForegroundColor Yellow
Write-Host 'scp -i "C:\Users\VIBE\Downloads\your-key.key" vib3-upload.tar.gz ubuntu@170.9.240.173:/home/ubuntu/' -ForegroundColor White
Write-Host "`nReplace 'your-key.key' with your actual SSH key filename!" -ForegroundColor Red