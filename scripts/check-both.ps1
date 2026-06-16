$ErrorActionPreference = "Stop"

$frontend = Split-Path -Parent $PSScriptRoot
$root = Split-Path -Parent $frontend
$runner = Join-Path $root "scripts\check-both.ps1"

& powershell -ExecutionPolicy Bypass -File $runner
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
