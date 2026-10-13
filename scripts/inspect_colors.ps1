Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot "..\IFLEON Light and Dark Mode Branding.png"
$bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $sourcePath).Path)

# Sample background color in the dark half (e.g. at x=1000, y=500)
$darkBgSample = $bmp.GetPixel(1000, 500)
$darkBgHex = "#{0:X2}{1:X2}{2:X2}" -f $darkBgSample.R, $darkBgSample.G, $darkBgSample.B
Write-Output "Dark half background color is: $darkBgHex (R=$($darkBgSample.R), G=$($darkBgSample.G), B=$($darkBgSample.B))"

# Sample background color in light half
$lightBgSample = $bmp.GetPixel(300, 500)
$lightBgHex = "#{0:X2}{1:X2}{2:X2}" -f $lightBgSample.R, $lightBgSample.G, $lightBgSample.B
Write-Output "Light half background color is: $lightBgHex (R=$($lightBgSample.R), G=$($lightBgSample.G), B=$($lightBgSample.B))"

# Check brand blue color in the logo
# In the icon around (395, 310) or horizontal logo around (210, 640)
for ($y = 620; $y -le 660; $y += 5) {
    for ($x = 180; $x -le 240; $x += 5) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.B -gt 150 -and $p.R -lt 100) {
            $hex = "#{0:X2}{1:X2}{2:X2}" -f $p.R, $p.G, $p.B
            Write-Output "Detected Brand Blue at ($x,$y): $hex (R=$($p.R), G=$($p.G), B=$($p.B))"
            break
        }
    }
}

$bmp.Dispose()
