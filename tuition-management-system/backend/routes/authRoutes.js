const express = require('express');
const router = express.Router();
const { register, login, getMe, adminResetPassword } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordResetController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { loginLimiter, passwordResetLimiter } = require('../middleware/rateLimiters');

// Registration is admin-only to prevent privilege escalation
router.post('/register', protect, authorize('admin'), register);

// Login: username + password only (no OTP / 2FA). Rate limited against brute force.
router.post('/login', loginLimiter, login);

// Admin-only: set a new password for a teacher/student account
router.post('/reset-user-password', protect, authorize('admin'), adminResetPassword);

router.get('/me', protect, getMe);

router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

module.exports = router;
