$ErrorActionPreference = "Stop"
$host_ = "41.215.240.140"
$user = "root"
$keyPath = Join-Path $PSScriptRoot ".ssh-deploy\quickpostads_deploy"
$cmd = "cd /var/www/quickpostads && git pull origin main && npm install --production && pm2 restart quickpostads && pm2 status quickpostads && curl -sf http://127.0.0.1:3000/api/health"

$sshArgs = @("-o", "ConnectTimeout=15", "-o", "StrictHostKeyChecking=accept-new")
if (Test-Path $keyPath) {
  $sshArgs += @("-i", $keyPath, "-o", "BatchMode=yes")
}

Write-Host "Deploying to ${user}@${host_} ..." -ForegroundColor Cyan
& ssh @sshArgs "${user}@${host_}" $cmd
if ($LASTEXITCODE -ne 0) {
  if (Test-Path $keyPath) {
    Write-Host ""
    Write-Host "SSH key deploy failed. Run once: .\install-deploy-key.ps1" -ForegroundColor Yellow
    Write-Host "(Enter VPS root password one time — then deploy works automatically.)" -ForegroundColor Yellow
  }
  exit $LASTEXITCODE
}
Write-Host "Deploy OK — https://www.quickpostads.co.uk" -ForegroundColor Green
