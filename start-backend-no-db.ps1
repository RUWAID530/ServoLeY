# ServoLeY Backend Server Starter (No Database Version)
Write-Host "====================================="
Write-Host " Starting Backend Server (No DB)"
Write-Host "====================================="

# Set up environment variables
$env:NODE_ENV = "development"
$env:BYPASS_OTP = "true"
$env:PORT = "8080"

# Do not overwrite .env
if (-not (Test-Path ".env")) {
    Write-Host "WARNING: .env file not found. Configure environment variables before starting."
}

# Check if port 8080 is available
Write-Host "Checking if port 8080 is available..."
$portInUse = netstat -an | Select-String ":8080"
if ($portInUse) {
    Write-Host "Port 8080 is already in use"
    Write-Host "Stopping any existing processes on port 8080..."
    $processes = netstat -ano | Select-String ":8080"
    foreach ($process in $processes) {
        $parts = $process -split '\s+'
        $pid = $parts[-1]
        if ($pid -match '^\d+$') {
            Stop-Process -Id $pid -Force
        }
    }
    Start-Sleep -Seconds 2
}

# Start backend server
Write-Host "Starting backend server (No Database Mode)..."
Write-Host "====================================="
try {
    node server-no-db.js
} catch {
    Write-Host "Error starting server: $_"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "====================================="
Write-Host "Backend server stopped"
Read-Host "Press Enter to exit"
