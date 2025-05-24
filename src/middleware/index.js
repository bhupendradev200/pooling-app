const { v4: uuidv4 } = require('uuid');

// Request validation middleware
const validateRequest = (schema) => async (event) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Validating request`);

  try {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid JSON in request body',
          requestId
        })
      };
    }

    // Validate against schema if provided
    if (schema) {
      const { error } = schema.validate(body);
      if (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: error.details[0].message,
            requestId
          })
        };
      }
    }

    return { body, requestId };
  } catch (error) {
    console.error(`[${requestId}] Validation error:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        requestId
      })
    };
  }
};

// Error handling middleware
const errorHandler = (handler) => async (event) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Starting request`);

  try {
    const result = await handler(event);
    console.log(`[${requestId}] Request completed successfully`);
    return result;
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    console.error(`[${requestId}] Stack:`, error.stack);
    
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({
        message: error.message || 'Internal server error',
        requestId
      })
    };
  }
};

// Authentication middleware
const authenticate = (handler) => async (event) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Authenticating request`);

  try {
    const token = event.headers.Authorization?.split(' ')[1];
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'No token provided',
          requestId
        })
      };
    }

    // Verify token and add user to event
    const user = await verifyToken(token);
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'Invalid token',
          requestId
        })
      };
    }

    // Add user to event for handler to use
    event.user = user;
    return handler(event);
  } catch (error) {
    console.error(`[${requestId}] Authentication error:`, error);
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Authentication failed',
        requestId
      })
    };
  }
};

// Response formatting middleware
const formatResponse = (handler) => async (event) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Formatting response`);

  try {
    const result = await handler(event);
    
    // If result is already formatted, return it
    if (result.statusCode) {
      return result;
    }

    // Format successful response
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result,
        requestId
      })
    };
  } catch (error) {
    console.error(`[${requestId}] Response formatting error:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        requestId
      })
    };
  }
};

// Combine multiple middleware
const compose = (...middlewares) => (handler) => {
  return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
};

module.exports = {
  validateRequest,
  errorHandler,
  authenticate,
  formatResponse,
  compose
}; 