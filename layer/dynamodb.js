const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, ScanCommand, GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const query = async (params) => {
  const command = new QueryCommand(params);
  return await docClient.send(command);
};

const scan = async (params) => {
  const command = new ScanCommand(params);
  return await docClient.send(command);
};

const getItem = async (params) => {
  const command = new GetItemCommand(params);
  return await docClient.send(command);
};

const putItem = async (params) => {
  const command = new PutItemCommand(params);
  return await docClient.send(command);
};

const updateItem = async (params) => {
  const command = new UpdateItemCommand(params);
  return await docClient.send(command);
};

const deleteItem = async (params) => {
  const command = new DeleteItemCommand(params);
  return await docClient.send(command);
};

module.exports = {
  query,
  scan,
  getItem,
  putItem,
  updateItem,
  deleteItem
}; 