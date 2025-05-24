const { getItem } = require('../utils/dynamodb');

const checkAccess = async (user, url) => {
  // Admin has access to everything
  if (user.role === 'admin') {
    return true;
  }

  // Check page access permissions
  const pageAccess = await getItem(process.env.DYNAMODB_TABLE_PAGE_ACCESS, { url });
  
  if (!pageAccess || !pageAccess.is_publish) {
    return false;
  }

  return pageAccess.roles_allowed.includes(user.role);
};

const accessControlMiddleware = async (event, context, next) => {
  try {
    const user = event.requestContext.authorizer?.user;
    
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    const hasAccess = await checkAccess(user, event.path);
    
    if (!hasAccess) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Forbidden' }),
      };
    }

    return next(event, context);
  } catch (error) {
    console.error('Access control error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

module.exports = accessControlMiddleware; 