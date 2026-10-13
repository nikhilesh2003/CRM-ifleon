Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot "..\IFLEON Light and Dark Mode Branding.png"
$bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $sourcePath).Path)

# Let's find the exact bounding box of non-background pixels for the light horizontal logo
# Search in area X: 100..750, Y: 560..780
$minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0

for ($y = 560; $y -le 780; $y++) {
    for ($x = 100; $x -le 750; $x++) {
        $p = $bmp.GetPixel($x, $y)
        # Background is ~ #FEFEFE (R>245, G>245, B>245)
        if ($p.R -lt 240 -or $p.G -lt 240 -or $p.B -lt 240) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Light Horizontal Logo exact content bounds: X=$minX..$maxX (W=$($maxX - $minX + 1)), Y=$minY..$maxY (H=$($maxY - $minY + 1))"

# Check for dark horizontal logo non-background pixels (Area X: 900..1600, Y: 560..780)
# Dark background is #111925 (R~17, G~25, B~37)
$dMinX = 9999; $dMaxX = 0; $dMinY = 9999; $dMaxY = 0

for ($y = 560; $y -le 780; $y++) {
    for ($x = 900; $x -le 1600; $x++) {
        $p = $bmp.GetPixel($x, $y)
        # Difference from background (17, 25, 37)
        $diff = [Math]::Abs($p.R - 17) + [Math]::Abs($p.G - 25) + [Math]::Abs($p.B - 37)
        if ($diff -gt 35) {
            if ($x -lt $dMinX) { $dMinX = $x }
            if ($x -gt $dMaxX) { $dMaxX = $x }
            if ($y -lt $dMinY) { $dMinY = $y }
            if ($y -gt $dMaxY) { $dMaxY = $y }
        }
    }
}

Write-Output "Dark Horizontal Logo exact content bounds: X=$dMinX..$dMaxX (W=$($dMaxX - $dMinX + 1)), Y=$dMinY..$dMaxY (H=$($dMaxY - $dMinY + 1))"

# Light Icon bounds in area X: 250..600, Y: 180..450
$iMinX = 9999; $iMaxX = 0; $iMinY = 9999; $iMaxY = 0
for ($y = 180; $y -le 450; $y++) {
    for ($x = 250; $x -le 600; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -lt 240 -or $p.G -lt 240 -or $p.B -lt 240) {
            if ($x -lt $iMinX) { $iMinX = $x }
            if ($x -gt $iMaxX) { $iMaxX = $x }
            if ($y -lt $iMinY) { $iMinY = $y }
            if ($y -gt $iMaxY) { $iMaxY = $y }
        }
    }
}
Write-Output "Light Icon exact content bounds: X=$iMinX..$iMaxX (W=$($iMaxX - $iMinX + 1)), Y=$iMinY..$iMaxY (H=$($iMaxY - $iMinY + 1))"

# Dark Icon bounds in area X: 1050..1400, Y: 180..450
$diMinX = 9999; $diMaxX = 0; $diMinY = 9999; $diMaxY = 0
for ($y = 180; $y -le 450; $y++) {
    for ($x = 1050; $x -le 1400; $x++) {
        $p = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs($p.R - 17) + [Math]::Abs($p.G - 25) + [Math]::Abs($p.B - 37)
        if ($diff -gt 35) {
            if ($x -lt $diMinX) { $diMinX = $x }
            if ($x -gt $diMaxX) { $diMaxX = $x }
            if ($y -lt $diMinY) { $diMinY = $y }
            if ($y -gt $diMaxY) { $diMaxY = $y }
        }
    }
}
Write-Output "Dark Icon exact content bounds: X=$diMinX..$diMaxX (W=$($diMaxX - $diMinX + 1)), Y=$diMinY..$diMaxY (H=$($diMaxY - $diMinY + 1))"

$bmp.Dispose()
