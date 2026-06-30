import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, malformed token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecrettruthshieldkey12345');
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error('JWT validation error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed or expired' });
  }
};
