const { checkExact, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array()
  });
};

const strictBody = (validators) => [
  ...validators,
  // Reject any unexpected body fields that do not have validators.
  checkExact([], { locations: ['body'], message: 'Unexpected fields in request body' }),
  validateRequest
];

module.exports = {
  validateRequest,
  strictBody
};
