const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SignJWT, jwtVerify } = require('jose');
const { putItem, getItem, updateItem } = require('../../shared/dynamodb');

// Initialize AWS clients with default configuration
// This will use the Lambda execution role credentials automatically
const sesClient = new SESClient({ region: 'ap-south-1' });
const snsClient = new SNSClient({ region: 'ap-south-1' });

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via email
const sendEmailOTP = async (email, otp, requestId) => {
  try {
    console.log(`[${requestId}] Sending email OTP to:`, email);
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

    console.log(`[${requestId}] Email params:`, JSON.stringify(params, null, 2));
    
    // Check if SES client is properly configured
    console.log(`[${requestId}] SES Client config:`, {
      region: sesClient.config.region,
      credentials: sesClient.config.credentials ? 'Present' : 'Missing'
    });

    const result = await sesClient.send(new SendEmailCommand(params));
    console.log(`[${requestId}] Email sent successfully:`, JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error(`[${requestId}] Error sending email OTP:`, error);
    console.error(`[${requestId}] Error details:`, JSON.stringify(error, null, 2));
    console.error(`[${requestId}] Error stack:`, error.stack);
    return false;
  }
};

// Send OTP via SMS
const sendSMSOTP = async (mobile, otp, requestId) => {
  try {
    // Format mobile number to E.164 format
    const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;
    console.log(`[${requestId}] Original mobile:`, mobile);
    console.log(`[${requestId}] Formatted mobile:`, formattedMobile);
    
    const params = {
      Message: `Your OTP for Society Voting App is: ${otp}. This OTP is valid for 5 minutes.`,
      PhoneNumber: formattedMobile,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'SOCIETY'
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    };

    console.log(`[${requestId}] Sending SMS with params:`, JSON.stringify(params, null, 2));
    
    // Check if SNS client is properly configured
    console.log(`[${requestId}] SNS Client config:`, {
      region: snsClient.config.region,
      credentials: snsClient.config.credentials ? 'Present' : 'Missing'
    });

    const result = await snsClient.send(new PublishCommand(params));
    console.log(`[${requestId}] SMS sent successfully:`, JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error(`[${requestId}] Error sending SMS OTP:`, error);
    console.error(`[${requestId}] Error details:`, JSON.stringify(error, null, 2));
    console.error(`[${requestId}] Error stack:`, error.stack);
    return false;
  }
};

// Store OTP in DynamoDB
const storeOTP = async (identifier, otp, requestId) => {
  try {
    console.log(`[${requestId}] Storing OTP for:`, identifier);
    const otpData = {
      PK: `OTP#${identifier}`,
      SK: 'METADATA',
      otp,
      created_at: Date.now(),
      ttl: Math.floor(Date.now() / 1000) + 300, // 5 minutes expiry
    };

    console.log(`[${requestId}] OTP data to store:`, JSON.stringify(otpData, null, 2));
    await putItem(otpData);
    console.log(`[${requestId}] OTP stored successfully`);
    return true;
  } catch (error) {
    console.error(`[${requestId}] Error storing OTP:`, error);
    console.error(`[${requestId}] Error details:`, JSON.stringify(error, null, 2));
    console.error(`[${requestId}] Error stack:`, error.stack);
    return false;
  }
};

// Verify OTP
const verifyOTP = async (identifier, otp, requestId) => {
  try {
    console.log(`[${requestId}] Starting OTP verification for identifier:`, identifier);
    
    // Validate input
    if (!identifier || !otp) {
      console.log(`[${requestId}] Missing identifier or OTP`);
      return false;
    }

    // Get OTP data from DynamoDB
    console.log(`[${requestId}] Fetching OTP data for:`, identifier);
    const otpData = await getItem(`OTP#${identifier}`, 'METADATA');
    console.log(`[${requestId}] Retrieved OTP data:`, JSON.stringify(otpData, null, 2));
    
    if (!otpData) {
      console.log(`[${requestId}] No OTP found for identifier`);
      return false;
    }

    // Check if OTP is already used
    if (otpData.is_used) {
      console.log(`[${requestId}] OTP already used`);
      return false;
    }

    // Verify OTP value
    if (otpData.otp !== otp) {
      console.log(`[${requestId}] OTP mismatch. Expected: ${otpData.otp}, Received: ${otp}`);
      return false;
    }

    // Check OTP expiry
    const currentTime = Math.floor(Date.now() / 1000);
    if (otpData.ttl < currentTime) {
      console.log(`[${requestId}] OTP expired. Expiry: ${new Date(otpData.ttl * 1000)}, Current: ${new Date(currentTime * 1000)}`);
      return false;
    }

    // Mark OTP as used
    console.log(`[${requestId}] Marking OTP as used`);
    await updateItem(
      `OTP#${identifier}`,
      'METADATA',
      'SET is_used = :is_used, used_at = :used_at',
      { 
        ':is_used': true,
        ':used_at': currentTime
      }
    );
    console.log(`[${requestId}] OTP marked as used successfully`);

    return true;
  } catch (error) {
    console.error(`[${requestId}] Error verifying OTP:`, error);
    console.error(`[${requestId}] Error details:`, JSON.stringify(error, null, 2));
    console.error(`[${requestId}] Error stack:`, error.stack);
    return false;
  }
};

// Generate JWE token
const generateToken = async (user) => {
  const token = await new SignJWT({
    user_id: user.user_id,
    mobile: user.mobile,
    email: user.email,
    flat_id: user.flat_id,
    type: user.type,
    page_access: user.page_access,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));

  return token;
};

// Verify JWE token
const verifyToken = async (token) => {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
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