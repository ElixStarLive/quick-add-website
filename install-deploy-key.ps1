# One-time: add deploy key to VPS (enter root password once)
$ErrorActionPreference = "Stop"
$host_ = "41.215.240.140"
$keyPath = Join-Path $PSScriptRoot ".ssh-deploy\quickpostads_deploy"
$pubPath = "$keyPath.pub"

if (-not (Test-Path $pubPath)) {
  Write-Host "Missing $pubPath — run from project folder." -ForegroundColor Red
  exit 1
}

$pub = (Get-Content $pubPath -Raw).Trim()
Write-Host "Adding deploy key to $host_ (password required once)..." -ForegroundColor Cyan
$remote = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && grep -qF '$pub' ~/.ssh/authorized_keys 2>/dev/null || echo '$pub' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo KEY_OK"
ssh "root@$host_" $remote
if ($LASTEXITCODE -eq 0) {
  Write-Host "Deploy key installed. You can now run .\deploy.ps1 without a password." -ForegroundColor Green
}
