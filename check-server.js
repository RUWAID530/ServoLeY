const axios = require('axios');

async function testServer() {
  try {
    console.log('Testing server connection...');

    // Test basic connection
    const testResponse = await axios.get('http://localhost:8080/test');
    console.log('Test endpoint response:', testResponse.data);

    // Test register endpoint
    const registerData = {
      userType: 'CUSTOMER',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const registerResponse = await axios.post('http://localhost:8080/api/auth/register', registerData);
    console.log('Register response:', registerResponse.data);

  } catch (error) {
    console.error('Error testing server:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

testServer();
