# Society Voting Application

A serverless voting application built with AWS Lambda, DynamoDB, and API Gateway using the Serverless Framework.

## Features

- User authentication with mobile/email
- Flat and user management
- Polling system with multiple options
- Secret voting support
- Role-based access control
- Detailed voting reports

## Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- Serverless Framework installed globally

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd society-voting-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up AWS credentials:
```bash
# Copy the template config file
cp config.template.json config.json

# Edit config.json with your AWS credentials
# Replace the placeholder values with your actual AWS credentials
```

4. Deploy to AWS:
```bash
# Deploy to development environment
npm run deploy

# Deploy to production environment
npm run deploy:prod
```

## AWS Credentials Setup

1. Create an AWS account if you don't have one
2. Create an IAM user with the following permissions:
   - `AWSLambdaFullAccess`
   - `AmazonDynamoDBFullAccess`
   - `AmazonAPIGatewayAdministrator`
   - `CloudWatchLogsFullAccess`
3. Get the Access Key ID and Secret Access Key
4. Update `config.json` with your credentials:
```json
{
  "dev": {
    "aws": {
      "accessKeyId": "YOUR_ACCESS_KEY_ID",
      "secretAccessKey": "YOUR_SECRET_ACCESS_KEY",
      "region": "ap-south-1"
    }
  }
}
```

Note: Never commit `config.json` to version control as it contains sensitive information.

## API Endpoints

### Authentication
- `POST /auth/login` - Login with mobile or email

### Flat Management
- `POST /flat` - Create a new flat record

### User Management
- `POST /user` - Create a new user
- `POST /user/alternate-number` - Add alternate mobile number

### Polling System
- `POST /poll` - Create a new poll
- `POST /poll/{pollId}/vote` - Cast a vote
- `GET /poll/{pollId}/summary` - Get poll summary
- `GET /poll/{pollId}/details` - Get detailed poll results
- `GET /poll/{pollId}/report` - Download full poll report (admin only)

## Data Models

### Flat Details
```json
{
  "flat_id": "pine-a-101",
  "name": "pine",
  "wing": "a",
  "flatno": "101"
}
```

### User Details
```json
{
  "mobile": "99448876",
  "type": "first_owner",
  "f_name": "gemini",
  "l_name": "aryan",
  "email": "abc1@gmail.com",
  "flat_id": "pine-a-101",
  "role": "admin",
  "page_access": ["poll/vote", "poll/report", "poll/create"]
}
```

### Alternate Numbers
```json
{
  "alternate_mobile": "6544569871",
  "flat_id": "pine-a-101",
  "primary_mobile": "99448876"
}
```

### Page Access
```json
{
  "url": "/poll/report",
  "name": "Vote Report",
  "is_publish": true,
  "roles_allowed": ["admin", "first_owner"]
}
```

### Polls
```json
{
  "poll_id": "uuid-1",
  "polling_name": "Society Formation",
  "created_by": "99448876",
  "last_date": "2025-05-19",
  "options": [
    { "option_id": 1, "option_name": "Separate Wing" },
    { "option_id": 2, "option_name": "Combine Wing" }
  ]
}
```

### Votes
```json
{
  "poll_id": "uuid-1",
  "flat_id": "pine-a-101",
  "user_id": "99448876",
  "option_id": 1,
  "is_secret": false,
  "timestamp": "2025-05-12T12:30:00Z"
}
```

## Access Control

The application implements role-based access control with the following roles:
- `admin`: Full access to all features
- `first_owner`: Access to voting and basic reports
- `second_owner`: Limited access based on page_access configuration

## Error Handling

All API endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Development

To run the application locally:
```bash
serverless offline
```

## Testing

Run tests:
```bash
npm test
```

## License

MIT 