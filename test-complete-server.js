const http = require('http');

// Complete test server to handle all necessary endpoints
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

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    // Log request details
    console.log(`\n=== NEW REQUEST ===`);
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Request body:', body);
    console.log('===================\n');

    // Route handling
    if (req.method === 'POST' && req.url === '/api/auth/register') {
      console.log('\n=== HANDLING REGISTER REQUEST ===');
      console.log('Raw body:', body);
      try {
        const data = JSON.parse(body);
        console.log('Parsed data:', data);
        const userId = 'mock-id-' + Math.random().toString(36).substr(2, 9);
        console.log('Generated userId:', userId);

        const response = {
          success: true,
          message: 'Registration successful',
          data: { userId }
        };

        console.log('Sending response:', response);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        console.log('=== REGISTER REQUEST COMPLETED ===\n');
      } catch (error) {
        console.error('Error parsing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid request data' }));
        console.log('=== REGISTER REQUEST FAILED ===\n');
      }
    } else if (req.method === 'POST' && req.url === '/api/auth/login') {
      try {
        const data = JSON.parse(body);
        const userId = 'mock-id-' + Math.random().toString(36).substr(2, 9);

        const response = {
          success: true,
          message: 'Login successful',
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
    } else if (req.method === 'POST' && req.url === '/api/auth/verify-otp') {
      try {
        const data = JSON.parse(body);
        const token = 'mock-token-' + Math.random().toString(36).substr(2, 9);

        const response = {
          success: true,
          message: 'OTP verification successful',
          data: { 
            token: token,
            user: { 
              userType: 'CUSTOMER'
            }
          }
        };

        console.log('Sending response:', response);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error('Error parsing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid request data' }));
      }
    } else if (req.method === 'POST' && req.url === '/api/auth/resend-otp') {
      try {
        const data = JSON.parse(body);

        const response = {
          success: true,
          message: 'OTP resent successfully'
        };

        console.log('Sending response:', response);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error('Error parsing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid request data' }));
      }
    } else if (req.method === 'GET' && req.url === '/api/user') {
      try {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
        }

        const response = {
          success: true,
          data: {
            name: 'Test User',
            balance: '100.00',
            activeOrders: 2,
            unreadNotifications: 3
          }
        };

        console.log('Sending response:', response);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error('Error handling request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Server error' }));
      }
    } else if (req.method === 'POST' && req.url.startsWith('/api/auth/')) {
    // Generic handler for any auth endpoint
    try {
      const data = JSON.parse(body);
      const userId = 'mock-id-' + Math.random().toString(36).substr(2, 9);
      const endpoint = req.url.split('/').pop();
      
      const response = {
        success: true,
        message: `${endpoint} successful`,
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
      console.log('\n=== ENDPOINT NOT FOUND ===');
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Headers:', req.headers);
      console.log('Body:', body);
      console.log('=========================\n');
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: `Endpoint not found: ${req.method} ${req.url}` }));
    }
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log('\n========================================');
  console.log(`Complete test server running at http://localhost:${PORT}`);
  console.log('Server is ready to handle requests...');
  console.log('========================================\n');
});
