const express = require('express');
const cors = require('cors');
const app = express();
const port = 8084;

// Middleware
app.use(cors());
app.use(express.json());

// Mock provider login endpoint
app.post('/provider/login', (req, res) => {
  const { email, password } = req.body;

  // For now, accept any valid email and password combination
  // In a real app, you would validate against a database
  if (email && password) {
    // Generate a mock token
    const token = 'provider-token-' + Date.now();

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: token,
        user: {
          id: 'provider-' + Date.now(),
          email: email
        },
        provider: {
          id: 'provider-' + Date.now(),
          email: email
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Mock auth login endpoint for customer/admin
app.post('/api/auth/login', (req, res) => {
  const { phone, email, password, userType } = req.body;

  // For now, accept any valid credentials
  // In a real app, you would validate against a database
  if ((email || phone) && password) {
    // Generate a mock token
    const token = 'auth-token-' + Date.now();

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: token,
        user: {
          id: userType.toLowerCase() + '-' + Date.now(),
          userType: userType,
          email: email,
          phone: phone
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Mock profile endpoint
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    // Return mock user data
    res.json({
      success: true,
      data: {
        id: 'mock-provider-id',
        name: 'Mock Provider',
        email: 'provider@example.com',
        phone: '1234567890',
        userType: 'PROVIDER',
        provider: {
          id: 'mock-provider-id',
          name: 'Mock Provider',
          email: 'provider@example.com',
          phone: '1234567890',
          services: [],
          rating: 4.5,
          reviews: []
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Mock server running at http://localhost:${port}`);
});
