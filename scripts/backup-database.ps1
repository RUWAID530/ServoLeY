param(
  [string]$BackupDir = $env:DATABASE_BACKUP_DIR,
  [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"

function Get-EnvValueFromFile {
  param(
    [string]$FilePath,
    [string]$Key
  )

  if (-not (Test-Path $FilePath)) {
    return $null
  }

  $line = Get-Content $FilePath | Where-Object { $_ -match "^\s*$Key\s*=" } | Select-Object -First 1
  if (-not $line) {
    return $null
  }

  $value = ($line -split "=", 2)[1].Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  return $value
}

if (-not $BackupDir -or $BackupDir.Trim().Length -eq 0) {
  $BackupDir = Join-Path $PSScriptRoot "..\backups\db"
}

if (-not (Test-Path $BackupDir)) {
  New-Item -Path $BackupDir -ItemType Directory -Force | Out-Null
}

if (-not $env:DATABASE_URL) {
  $projectEnvPath = Join-Path $PSScriptRoot "..\.env"
  $fileDatabaseUrl = Get-EnvValueFromFile -FilePath $projectEnvPath -Key "DATABASE_URL"
  if ($fileDatabaseUrl) {
    $env:DATABASE_URL = $fileDatabaseUrl
  }
}

if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL is not set. Set it in environment or .env file."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $BackupDir "servoley-$timestamp.dump"

Write-Host "Creating PostgreSQL backup: $backupFile"
pg_dump --dbname="$env:DATABASE_URL" --format=custom --file="$backupFile" --no-owner --no-privileges

Write-Host "Backup created: $backupFile"

if ($RetentionDays -gt 0) {
  $cutoff = (Get-Date).AddDays(-$RetentionDays)
  Get-ChildItem -Path $BackupDir -Filter "*.dump" |
    Where-Object { $_.LastWriteTime -lt $cutoff } |
    Remove-Item -Force
  Write-Host "Retention cleanup complete. Removed backups older than $RetentionDays days."
}
