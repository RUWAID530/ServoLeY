param(
  [string]$TaskName = "ServoleyDailyDbBackup",
  [string]$Time = "02:00"
)

$scriptPath = Join-Path $PSScriptRoot "backup-database.ps1"
$command = "powershell -ExecutionPolicy Bypass -File `"$scriptPath`""

Write-Host "Registering scheduled task '$TaskName' at $Time"
schtasks /Create /TN $TaskName /TR $command /SC DAILY /ST $Time /F | Out-Null

Write-Host "Scheduled task created."
