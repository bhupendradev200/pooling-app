const { v4: uuidv4 } = require('uuid');
const { putItem, getItem, queryItems } = require('../../shared/dynamodb');
const { verifyToken } = require('../auth/utils');

// Create poll
const createPoll = async (event) => {
  try {
    const { polling_name, created_by, last_date, options } = JSON.parse(event.body);
    if (!polling_name || !created_by || !last_date || !options || !Array.isArray(options)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'All fields are required' }),
      };
    }
    const poll_id = uuidv4();
    const poll = {
      PK: `POLL#${poll_id}`,
      SK: 'METADATA',
      poll_id,
      polling_name,
      created_by,
      last_date,
      created_at: new Date().toISOString(),
    };
    await putItem(poll);
    // Add options
    for (let i = 0; i < options.length; i++) {
      const option = {
        PK: `POLL#${poll_id}`,
        SK: `OPTION#${i + 1}`,
        option_id: i + 1,
        option_name: options[i],
        poll_id,
        created_at: new Date().toISOString(),
      };
      await putItem(option);
    }
    return {
      statusCode: 201,
      body: JSON.stringify({ poll_id, polling_name, created_by, last_date, options }),
    };
  } catch (error) {
    console.error('Create poll error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// Cast vote
const castVote = async (event) => {
  try {
    const { poll_id } = event.pathParameters;
    const { option_id, flat_id, user_id } = JSON.parse(event.body);
    if (!option_id || !flat_id || !user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'All fields are required' }),
      };
    }
    // Check if vote already exists
    const existing = await getItem(`POLL#${poll_id}`, `VOTE#${flat_id}#${user_id}`);
    if (existing) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'You have already voted' }),
      };
    }
    const vote = {
      PK: `POLL#${poll_id}`,
      SK: `VOTE#${flat_id}#${user_id}`,
      poll_id,
      option_id,
      flat_id,
      user_id,
      voted_at: new Date().toISOString(),
    };
    await putItem(vote);
    return {
      statusCode: 201,
      body: JSON.stringify(vote),
    };
  } catch (error) {
    console.error('Cast vote error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// Get poll summary
const getPollSummary = async (event) => {
  try {
    const { poll_id } = event.pathParameters;
    // Get poll
    const poll = await getItem(`POLL#${poll_id}`, 'METADATA');
    if (!poll) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Poll not found' }),
      };
    }
    // Get options
    const options = await queryItems(`POLL#${poll_id}`, 'OPTION#');
    // Get votes
    const votes = await queryItems(`POLL#${poll_id}`, 'VOTE#');
    // Calculate summary
    const summary = {
      poll_id,
      polling_name: poll.polling_name,
      total_votes: votes.length,
      options: options.map(option => ({
        option_id: option.option_id,
        option_name: option.option_name,
        votes: votes.filter(vote => vote.option_id === option.option_id).length,
      })),
    };
    return {
      statusCode: 200,
      body: JSON.stringify(summary),
    };
  } catch (error) {
    console.error('Get poll summary error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// Export
module.exports = {
  createPoll,
  castVote,
  getPollSummary,
}; 