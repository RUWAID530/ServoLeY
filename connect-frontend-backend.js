const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuration
const config = {
  backend: {
    port: 8080,
    dir: path.join(__dirname),
    script: 'server.js'
  },
  frontend: {
    port: 8081,
    dir: path.join(__dirname, 'customer-pwa'),
    script: 'dev'
  }
};

// Function to update API_BASE in frontend
function updateApiBase() {
  try {
    const appPath = path.join(config.frontend.dir, 'src', 'App.tsx');
    let content = fs.readFileSync(appPath, 'utf8');

    // Update API_BASE to point to backend
    const newApiBase = `export const API_BASE = 'http://localhost:${config.backend.port}'`;
    content = content.replace(/export const API_BASE = ['"]http[^'"]*['"]/, newApiBase);

    fs.writeFileSync(appPath, content);
    console.log(`✅ Updated API_BASE to http://localhost:${config.backend.port}`);
  } catch (error) {
    console.error('❌ Error updating API_BASE:', error.message);
  }
}

// Function to update CORS in backend
function updateCors() {
  try {
    const serverPath = path.join(config.backend.dir, 'server.js');
    let content = fs.readFileSync(serverPath, 'utf8');

    // Update CORS to include frontend URL
    const newCorsOrigin = `origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:${config.backend.port}', 'http://localhost:${config.frontend.port}']`;
    content = content.replace(/origin:\s*process\.env\.CORS_ORIGIN\?\.split\([^)]*\)\s*\|\|\s*\[[^\]]*\]/, newCorsOrigin);

    fs.writeFileSync(serverPath, content);
    console.log(`✅ Updated CORS to include http://localhost:${config.frontend.port}`);
  } catch (error) {
    console.error('❌ Error updating CORS:', error.message);
  }
}

// Function to check if a port is in use
async function isPortInUse(port) {
  try {
    await execAsync(`netstat -ano | findstr :${port}`);
    return true;
  } catch (error) {
    return false;
  }
}

// Function to start the backend server
async function startBackend() {
  console.log('🚀 Starting backend server...');
  try {
    // Change to backend directory and start server
    process.chdir(config.backend.dir);
    const backend = exec(`node ${config.backend.script}`);

    backend.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });

    backend.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backend.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });

    // Wait a bit for the server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log(`✅ Backend server started on port ${config.backend.port}`);
    return backend;
  } catch (error) {
    console.error('❌ Error starting backend:', error.message);
    return null;
  }
}

// Function to start the frontend server
async function startFrontend() {
  console.log('🚀 Starting frontend server...');
  try {
    // Change to frontend directory and start dev server
    process.chdir(config.frontend.dir);
    const frontend = exec(`npm run ${config.frontend.script}`);

    frontend.stdout.on('data', (data) => {
      console.log(`Frontend: ${data}`);
    });

    frontend.stderr.on('data', (data) => {
      console.error(`Frontend Error: ${data}`);
    });

    frontend.on('close', (code) => {
      console.log(`Frontend process exited with code ${code}`);
    });

    console.log(`✅ Frontend server started on port ${config.frontend.port}`);
    return frontend;
  } catch (error) {
    console.error('❌ Error starting frontend:', error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('🔧 Connecting Frontend and Backend...');
  console.log('=====================================');

  // Update API_BASE and CORS
  updateApiBase();
  updateCors();

  // Check if ports are in use
  const backendPortInUse = await isPortInUse(config.backend.port);
  const frontendPortInUse = await isPortInUse(config.frontend.port);

  if (backendPortInUse) {
    console.log(`⚠️ Port ${config.backend.port} is already in use. Please stop the process using this port.`);
  }

  if (frontendPortInUse) {
    console.log(`⚠️ Port ${config.frontend.port} is already in use. Please stop the process using this port.`);
  }

  if (backendPortInUse || frontendPortInUse) {
    console.log('❌ Cannot start servers due to port conflicts. Please resolve the conflicts and try again.');
    return;
  }

  // Start servers
  const backend = await startBackend();
  if (!backend) {
    console.log('❌ Failed to start backend server. Exiting...');
    return;
  }

  const frontend = await startFrontend();
  if (!frontend) {
    console.log('❌ Failed to start frontend server. Exiting...');
    backend.kill();
    return;
  }

  console.log('=====================================');
  console.log('✅ Frontend and Backend are now connected!');
  console.log(`📱 Frontend: http://localhost:${config.frontend.port}`);
  console.log(`🔧 Backend: http://localhost:${config.backend.port}`);
  console.log('=====================================');

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    if (backend) backend.kill();
    if (frontend) frontend.kill();
    process.exit(0);
  });
}

// Run the main function
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
