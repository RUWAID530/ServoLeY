
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Middleware to handle token refresh
const handleTokenRefresh = (req, res, next) => {
  // Store original request details
  const originalRequest = req;
  const originalConfig = req.config;

  // Override axios to intercept 401 responses
  if (req.app && req.app.get('axios')) {
    const axiosInstance = req.app.get('axios');

    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh the token yet
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Get refresh token from local storage or cookies
            const refreshToken = localStorage.getItem('refreshToken') || 
                              req.cookies?.refreshToken || 
                              req.headers['x-refresh-token'];

            if (!refreshToken) {
              throw error;
            }

            // Request new token pair
            const response = await axios.post('/api/auth/refresh', {
              refreshToken
            });

            if (response.data.success) {
              const { accessToken, refreshToken: newRefreshToken } = response.data.data;

              // Update tokens in storage
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);

              // Update the authorization header for the original request
              originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

              // Retry the original request
              return axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, redirect to login
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  next();
};

module.exports = { handleTokenRefresh };
