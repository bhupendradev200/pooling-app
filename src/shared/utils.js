const { v4: uuidv4 } = require('uuid');
const { SignJWT } = require('jose');

const generateRequestId = () => {
  return uuidv4();
};

const generateToken = async (user) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
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
};

module.exports = {
  generateRequestId,
  generateToken
}; 