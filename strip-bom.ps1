# Strips UTF-8 BOMs from PHP files (the editor tool prepends them, which makes
# PHP emit raw bytes before the response body and corrupts JSON output).
param(
    [Parameter(Mandatory = $false)]
    [string]$Path = ".",
    [switch]$Quiet
)

$root = (Resolve-Path $Path).Path
$files = Get-ChildItem -Path $root -Recurse -File -Include *.php -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\\vendor\\' -and $_.FullName -notmatch '\\node_modules\\' }

$fixed = 0
foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {
        [System.IO.File]::WriteAllBytes($file.FullName, $bytes[3..($bytes.Length - 1)])
        $fixed++
    }
}

if (-not $Quiet) {
    Write-Output "BOM stripped from $fixed file(s) under $root"
}
