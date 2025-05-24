const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: 'ap-south-1'
});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = 'society-voting-app-dev-main';

async function verifyData() {
  try {
    // Scan the table
    const command = new ScanCommand({
      TableName: TABLE
    });
    
    const response = await docClient.send(command);
    const items = response.Items;

    // Group items by type
    const groupedItems = items.reduce((acc, item) => {
      const type = item.PK.split('#')[0];
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {});

    // Print summary
    console.log('\n=== Data Verification Summary ===');
    console.log('Total items:', items.length);
    console.log('\nItems by type:');
    Object.entries(groupedItems).forEach(([type, items]) => {
      console.log(`${type}: ${items.length} items`);
    });

    // Print sample data
    console.log('\n=== Sample Data ===');
    Object.entries(groupedItems).forEach(([type, items]) => {
      console.log(`\n${type} (Sample):`);
      console.log(JSON.stringify(items[0], null, 2));
    });

  } catch (error) {
    console.error('Error verifying data:', error);
  }
}

verifyData(); 