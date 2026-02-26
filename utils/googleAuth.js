const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google OAuth token and extract user information
 * @param {string} token - Google OAuth token
 * @returns {Promise<Object>} - User information from Google
 */
const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // Your Google Client ID
    });

    const payload = ticket.getPayload();
    
    // Extract user information
    const userInfo = {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      name: payload.name,
      firstName: payload.given_name,
      lastName: payload.family_name,
      picture: payload.picture,
      domain: payload.hd // This will be 'gmail.com' for Gmail users
    };

    // Verify it's a Gmail account
    if (!userInfo.emailVerified) {
      throw new Error('Email is not verified by Google');
    }

    if (!userInfo.email.endsWith('@gmail.com')) {
      throw new Error('Only Gmail accounts are allowed');
    }

    return {
      success: true,
      data: userInfo
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    return {
      success: false,
      message: error.message || 'Invalid Google token'
    };
  }
};

/**
 * Verify Gmail address format and domain
 * @param {string} email - Email address to verify
 * @returns {Object} - Verification result
 */
const verifyGmailFormat = (email) => {
  if (!email) {
    return {
      success: false,
      message: 'Email is required'
    };
  }

  // Check if it's a valid Gmail address
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(email)) {
    return {
      success: false,
      message: 'Only Gmail addresses are allowed (@gmail.com)'
    };
  }

  // Additional Gmail format validation
  const localPart = email.split('@')[0];
  
  // Gmail doesn't allow consecutive dots
  if (localPart.includes('..')) {
    return {
      success: false,
      message: 'Gmail addresses cannot contain consecutive dots'
    };
  }

  // Gmail local part can't start or end with dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      success: false,
      message: 'Gmail addresses cannot start or end with a dot'
    };
  }

  return {
    success: true,
    message: 'Valid Gmail format'
  };
};

module.exports = {
  verifyGoogleToken,
  verifyGmailFormat
};
