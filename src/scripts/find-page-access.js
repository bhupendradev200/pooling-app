const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: 'ap-south-1'
});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = 'society-voting-app-dev-main';

async function findPageAccessByUrl(url) {
  try {
    // Query the PAGE_ACCESS items
    const command = new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'PAGE_ACCESS'
      }
    });
    
    const response = await docClient.send(command);
    const items = response.Items;

    // Find matching URL
    const matchingItem = items.find(item => {
      // Convert URL patterns to regex
      const urlPattern = item.url.replace(/\{.*?\}/g, '.*');
      const regex = new RegExp(`^${urlPattern}$`);
      return regex.test(url);
    });

    if (matchingItem) {
      console.log('\n=== Page Access Found ===');
      console.log('URL:', url);
      console.log('Page Name:', matchingItem.name);
      console.log('Full Record:', JSON.stringify(matchingItem, null, 2));
    } else {
      console.log('\nNo page access found for URL:', url);
    }

  } catch (error) {
    console.error('Error finding page access:', error);
  }
}

// Test with some URLs
const testUrls = [
  '/flat',
  '/flat/123',
  '/user',
  '/user/alternate-number',
  '/poll/1/vote',
  '/auth/login'
];

console.log('Testing URL to Page Access mapping...\n');
testUrls.forEach(url => {
  console.log(`\nChecking URL: ${url}`);
  findPageAccessByUrl(url);
}); 