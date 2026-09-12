const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Get Authorization header
  const authHeader = req.headers.authorization;

  // 2. Check if header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Access denied.' });
  }

  // 3. Extract the token
  const token = authHeader.split(' ')[1];

  try {
    // 4. Verify the token with the secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach userId to req so routes can use it
    req.userId = decoded.userId;

    // 6. Pass control to the route
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};

module.exports = authMiddleware;