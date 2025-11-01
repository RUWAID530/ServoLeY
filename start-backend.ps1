# ServoLeY Backend Server Starter (PowerShell Version)
Write-Host "====================================="
Write-Host " Starting Backend Server Only"
Write-Host "====================================="

# Set up environment variables
$env:NODE_ENV = "development"
$env:BYPASS_OTP = "true"
$env:PORT = "8080"

# Create environment file
Write-Host "Creating environment file..."
"NODE_ENV=development" | Out-File -FilePath ".env" -Encoding utf8
"DATABASE_URL=`"postgresql://MOHAMMED RUWAIH:RUWAITH123@localhost:5432/servoley_db`"" | Out-File -FilePath ".env" -Encoding utf8 -Append
"JWT_SECRET=`"your-super-secret-jwt-key-786786`"" | Out-File -FilePath ".env" -Encoding utf8 -Append
"JWT_EXPIRES_IN=`"7d`"" | Out-File -FilePath ".env" -Encoding utf8 -Append
"OTP_EXPIRES_IN=`"300`"" | Out-File -FilePath ".env" -Encoding utf8 -Append
"OTP_LENGTH=`"6`"" | Out-File -FilePath ".env" -Encoding utf8 -Append
"BYPASS_OTP=true" | Out-File -FilePath ".env" -Encoding utf8 -Append
"PORT=8080" | Out-File -FilePath ".env" -Encoding utf8 -Append

# Check if PostgreSQL is running
Write-Host "Checking if PostgreSQL is running..."
$pgRunning = netstat -an | Select-String ":5432"
if (-not $pgRunning) {
    Write-Host "PostgreSQL is not running on port 5432"
    Write-Host "Please start PostgreSQL service and try again"
    Read-Host "Press Enter to exit"
    exit 1
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
Write-Host "Starting backend server..."
Write-Host "====================================="
try {
    node server.js
} catch {
    Write-Host "Error starting server: $_"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "====================================="
Write-Host "Backend server stopped"
Read-Host "Press Enter to exit"
