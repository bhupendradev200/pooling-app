const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get stage from command line argument or default to 'dev'
const stage = process.argv[2] || 'dev';

// Check if config.json exists
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('Error: config.json file not found!');
  console.error('Please create config.json using config.template.json as a template.');
  console.error('1. Copy config.template.json to config.json');
  console.error('2. Update the credentials in config.json with your AWS credentials');
  process.exit(1);
}

// Read config file
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Error: Invalid config.json file!');
  console.error('Please ensure your config.json is valid JSON format.');
  process.exit(1);
}

if (!config[stage]) {
  console.error(`Error: Configuration for stage '${stage}' not found in config.json`);
  console.error('Available stages:', Object.keys(config).join(', '));
  process.exit(1);
}

// Validate required AWS credentials
const awsConfig = config[stage].aws;
if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey || !awsConfig.region) {
  console.error('Error: Missing required AWS credentials in config.json');
  console.error('Please ensure all required fields are present:');
  console.error('- accessKeyId');
  console.error('- secretAccessKey');
  console.error('- region');
  process.exit(1);
}

// Set AWS credentials from config
process.env.AWS_ACCESS_KEY_ID = awsConfig.accessKeyId;
process.env.AWS_SECRET_ACCESS_KEY = awsConfig.secretAccessKey;
process.env.AWS_REGION = awsConfig.region;

console.log(`Deploying to ${stage} environment in region ${awsConfig.region}...`);

try {
  // Run serverless deploy command
  execSync(`serverless deploy --stage ${stage}`, { stdio: 'inherit' });
  console.log('Deployment completed successfully!');
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
} 