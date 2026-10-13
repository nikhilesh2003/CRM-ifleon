Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot "..\IFLEON Light and Dark Mode Branding.png"
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found: $sourcePath"
    exit 1
}

$bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $sourcePath).Path)
Write-Output "Image Loaded: Width=$($bmp.Width), Height=$($bmp.Height)"

# Let's inspect the layout of the branding sheet:
# The branding sheet has two halves:
# Left half: Light Mode branding (White background)
# Right half: Dark Mode branding (Dark background)
#
# In each half:
# Top part has the App Icon: "iF" symbol with rounded blue/cyan square and dots
# Middle/Bottom part has the Horizontal logo: Symbol + "IFLEON" wordmark + "INTELLIGENT FRAMEWORKS" tagline

function Crop-Image($src, $rect, $destPath, $bgFillColor) {
    $cropped = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
    $g = [System.Drawing.Graphics]::FromImage($cropped)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    if ($bgFillColor) {
        $g.Clear($bgFillColor)
    }
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $rect.Width, $rect.Height)
    $g.DrawImage($src, $destRect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $destDir = Split-Path $destPath
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
    $cropped.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Output "Saved: $destPath ($($rect.Width)x$($rect.Height))"
}

# 1. Light horizontal logo (X: 140 to 735, Y: 575 to 755)
# Exact bounds: Let's crop with a small safe margin
$lightHorizRect = New-Object System.Drawing.Rectangle(140, 575, 595, 175)
Crop-Image $bmp $lightHorizRect (Join-Path $PSScriptRoot "..\public\logo-light-horizontal.png") $null

# 2. Dark horizontal logo (X: 946 to 1541, Y: 575 to 755)
$darkHorizRect = New-Object System.Drawing.Rectangle(946, 575, 595, 175)
Crop-Image $bmp $darkHorizRect (Join-Path $PSScriptRoot "..\public\logo-dark-horizontal.png") $null

# 3. Light Icon only (X: 335, Y: 235, W: 200, H: 180)
$lightIconRect = New-Object System.Drawing.Rectangle(335, 235, 200, 180)
Crop-Image $bmp $lightIconRect (Join-Path $PSScriptRoot "..\public\logo-light-icon.png") $null

# 4. Dark Icon only (X: 1141, Y: 235, W: 200, H: 180)
$darkIconRect = New-Object System.Drawing.Rectangle(1141, 235, 200, 180)
Crop-Image $bmp $darkIconRect (Join-Path $PSScriptRoot "..\public\logo-dark-icon.png") $null

# Also copy defaults
Copy-Item (Join-Path $PSScriptRoot "..\public\logo-light-horizontal.png") (Join-Path $PSScriptRoot "..\public\logo-horizontal.png") -Force
Copy-Item (Join-Path $PSScriptRoot "..\public\logo-light-icon.png") (Join-Path $PSScriptRoot "..\public\logo-icon.png") -Force

$bmp.Dispose()
Write-Output "Logo processing completed successfully."
