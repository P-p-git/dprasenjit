const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_ISSUER = 'smart-tuition';

const verifyJwt = (token) =>
  jwt.verify(token, process.env.JWT_SECRET, { issuer: JWT_ISSUER });

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyJwt(token);

      // Legacy short-lived MFA-pending tokens are NOT valid session tokens
      if (decoded.purpose === 'mfa' || decoded.purpose === 'mfa-setup') {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      if (!user.is_active) {
        return res.status(401).json({ success: false, message: 'Account is deactivated' });
      }
      req.user = User.toJSON(user);
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Role-based authorization. Usage: authorize('admin'), authorize('admin', 'teacher')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

const authorizeSelfOrStaff = (paramName = 'studentId') => {
  return (req, res, next) => {
    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      return next();
    }
    const requestedId = req.params[paramName] !== undefined ? req.params[paramName] : req.query[paramName];
    if (requestedId === undefined || String(req.user.profile_id) !== String(requestedId)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { protect, authorize, authorizeSelfOrStaff };
