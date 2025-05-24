const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const xss = require('xss-clean');

// Input sanitization middleware
const sanitizeInput = (handler) => async (event) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Sanitizing input`);

  try {
    // Sanitize headers
    const sanitizedHeaders = {};
    for (const [key, value] of Object.entries(event.headers || {})) {
      sanitizedHeaders[key.toLowerCase()] = xss(value);
    }
    event.headers = sanitizedHeaders;

    // Sanitize query parameters
    if (event.queryStringParameters) {
      const sanitizedQuery = {};
      for (const [key, value] of Object.entries(event.queryStringParameters)) {
        sanitizedQuery[key] = xss(value);
      }
      event.queryStringParameters = sanitizedQuery;
    }

    // Sanitize path parameters
    if (event.pathParameters) {
      const sanitizedPath = {};
      for (const [key, value] of Object.entries(event.pathParameters)) {
        sanitizedPath[key] = xss(value);
      }
      event.pathParameters = sanitizedPath;
    }

    // Sanitize body
    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        const sanitizedBody = sanitizeObject(body);
        event.body = JSON.stringify(sanitizedBody);
      } catch (error) {
        // If body is not JSON, sanitize as string
        event.body = xss(event.body);
      }
    }

    return handler(event);
  } catch (error) {
    console.error(`[${requestId}] Input sanitization error:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        requestId
      })
    };
  }
};

// CORS middleware
const cors = (handler) => async (event) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Handling CORS`);

  try {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    const origin = event.headers?.origin || event.headers?.Origin;

    // Check if origin is allowed
    if (origin && !allowedOrigins.includes('*') && !allowedOrigins.includes(origin)) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: 'CORS not allowed',
          requestId
        })
      };
    }

    const result = await handler(event);

    // Add CORS headers to response
    return {
      ...result,
      headers: {
        ...result.headers,
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT,DELETE',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
      }
    };
  } catch (error) {
    console.error(`[${requestId}] CORS error:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        requestId
      })
    };
  }
};

// Security headers middleware
const securityHeaders = (handler) => async (event) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Adding security headers`);

  try {
    const result = await handler(event);

    // Add security headers
    return {
      ...result,
      headers: {
        ...result.headers,
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    };
  } catch (error) {
    console.error(`[${requestId}] Security headers error:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        requestId
      })
    };
  }
};

// Token validation middleware
const validateToken = (handler) => async (event) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Validating token`);

  try {
    const token = event.headers?.Authorization?.split(' ')[1];
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'No token provided',
          requestId
        })
      };
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to event
    event.user = decoded;

    return handler(event);
  } catch (error) {
    console.error(`[${requestId}] Token validation error:`, error);
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Invalid token',
        requestId
      })
    };
  }
};

// Helper function to sanitize objects recursively
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return xss(obj);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = xss(value);
    }
  }
  return sanitized;
};

module.exports = {
  sanitizeInput,
  cors,
  securityHeaders,
  validateToken
}; 