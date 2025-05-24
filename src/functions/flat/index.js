const Joi = require('joi');
const { getItem, putItem, queryItems } = require('../../shared/dynamodb');

// Validation schema for flat creation
const flatSchema = Joi.object({
  name: Joi.string().required(),
  wing: Joi.string().required(),
  flat_no: Joi.string().required(),
});

const createFlat = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { error, value } = flatSchema.validate(body);
    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.details[0].message }),
      };
    }
    const { name, wing, flat_no } = value;
    // Generate flat_id automatically
    const flat_id = `${name}-${wing}-${flat_no}`.toLowerCase();
    // Check if flat already exists
    const existing = await getItem(`FLAT#${flat_id}`, 'METADATA');
    if (existing) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Flat already exists' }),
      };
    }
    const flat = {
      PK: `FLAT#${flat_id}`,
      SK: 'METADATA',
      flat_id,
      name,
      wing,
      flat_no,
      created_at: new Date().toISOString(),
    };
    await putItem(flat);
    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Flat created successfully', flat }),
    };
  } catch (error) {
    console.error('Error creating flat:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

const getFlat = async (event) => {
  try {
    const { flat_id } = event.pathParameters;
    const flat = await getItem(`FLAT#${flat_id}`, 'METADATA');
    if (!flat) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Flat not found' }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(flat),
    };
  } catch (error) {
    console.error('Error getting flat:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

const listFlats = async () => {
  try {
    // Placeholder for listing all flats
    return {
      statusCode: 200,
      body: JSON.stringify([]),
    };
  } catch (error) {
    console.error('Error listing flats:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

module.exports = {
  createFlat,
  getFlat,
  listFlats,
}; 