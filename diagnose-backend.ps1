.\start-backend-no-db.ps1
# ServoLeY Backend Diagnostic Tool (PowerShell Version)
Write-Host "====================================="
Write-Host " ServoLeY Backend Diagnostic Tool"
Write-Host "====================================="

# Check Node.js installation
Write-Host "Checking Node.js installation..."
try {
    $nodeVersion = node --version
    Write-Host "Node.js is installed: $nodeVersion"
} catch {
    Write-Host "Node.js is not installed or not in PATH"
    Write-Host "Please install Node.js and add it to PATH"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if PostgreSQL is running
Write-Host "Checking if PostgreSQL is running..."
$pgRunning = netstat -an | Select-String ":5432"
if (-not $pgRunning) {
    Write-Host "PostgreSQL is not running on port 5432"
    Write-Host "Please start PostgreSQL service"
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Host "PostgreSQL is running on port 5432"
}

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
Write-Host "Environment file created"

# Test database connection
Write-Host "Testing database connection..."
$dbTest = node test-db-connection.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Database connection test failed"
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

# Start simple server first
Write-Host "Starting simple test server..."
Start-Process -FilePath "cmd" -ArgumentList "/k", "node server-simple.js"
Write-Host "Simple server started at http://localhost:8080"
Write-Host "Waiting for server to initialize..."
Start-Sleep -Seconds 5

# Test simple server
Write-Host "Testing simple server..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing
    Write-Host "Simple server is working correctly"
} catch {
    Write-Host "Failed to connect to simple server"
    Read-Host "Press Enter to exit"
    exit 1
}

# Start full server
Write-Host "Starting full server with database connection..."
Start-Process -FilePath "cmd" -ArgumentList "/k", "node server.js"
Write-Host "Full server started at http://localhost:8080"
Write-Host "Waiting for server to initialize..."
Start-Sleep -Seconds 5

# Test full server
Write-Host "Testing full server..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing
    Write-Host "Full server is working correctly"
} catch {
    Write-Host "Failed to connect to full server"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "====================================="
Write-Host "All tests completed successfully"
Write-Host "Servers are running:"
Write-Host "- Simple test server: http://localhost:8080"
Write-Host "- Full backend server: http://localhost:8080"
Write-Host "====================================="
Read-Host "Press Enter to exit"
