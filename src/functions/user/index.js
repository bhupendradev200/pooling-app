const { v4: uuidv4 } = require('uuid');
const { putItem, getItem, queryGSI } = require('../../shared/dynamodb');

// Create user
const createUser = async (event) => {
  try {
    const { user_id, type, f_name, l_name, mobile, email, flat_id } = JSON.parse(event.body);
    if (!user_id || !type || !f_name || !l_name || !mobile || !email || !flat_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'All fields are required' }),
      };
    }
    // Check if user already exists by mobile (GSI)
    const existing = await queryGSI(`USER#${mobile}`);
    if (existing && existing.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'User already exists' }),
      };
    }
    const user = {
      PK: `FLAT#${flat_id}`,
      SK: `USER#${user_id}`,
      user_id,
      type,
      f_name,
      l_name,
      mobile,
      email,
      flat_id,
      GSI1PK: `USER#${mobile}`,
      GSI1SK: `FLAT#${flat_id}`,
      created_at: new Date().toISOString(),
    };
    await putItem(user);
    return {
      statusCode: 201,
      body: JSON.stringify(user),
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// Add alternate number
const addAlternateNumber = async (event) => {
  try {
    const { flat_id, mobile } = JSON.parse(event.body);
    if (!flat_id || !mobile) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'All fields are required' }),
      };
    }
    // Check if alternate number already exists
    const existing = await getItem(`FLAT#${flat_id}`, `ALT#${mobile}`);
    if (existing) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Alternate number already exists' }),
      };
    }
    const alt = {
      PK: `FLAT#${flat_id}`,
      SK: `ALT#${mobile}`,
      mobile,
      flat_id,
      created_at: new Date().toISOString(),
    };
    await putItem(alt);
    return {
      statusCode: 201,
      body: JSON.stringify(alt),
    };
  } catch (error) {
    console.error('Add alternate number error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

module.exports = {
  createUser,
  addAlternateNumber,
}; 