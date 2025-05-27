const { formatError, generateRequestId } = require('./utils');

const checkRole = (allowedRoles) => (handler) => async (event) => {
  const requestId = generateRequestId();
  const { user } = event;
  
  if (!user || !user.role) {
    return formatError(403, 'Access denied: User role not found', requestId);
  }

  if (!allowedRoles.includes(user.role)) {
    return formatError(403, 'Access denied: Insufficient permissions', requestId);
  }

  return handler(event);
};

const isAdmin = (handler) => checkRole(['admin'])(handler);
const isResident = (handler) => checkRole(['resident'])(handler);
const isAdminOrResident = (handler) => checkRole(['admin', 'resident'])(handler);

module.exports = {
  checkRole,
  isAdmin,
  isResident,
  isAdminOrResident
}; 