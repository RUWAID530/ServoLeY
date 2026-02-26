// Standardized error response utility with production-safe responses
const createErrorResponse = (res, statusCode, message, error = null) => {
  const response = {
    success: false,
    message
  };

  // Only include error details in development
  if (process.env.NODE_ENV !== 'production' && error) {
    response.error = {
      type: error.name || 'UnknownError',
      details: error.message
    };
  }

  return res.status(statusCode).json(response);
};

// Safe error handler that prevents information leakage
const safeErrorHandler = (error, req, res, next) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Don't expose internal error details to clients
  const statusCode = error.statusCode || 500;
  const message = statusCode < 500 ? error.message : 'Internal server error';

  return createErrorResponse(res, statusCode, message, process.env.NODE_ENV !== 'production' ? error : null);
};

// Validation error handler
const validationErrorHandler = (errors, req, res) => {
  const message = 'Validation failed';
  const errorDetails = errors.array().map(err => ({
    field: err.path || err.param,
    message: err.msg,
    value: err.value
  }));

  const response = {
    success: false,
    message,
    errors: errorDetails
  };

  return res.status(400).json(response);
};

// Sanitize error messages for production
const sanitizeErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (process.env.NODE_ENV === 'production') {
    // Don't expose internal error details in production
    if (error.statusCode && error.statusCode < 500) {
      return error.message; // Client errors can be shown
    }
    return defaultMessage;
  }
  return error.message || defaultMessage;
};

// Safe error response helper
const createSafeErrorResponse = (res, error, defaultMessage = 'An error occurred') => {
  const statusCode = error.statusCode || 500;
  const message = sanitizeErrorMessage(error, defaultMessage);
  
  return createErrorResponse(res, statusCode, message, process.env.NODE_ENV !== 'production' ? error : null);
};

module.exports = {
  createErrorResponse,
  safeErrorHandler,
  validationErrorHandler,
  sanitizeErrorMessage,
  createSafeErrorResponse
};
