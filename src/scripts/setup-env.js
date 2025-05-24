const fs = require('fs');
const path = require('path');

// Environment variables for development
const env = {
  DYNAMODB_TABLE_FLAT_DETAILS: 'society-voting-app-dev-flat-details',
  DYNAMODB_TABLE_USER_DETAILS: 'society-voting-app-dev-user-details',
  DYNAMODB_TABLE_ALTERNATE_NUMBERS: 'society-voting-app-dev-alternate-numbers',
  DYNAMODB_TABLE_POLLS: 'society-voting-app-dev-polls',
  DYNAMODB_TABLE_VOTES: 'society-voting-app-dev-votes',
  DYNAMODB_TABLE_OTP: 'society-voting-app-otp-dev',
  JWT_SECRET: 'your-jwt-secret-key-here',
};

// Create .env file
const envContent = Object.entries(env)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(path.join(__dirname, '../../.env'), envContent);
console.log('Environment variables set up successfully!'); 