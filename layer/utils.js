const { v4: uuidv4 } = require('uuid');

// Common response formatter
const formatResponse = (statusCode, body, requestId = uuidv4()) => ({
  statusCode,
  body: JSON.stringify({
    ...body,
    requestId
  })
});

// Error response formatter
const formatError = (statusCode, message, requestId = uuidv4()) => 
  formatResponse(statusCode, { message }, requestId);

// Request logger
const logRequest = (message, requestId) => {
  console.log(`[${requestId}] ${message}`);
};

// Error logger
const logError = (message, error, requestId) => {
  console.error(`[${requestId}] ${message}:`, error);
  if (error.stack) {
    console.error(`[${requestId}] Stack:`, error.stack);
  }
};

// Generate new request ID
const generateRequestId = () => uuidv4();

module.exports = {
  formatResponse,
  formatError,
  logRequest,
  logError,
  generateRequestId
}; 