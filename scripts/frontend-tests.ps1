param(
  [switch]$SkipLint,
  [switch]$SkipTypecheck
)

$ErrorActionPreference = "Stop"

$frontend = Split-Path -Parent $PSScriptRoot
$root = Split-Path -Parent $frontend
$runner = Join-Path $root "scripts\frontend-tests.ps1"

$argsList = @("-ExecutionPolicy", "Bypass", "-File", $runner)
if ($SkipLint.IsPresent) {
  $argsList += "-SkipLint"
}
if ($SkipTypecheck.IsPresent) {
  $argsList += "-SkipTypecheck"
}

& powershell @argsList
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
