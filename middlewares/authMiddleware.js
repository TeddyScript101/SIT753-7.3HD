const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

function authenticateToken(req, res, next) {
  const token = req?.cookies?.token;
  if (!token) {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.deleted) return res.redirect('/login');
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authenticateToken;
