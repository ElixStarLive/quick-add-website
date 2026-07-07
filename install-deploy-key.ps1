# One-time: add deploy key to VPS (enter root password once)
$ErrorActionPreference = "Stop"
$host_ = "41.215.240.140"
$keyPath = Join-Path $PSScriptRoot ".ssh-deploy\quickpostads_deploy"
$pubPath = "$keyPath.pub"

if (-not (Test-Path $pubPath)) {
  Write-Host "Missing $pubPath"
  exit 1
}

$pub = (Get-Content $pubPath -Raw).Trim()
Write-Host "Adding deploy key to $host_ (enter VPS root password once)..." -ForegroundColor Cyan
$remote = "mkdir -p ~/.ssh; chmod 700 ~/.ssh; echo $pub >> ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys; echo KEY_OK"
ssh -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new "root@$host_" $remote
if ($LASTEXITCODE -eq 0) {
  Write-Host "Deploy key installed. Run .\deploy.ps1 anytime." -ForegroundColor Green
}
