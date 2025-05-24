const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: 'ap-south-1'
});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = 'society-voting-app-dev-main';

async function createUser() {
  try {
    const user = {
      PK: 'USER#9922667597',
      SK: 'METADATA',
      user_id: 1,
      type: 'first_owner',
      f_name: 'bhupendra',
      l_name: 'mestry',
      mobile: '9922667597',
      email: 'bhupendram4u@gmail.com',
      flat_id: 'pine-b-902',
      page_access: [
        'create_flat',
        'get_flat',
        'create_user',
        'add_alternate_number',
        'create_poll',
        'vote_poll',
        'poll_summary',
        'poll_details',
        'poll_report',
        'login',
        'request_otp',
        'verify_otp'
      ]
    };

    const command = new PutCommand({
      TableName: TABLE,
      Item: user
    });

    await docClient.send(command);
    console.log('User created successfully:', user);

  } catch (error) {
    console.error('Error creating user:', error);
  }
}

createUser(); 