const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Xác thực JWT token từ request headers
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token
 */
const generateToken = (userId, additionalPayload = {}) => {
  return jwt.sign(
    { 
      userId,
      ...additionalPayload,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Extract token from request
 */
const extractToken = (req) => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // Check query parameter (not recommended for production)
  if (req.query && req.query.token) {
    return req.query.token;
  }
  
  return null;
};

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Attach user info to request
    req.user = {
      id: decoded.userId,
      ...decoded
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    return res.status(401).json({
      error: error.message || 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.userId,
        ...decoded
      };
    }
    
    next();
  } catch (error) {
    // Token invalid but continue anyway
    console.warn('Optional auth failed:', error.message);
    next();
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }
    
    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
    }
    
    next();
  };
};

/**
 * Refresh token
 */
const refreshToken = (oldToken) => {
  try {
    const decoded = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });
    
    // Check if token is not too old (e.g., within 30 days)
    const tokenAge = Date.now() / 1000 - decoded.iat;
    if (tokenAge > 30 * 24 * 60 * 60) {
      throw new Error('Token too old to refresh');
    }
    
    // Generate new token
    return generateToken(decoded.userId, {
      role: decoded.role
    });
  } catch (error) {
    throw new Error('Cannot refresh token: ' + error.message);
  }
};

/**
 * Mock login for development/demo
 */
const mockLogin = (req, res) => {
  const { email } = req.body;
  
  // In production, verify credentials against database
  const userId = 'user-1'; // Mock user ID
  const token = generateToken(userId, { email, role: 'user' });
  
  res.json({
    success: true,
    token,
    user: {
      id: userId,
      email
    }
  });
};

/**
 * Logout handler
 */
const logout = (req, res) => {
  // If using cookies, clear them
  if (req.cookies && req.cookies.token) {
    res.clearCookie('token');
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  generateToken,
  verifyToken,
  refreshToken,
  mockLogin,
  logout,
  extractToken
};