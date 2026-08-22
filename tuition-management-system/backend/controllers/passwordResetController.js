const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  createPasswordResetToken,
  consumePasswordResetToken,
  markTokenUsed,
} = require('../services/passwordResetService');

const GENERIC_RESET_MESSAGE =
  'If the account exists, password reset instructions have been sent.';

// Always responds identically whether or not the account exists.
// Token delivery requires email infrastructure (documented in .env.example);
// without it, operators can mint a reset link with utils/resetPasswordCli.js.
const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body || {};
    if (typeof identifier !== 'string' || !identifier.trim() || identifier.trim().length > 254) {
      return res.json({ success: true, message: GENERIC_RESET_MESSAGE });
    }

    const result = await createPasswordResetToken(identifier);
    if (result && process.env.NODE_ENV === 'production' && process.env.SMTP_CONFIGURED === 'true') {
      // PRODUCTION EMAIL DELIVERY HOOK
      // Send `result.token` to result.user.email via your mail provider here.
      // The raw token must never be logged or included in API responses.
    }
    if (result) {
      console.log('Password reset requested. Awaiting delivery mechanism.');
    }

    res.json({ success: true, message: GENERIC_RESET_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.json({ success: true, message: GENERIC_RESET_MESSAGE });
  }
};

const validateNewPassword = (value) =>
  typeof value === 'string' && value.length >= 8 && value.length <= 128;

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};

    if (!validateNewPassword(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const record = consumePasswordResetToken(token);
    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Request a new one.' });
    }

    const user = await User.findById(record.user_id);
    if (!user || !user.is_active) {
      markTokenUsed(record._id);
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Request a new one.' });
    }

    await User.findByIdAndUpdate(user._id, { password: newPassword });
    markTokenUsed(record._id);

    console.log(`Password reset completed for user _id=${user._id}`);

    res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { forgotPassword, resetPassword };
