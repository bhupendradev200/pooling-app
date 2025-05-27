const { SignJWT, jwtVerify } = require('jose');
const { logError } = require('./utils');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-here';
const secret = new TextEncoder().encode(JWT_SECRET);

const generateToken = async (user) => {
  try {
    const token = await new SignJWT({ 
      sub: user.id,
      email: user.email,
      phone: user.phone,
      flat_id: user.flat_id,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);
    return token;
  } catch (error) {
    logError('Error generating token', error);
    throw new Error('Failed to generate token');
  }
};

const verifyToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    logError('Error verifying token', error);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
}; 