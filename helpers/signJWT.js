const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

const signJWT = ({ id, name, email, avatar }) => {
  const token = jwt.sign({ id, name, email, avatar }, JWT_SECRET, {
    expiresIn: '1h',
  });

  return token;
};

module.exports = signJWT;
