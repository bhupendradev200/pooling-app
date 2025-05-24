require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: 'ap-south-1'  // Mumbai region
});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = 'society-voting-app-dev-main';  // Direct table name

// Helper to batch write (max 25 at a time)
async function batchWrite(items) {
  const batches = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }
  for (const batch of batches) {
    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE]: batch.map(Item => ({ PutRequest: { Item } }))
        }
      }));
      console.log(`Successfully wrote batch of ${batch.length} items`);
    } catch (error) {
      console.error('Error writing batch:', error);
      throw error;
    }
  }
}

async function seed() {
  // --- Flat Details ---
  const flats = [
    { name: 'pine', wing: 'a', flat_no: '101' },
    { name: 'pine', wing: 'b', flat_no: '902' },
    { name: 'cedar', wing: 'c', flat_no: '123' },
    { name: 'oak', wing: 'd', flat_no: 'P02' },
    { name: 'oak', wing: 'd', flat_no: '433' },
  ];
  const flatItems = flats.map(f => ({
    PK: `FLAT#${f.name}-${f.wing}-${f.flat_no}`.toLowerCase(),
    SK: 'METADATA',
    flat_id: `${f.name}-${f.wing}-${f.flat_no}`.toLowerCase(),
    ...f,
  }));

  // --- User Details ---
  const users = [
    { user_id: 1, type: 'first_owner', f_name: 'bhupendra', l_name: 'mestry', mobile: '9922667597', email: 'bhupendram4u@gmail.com', flat_id: 'pine-b-902', page_access: ['create_flat', 'get_flat', 'create_user', 'add_alternate_number', 'create_poll', 'vote_poll', 'poll_summary', 'poll_details', 'poll_report', 'login', 'request_otp', 'verify_otp'] },
    { user_id: 2, type: 'second_owner', f_name: 'Vedanga', l_name: 'Mestry', mobile: '99448887798', email: 'vedanga.mestry@gmail.com', flat_id: 'pine-b-902', page_access: ['vote_poll', 'poll_summary', 'login', 'request_otp', 'verify_otp'] },
    { user_id: 3, type: 'first_owner', f_name: 'suri', l_name: 'banu', mobile: '994488878', email: 'abc3@gmail.com', flat_id: 'cedar-c-123', page_access: ['vote_poll', 'poll_summary', 'login', 'request_otp', 'verify_otp'] },
    { user_id: 4, type: 'second_owner', f_name: 'masri', l_name: 'kaki', mobile: '994488879', email: 'ad@gmail.com', flat_id: 'oak-d-p02', page_access: ['vote_poll', 'poll_summary', 'login', 'request_otp', 'verify_otp'] },
    { user_id: 5, type: 'first_owner', f_name: 'mekur', l_name: 'swmia', mobile: '994488880', email: 'sers@gmail.com', flat_id: 'oak-d-433', page_access: ['vote_poll', 'poll_summary', 'login', 'request_otp', 'verify_otp'] },
    { user_id: 6, type: 'second_owner', f_name: 'manda', l_name: 'vanit', mobile: '994488881', email: 'sdf3@swerve.com', flat_id: 'oak-d-433', page_access: ['vote_poll', 'poll_summary', 'login', 'request_otp', 'verify_otp'] },
    { user_id: 7, type: 'first_owner', f_name: 'suveda', l_name: 'debi', mobile: '994488882', email: 'sdfs@f.oas', flat_id: 'oak-d-433', page_access: ['vote_poll', 'poll_summary', 'login', 'request_otp', 'verify_otp'] },
    { user_id: 8, type: 'second_owner', f_name: 'patil', l_name: 'gika', mobile: '994488883', email: 'dfs@123der.com', flat_id: 'oak-d-433', page_access: ['vote_poll', 'poll_summary', 'login', 'request_otp', 'verify_otp'] },
    { user_id: 9, type: 'first_owner', f_name: 'gero', l_name: 'wasmi', mobile: '994488884', email: 'addfa23@sfdsf.com', flat_id: 'oak-d-433', page_access: ['vote_poll', 'poll_summary', 'login', 'request_otp', 'verify_otp'] },
    { user_id: 10, type: 'second_owner', f_name: 'kartik', l_name: 'aryan', mobile: '994488885', email: 'sere@gmcom.com', flat_id: 'oak-d-433', page_access: ['vote_poll', 'poll_summary', 'login', 'request_otp', 'verify_otp'] },
  ];
  const userItems = users.map(u => ({
    PK: `FLAT#${u.flat_id}`,
    SK: `USER#${u.user_id}`,
    user_id: u.user_id,
    type: u.type,
    f_name: u.f_name,
    l_name: u.l_name,
    mobile: u.mobile,
    email: u.email,
    flat_id: u.flat_id,
    GSI1PK: `USER#${u.mobile}`,
    GSI1SK: `FLAT#${u.flat_id}`,
    created_at: new Date().toISOString(),
  }));

  // --- Alternate Numbers ---
  const alternates = [
    { mobile: '9022568823', flat_id: 'pine-b-902' },
    { mobile: '6544569872', flat_id: 'pine-b-202' },
    { mobile: '6544569873', flat_id: 'cedar-c-123' },
    { mobile: '6544569874', flat_id: 'oak-d-p02' },
    { mobile: '6544569875', flat_id: 'oak-d-433' },
  ];
  const altItems = alternates.map(a => ({
    PK: `FLAT#${a.flat_id}`,
    SK: `ALT#${a.mobile}`,
    mobile: a.mobile,
    flat_id: a.flat_id,
  }));

  // --- Polls ---
  const polls = [
    { poll_id: 1, polling_name: 'society formation', created_by: 1, last_date: '2025-05-19' },
  ];
  const pollItems = polls.map(p => ({
    PK: `POLL#${p.poll_id}`,
    SK: 'METADATA',
    ...p
  }));

  // --- Poll Options ---
  const options = [
    { option_id: 1, option_name: 'separate wing', poll_id: 1 },
    { option_id: 2, option_name: 'combine wing', poll_id: 1 },
  ];
  const optionItems = options.map(o => ({
    PK: `POLL#${o.poll_id}`,
    SK: `OPTION#${o.option_id}`,
    ...o,
    GSI1PK: `POLL#${o.poll_id}`,
    GSI1SK: `OPTION#${o.option_id}`
  }));

  // --- Votes ---
  const votes = [
    { option_id: 1, poll_id: 1, flat_id: 'A-101', user_id: 1 },
    { option_id: 1, poll_id: 1, flat_id: 'B-202', user_id: 3 },
    { option_id: 2, poll_id: 1, flat_id: 'D-P02', user_id: 6 },
    { option_id: 2, poll_id: 1, flat_id: 'D-433', user_id: 7 },
  ];
  const voteItems = votes.map(v => ({
    PK: `POLL#${v.poll_id}`,
    SK: `VOTE#${v.flat_id}#${v.user_id}`,
    ...v
  }));

  // --- Page Access (API Endpoints) ---
  const pageAccesses = [
    { url: '/flat', name: 'create_flat' },
    { url: '/flat/{flat_id}', name: 'get_flat' },
    { url: '/user', name: 'create_user' },
    { url: '/user/alternate-number', name: 'add_alternate_number' },
    { url: '/poll', name: 'create_poll' },
    { url: '/poll/{poll_id}/vote', name: 'vote_poll' },
    { url: '/poll/{poll_id}/summary', name: 'poll_summary' },
    { url: '/poll/{poll_id}/details', name: 'poll_details' },
    { url: '/poll/{poll_id}/report', name: 'poll_report' },
    { url: '/auth/login', name: 'login' },
    { url: '/auth/otp/request', name: 'request_otp' },
    { url: '/auth/otp/verify', name: 'verify_otp' },
  ];
  const pageAccessItems = pageAccesses.map(pa => ({
    PK: 'PAGE_ACCESS',
    SK: `URL#${pa.name}`,
    url: pa.url,
    name: pa.name,
  }));

  // Write all items
  const allItems = [
    ...flatItems,
    ...userItems,
    ...altItems,
    ...pollItems,
    ...optionItems,
    ...voteItems,
    ...pageAccessItems,
  ];
  await batchWrite(allItems);
  console.log('Seeded single-table DynamoDB with relational data!');
}

seed().catch(console.error); 