const { verifyToken } = require('./security');
const { formatError, formatResponse, logRequest, logError, generateRequestId } = require('./utils');

// Request validation middleware
const customValidateRequest = (schema) => async (event) => {
  const requestId = generateRequestId();
  logRequest('Validating request', requestId);

  try {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      return formatError(400, 'Invalid JSON in request body', requestId);
    }

    // Validate against schema if provided
    if (schema) {
      const { error } = schema.validate(body);
      if (error) {
        return formatError(400, error.details[0].message, requestId);
      }
    }

    return { body, requestId };
  } catch (error) {
    logError('Validation error', error, requestId);
    return formatError(500, 'Internal server error', requestId);
  }
};

// Error handling middleware
const customErrorHandler = (handler) => async (event) => {
  const requestId = generateRequestId();
  logRequest('Starting request', requestId);

  try {
    const result = await handler(event);
    logRequest('Request completed successfully', requestId);
    return result;
  } catch (error) {
    logError('Error', error, requestId);
    return formatError(error.statusCode || 500, error.message || 'Internal server error', requestId);
  }
};

// Authentication middleware
const authenticate = (handler) => async (event) => {
  const requestId = generateRequestId();
  logRequest('Authenticating request', requestId);

  try {
    const token = event.headers.Authorization?.split(' ')[1];
    if (!token) {
      return formatError(401, 'No token provided', requestId);
    }

    // Verify token and add user to event
    const user = await verifyToken(token);
    if (!user) {
      return formatError(401, 'Invalid token', requestId);
    }

    // Add user to event for handler to use
    event.user = user;
    return handler(event);
  } catch (error) {
    logError('Authentication error', error, requestId);
    return formatError(401, 'Authentication failed', requestId);
  }
};

// Combine multiple middleware
const customCompose = (...middlewares) => (handler) => {
  return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
};

module.exports = {
  validateRequest: customValidateRequest,
  errorHandler: customErrorHandler,
  authenticate,
  compose: customCompose
}; 