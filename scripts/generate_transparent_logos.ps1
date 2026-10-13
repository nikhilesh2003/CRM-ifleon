Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot "..\IFLEON Light and Dark Mode Branding.png"
$bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $sourcePath).Path)

# Content bounds found earlier:
# Light Horiz: X=151..730 (W=580), Y=580..747 (H=168)
# Dark Horiz:  X=955..1535 (W=581), Y=580..748 (H=169)
# Light Icon:  X=341..529 (W=189), Y=243..450 (H=208)
# Dark Icon:   X=1156..1341 (W=186), Y=244..450 (H=207)

# Let's crop with 8px horizontal margin and 6px vertical margin for clean breathing room
$padX = 8
$padY = 6

function Create-CroppedPng($src, $rect, $outputPath, $transparentColor, $tolerance) {
    $outBmp = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    
    for ($y = 0; $y -lt $rect.Height; $y++) {
        $srcY = $rect.Y + $y
        if ($srcY -ge $src.Height) { continue }
        
        for ($x = 0; $x -lt $rect.Width; $x++) {
            $srcX = $rect.X + $x
            if ($srcX -ge $src.Width) { continue }
            
            $pixel = $src.GetPixel($srcX, $srcY)
            
            if ($transparentColor -ne $null) {
                # Calculate color distance to background
                $diff = [Math]::Abs($pixel.R - $transparentColor.R) + 
                        [Math]::Abs($pixel.G - $transparentColor.G) + 
                        [Math]::Abs($pixel.B - $transparentColor.B)
                
                if ($diff -le $tolerance) {
                    # Fully transparent background
                    $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                } elseif ($diff -lt ($tolerance * 2.5)) {
                    # Smooth alpha transition on anti-aliased edge
                    $alpha = [int](255 * (($diff - $tolerance) / ($tolerance * 1.5)))
                    if ($alpha -gt 255) { $alpha = 255 }
                    if ($alpha -lt 0) { $alpha = 0 }
                    $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
                } else {
                    $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $pixel.R, $pixel.G, $pixel.B))
                }
            } else {
                $outBmp.SetPixel($x, $y, $pixel)
            }
        }
    }
    
    $outBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $outBmp.Dispose()
    Write-Output "Generated: $outputPath ($($rect.Width)x$($rect.Height))"
}

# 1. Exact Rectangles
$lightHorizRect = New-Object System.Drawing.Rectangle((151 - $padX), (580 - $padY), (580 + 2 * $padX), (168 + 2 * $padY))
$darkHorizRect = New-Object System.Drawing.Rectangle((955 - $padX), (580 - $padY), (581 + 2 * $padX), (169 + 2 * $padY))
$lightIconRect = New-Object System.Drawing.Rectangle((341 - $padX), (243 - $padY), (189 + 2 * $padX), (208 + 2 * $padY))
$darkIconRect = New-Object System.Drawing.Rectangle((1156 - $padX), (244 - $padY), (186 + 2 * $padX), (207 + 2 * $padY))

$whiteColor = [System.Drawing.Color]::FromArgb(254, 254, 254)
$darkBgColor = [System.Drawing.Color]::FromArgb(17, 25, 37)

$publicDir = Join-Path $PSScriptRoot "..\public"

# Transparent versions (so navbar NEVER shows a box artifact)
Create-CroppedPng $bmp $lightHorizRect (Join-Path $publicDir "logo-light-horizontal.png") $whiteColor 18
Create-CroppedPng $bmp $darkHorizRect (Join-Path $publicDir "logo-dark-horizontal.png") $darkBgColor 18

Create-CroppedPng $bmp $lightIconRect (Join-Path $publicDir "logo-light-icon.png") $whiteColor 18
Create-CroppedPng $bmp $darkIconRect (Join-Path $publicDir "logo-dark-icon.png") $darkBgColor 18

# Solid background versions as backup
Create-CroppedPng $bmp $lightHorizRect (Join-Path $publicDir "logo-light-horizontal-solid.png") $null 0
Create-CroppedPng $bmp $darkHorizRect (Join-Path $publicDir "logo-dark-horizontal-solid.png") $null 0

# Sync root logo
Copy-Item (Join-Path $publicDir "logo-light-horizontal.png") (Join-Path $publicDir "logo-horizontal.png") -Force
Copy-Item (Join-Path $publicDir "logo-light-icon.png") (Join-Path $publicDir "logo-icon.png") -Force

$bmp.Dispose()
Write-Output "All logos generated with transparency and anti-aliasing preserved."
