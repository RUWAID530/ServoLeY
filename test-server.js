const http = require('http');

// Simple server to test connectivity
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Log request details
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    console.log('Body:', body);

    // Route handling
    if (req.method === 'POST' && req.url === '/api/auth/register') {
      try {
        const data = JSON.parse(body);
        const userId = 'mock-id-' + Math.random().toString(36).substr(2, 9);

        const response = {
          success: true,
          message: 'Registration successful',
          data: { userId }
        };

        console.log('Sending response:', response);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error('Error parsing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid request data' }));
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Endpoint not found' }));
    }
  });
});

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Ready to handle requests...');
});
