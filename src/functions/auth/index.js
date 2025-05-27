const { getItem, query, scan } = require('/opt/nodejs/dynamodb');
const {
  generateOTP,
  sendEmailOTP,
  sendSMSOTP,
  storeOTP,
  verifyOTP,
  generateToken,
} = require('/opt/nodejs/utils');
const { 
  validateRequest, 
  errorHandler, 
  formatResponse, 
  compose 
} = require('/opt/nodejs/middleware');
const {
  sanitizeInput,
  cors,
  securityHeaders,
  validateToken
} = require('/opt/nodejs/security');

// Update queryGSI to use query
const queryGSI = async (gsiPK, gsiSKBeginsWith = null) => {
  let KeyConditionExpression = 'GSI1PK = :gsiPK';
  let ExpressionAttributeValues = { ':gsiPK': gsiPK };
  
  if (gsiSKBeginsWith) {
    KeyConditionExpression += ' AND begins_with(GSI1SK, :gsiSK)';
    ExpressionAttributeValues[':gsiSK'] = gsiSKBeginsWith;
  }

  const params = {
    TableName: process.env.DYNAMODB_MAIN_TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression,
    ExpressionAttributeValues,
  };

  const response = await query(params);
  return response.Items;
};

// Update queryItems to use query
const queryItems = async (pk, skBeginsWith = null, indexName = null) => {
  let KeyConditionExpression = 'PK = :pk';
  let ExpressionAttributeValues = { ':pk': pk };
  
  if (skBeginsWith) {
    KeyConditionExpression += ' AND begins_with(SK, :sk)';
    ExpressionAttributeValues[':sk'] = skBeginsWith;
  }

  const params = {
    TableName: process.env.DYNAMODB_MAIN_TABLE,
    KeyConditionExpression,
    ExpressionAttributeValues,
    ...(indexName && { IndexName: indexName }),
  };

  const response = await query(params);
  return response.Items;
};

// Request OTP handler
const requestOTPHandler = async (event) => {
  const { body, requestId } = event;
  const { identifier, type } = body;

  // Business Logic
  let user = null;
  if (type === 'email') {
    const users = await queryGSI(`EMAIL#${identifier}`, 'METADATA');
    user = users[0];
  } else {
    user = await getItem({
      TableName: process.env.DYNAMODB_MAIN_TABLE,
      Key: {
        PK: `USER#${identifier}`,
        SK: 'METADATA'
      }
    });
    user = user.Item;
  }

  if (!user) {
    return {
      statusCode: 404,
      body: JSON.stringify({ 
        message: 'User not found',
        requestId 
      }),
    };
  }

  // Generate and send OTP
  const otp = generateOTP();
  let otpSent = false;

  if (type === 'email') {
    otpSent = await sendEmailOTP(identifier, otp, requestId);
  } else {
    otpSent = await sendSMSOTP(identifier, otp, requestId);
  }

  if (!otpSent) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Failed to send OTP',
        requestId 
      }),
    };
  }

  // Store OTP
  await storeOTP(identifier, otp, requestId);

  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'OTP sent successfully',
      requestId 
    }),
  };
};

// Verify OTP and Login handler
const verifyOTPAndLoginHandler = async (event) => {
  const { body, requestId } = event;
  const { identifier, otp, type } = body;

  // Verify OTP
  const isValid = await verifyOTP(identifier, otp, requestId);
  if (!isValid) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        message: 'Invalid or expired OTP',
        requestId 
      }),
    };
  }

  // Get user details
  let user = null;
  if (type === 'email') {
    const users = await queryGSI(`EMAIL#${identifier}`, 'METADATA');
    user = users[0];
  } else {
    user = await getItem({
      TableName: process.env.DYNAMODB_MAIN_TABLE,
      Key: {
        PK: `USER#${identifier}`,
        SK: 'METADATA'
      }
    });
    user = user.Item;
  }

  if (!user) {
    return {
      statusCode: 404,
      body: JSON.stringify({ 
        message: 'User not found',
        requestId 
      }),
    };
  }

  // Get flat details
  const flatResult = await getItem({
    TableName: process.env.DYNAMODB_MAIN_TABLE,
    Key: {
      PK: `FLAT#${user.flat_id}`,
      SK: 'METADATA'
    }
  });
  const flat = flatResult.Item;
  if (!flat) {
    return {
      statusCode: 404,
      body: JSON.stringify({ 
        message: 'Flat details not found',
        requestId 
      }),
    };
  }

  // Get alternate numbers
  const alternateNumbers = await queryItems(
    `FLAT#${user.flat_id}`,
    'ALTERNATE#',
    'GSI1'
  );

  // Generate token
  const token = await generateToken(user);

  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
      user: {
        ...user,
        flat,
        alternate_numbers: alternateNumbers,
      },
      requestId
    }),
  };
};

// Export handlers with middleware
exports.requestOTP = compose(
  errorHandler,
  sanitizeInput,
  cors,
  securityHeaders,
  validateRequest(),
  formatResponse
)(requestOTPHandler);

exports.verifyOTPAndLogin = compose(
  errorHandler,
  sanitizeInput,
  cors,
  securityHeaders,
  validateRequest(),
  formatResponse
)(verifyOTPAndLoginHandler);