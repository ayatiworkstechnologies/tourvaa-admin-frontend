param(
  [string]$BaseUrl = "",
  [ValidateSet("all", "public", "admin")]
  [string]$Group = "all",
  [int]$Port = 3100
)

$ErrorActionPreference = "Stop"

$frontend = Split-Path -Parent $PSScriptRoot
$root = Split-Path -Parent $frontend
$runner = Join-Path $root "scripts\frontend-ui-tests.ps1"

$argsList = @("-ExecutionPolicy", "Bypass", "-File", $runner, "-Group", $Group, "-Port", $Port)
if ($BaseUrl) {
  $argsList += "-BaseUrl"
  $argsList += $BaseUrl
}

& powershell @argsList
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
