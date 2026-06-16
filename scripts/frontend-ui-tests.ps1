param(
  [string]$BaseUrl = "http://127.0.0.1:3000",
  [ValidateSet("all", "public", "admin")]
  [string]$Group = "all"
)

$ErrorActionPreference = "Stop"

$frontend = Split-Path -Parent $PSScriptRoot
$root = Split-Path -Parent $frontend
$runner = Join-Path $root "scripts\frontend-ui-tests.ps1"

& powershell -ExecutionPolicy Bypass -File $runner -BaseUrl $BaseUrl -Group $Group
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
