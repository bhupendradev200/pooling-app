const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SignJWT, jwtVerify } = require('jose');
const { v4: uuidv4 } = require('uuid');
const { putItem, getItem, updateItem } = require('./dynamodb');

const sesClient = new SESClient({});
const snsClient = new SNSClient({});

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via email
const sendEmailOTP = async (email, otp) => {
  const params = {
    Source: 'noreply@yourdomain.com', // Replace with your verified SES email
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: 'Your OTP for Society Voting App',
      },
      Body: {
        Text: {
          Data: `Your OTP is: ${otp}. This OTP is valid for 5 minutes.`,
        },
      },
    },
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    return true;
  } catch (error) {
    console.error('Error sending email OTP:', error);
    return false;
  }
};

// Send OTP via SMS
const sendSMSOTP = async (mobile, otp) => {
  const params = {
    Message: `Your OTP for Society Voting App is: ${otp}. This OTP is valid for 5 minutes.`,
    PhoneNumber: mobile,
  };

  try {
    await snsClient.send(new PublishCommand(params));
    return true;
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    return false;
  }
};

// Store OTP in DynamoDB
const storeOTP = async (identifier, otp) => {
  const otpData = {
    identifier,
    otp,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes expiry
  };

  await putItem(process.env.DYNAMODB_TABLE_OTP, otpData);
};

// Verify OTP
const verifyOTP = async (identifier, otp) => {
  const otpData = await getItem(process.env.DYNAMODB_TABLE_OTP, { identifier });
  
  if (!otpData) {
    return false;
  }

  if (otpData.otp !== otp) {
    return false;
  }

  if (new Date(otpData.expires_at) < new Date()) {
    return false;
  }

  // Delete used OTP
  await updateItem(
    process.env.DYNAMODB_TABLE_OTP,
    { identifier },
    'SET is_used = :is_used',
    { ':is_used': true }
  );

  return true;
};

// Generate JWE token
const generateToken = async (user) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
  const token = await new SignJWT({
    sub: user.mobile,
    role: user.role,
    flat_id: user.flat_id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  return token;
};

// Verify JWE token
const verifyToken = async (token) => {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

module.exports = {
  generateOTP,
  sendEmailOTP,
  sendSMSOTP,
  storeOTP,
  verifyOTP,
  generateToken,
  verifyToken,
}; 