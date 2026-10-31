# Usage: make-zip.ps1 <source dir> <output zip>   (entry names forward-slash, Linux cPanel ke liye)
param([string]$Source, [string]$Out)
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$Source = (Resolve-Path $Source).Path.TrimEnd('\')
if (Test-Path $Out) { Remove-Item $Out -Force }
$zip = [IO.Compression.ZipFile]::Open($Out, 'Create')
try {
    Get-ChildItem -LiteralPath $Source -Recurse -Force -File | ForEach-Object {
        $name = $_.FullName.Substring($Source.Length + 1).Replace('\', '/')
        [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $name, 'Optimal')
    }
} finally { $zip.Dispose() }
