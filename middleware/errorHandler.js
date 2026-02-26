const { logger } = require('../utils/logger');

const redactSecrets = (value) => {
  const text = String(value || '');
  return text
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1[REDACTED]')
    .replace(/(api[_-]?key|secret|token|password)\s*[:=]\s*['"]?[^'",\s]+/gi, '$1=[REDACTED]');
};

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};

const errorHandler = (error, req, res, _next) => {
  const statusCode = Number(error?.statusCode || error?.status || 500);
  const isProduction = process.env.NODE_ENV === 'production';
  const isOperational = Boolean(error?.isOperational) || statusCode < 500;

  logger.error('Request failed', {
    statusCode,
    path: req.originalUrl,
    method: req.method,
    message: redactSecrets(error?.message),
    stack: redactSecrets(error?.stack)
  });

  const response = {
    success: false,
    message: isProduction && !isOperational ? 'Internal server error' : (error?.message || 'Internal server error')
  };

  if (!isProduction && error?.details) {
    response.details = error.details;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
