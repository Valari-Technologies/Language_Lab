Add-Type -AssemblyName System.Drawing
$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$srcPath = Join-Path (Split-Path $PSScriptRoot -Parent) "docs\images\Language_Lab.png"
$destPath = Join-Path (Split-Path $PSScriptRoot -Parent) "frontend\src\assets\login-illustration.png"

$src = [System.Drawing.Image]::FromFile($srcPath)
$width = [int]($src.Width / 2)
$height = $src.Height

$crop = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($crop)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $width, $height), (New-Object System.Drawing.Rectangle 0, 0, $width, $height), [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose()
$src.Dispose()

$crop.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()

Write-Output "Cropped image saved successfully to $destPath"
