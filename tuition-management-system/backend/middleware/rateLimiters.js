const rateLimit = require('express-rate-limit');

const jsonMessage = (message) => ({
  success: false,
  message,
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: jsonMessage('Too many login attempts. Please try again in a few minutes.'),
});

const mfaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many verification attempts. Please try again in a few minutes.'),
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many requests. Please try again later.'),
});

module.exports = { loginLimiter, mfaLimiter, passwordResetLimiter };
