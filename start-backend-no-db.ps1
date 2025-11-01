# ServoLeY Backend Server Starter (No Database Version)
Write-Host "====================================="
Write-Host " Starting Backend Server (No DB)"
Write-Host "====================================="

# Set up environment variables
$env:NODE_ENV = "development"
$env:BYPASS_OTP = "true"
$env:PORT = "8080"

# Create environment file
Write-Host "Creating environment file..."
"NODE_ENV=development" | Out-File -FilePath ".env" -Encoding utf8
"JWT_SECRET=`"your-super-secret-jwt-key-786786`"" | Out-File -FilePath ".env" -Encoding utf8 -Append
"JWT_EXPIRES_IN=`"7d`"" | Out-File -FilePath ".env" -Encoding utf8 -Append
"OTP_EXPIRES_IN=`"300`"" | Out-File -FilePath ".env" -Encoding utf8 -Append
"OTP_LENGTH=`"6`"" | Out-File -FilePath ".env" -Encoding utf8 -Append
"BYPASS_OTP=true" | Out-File -FilePath ".env" -Encoding utf8 -Append
"PORT=8080" | Out-File -FilePath ".env" -Encoding utf8 -Append

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
