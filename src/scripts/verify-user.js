const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: 'ap-south-1'
});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = 'society-voting-app-dev-main';

async function verifyUser(mobile) {
  try {
    // Get user by mobile number
    const command = new GetCommand({
      TableName: TABLE,
      Key: {
        PK: `USER#${mobile}`,
        SK: 'METADATA'
      }
    });
    
    const response = await docClient.send(command);
    const user = response.Item;

    console.log('\n=== User Verification ===');
    console.log('Mobile:', mobile);
    
    if (user) {
      console.log('\nUser Details:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('\nNo user found with this mobile number');
    }

  } catch (error) {
    console.error('Error verifying user:', error);
  }
}

// Test with the mobile number
verifyUser('9922667597'); 