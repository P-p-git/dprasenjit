// Operator tool: mint a one-time password reset link for a user.
// Usage:  node utils/resetPasswordCli.js <username-or-email>
//
// The backend /api/auth/forgot-password endpoint never returns tokens and
// email delivery is not configured in this project yet. Until an SMTP/email
// provider is wired in, an administrator with server access can use this
// script to hand a single-use, 15-minute reset link to the user directly
// (e.g., over a verified channel).
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { initializeDatabase } = require('../config/db');
const { createPasswordResetToken } = require('../services/passwordResetService');
const User = require('../models/User');

const identifier = process.argv[2];

if (!identifier) {
  console.error('Usage: node utils/resetPasswordCli.js <username-or-email>');
  process.exit(1);
}

(async () => {
  try {
    initializeDatabase();
    const result = await createPasswordResetToken(identifier);
    if (!result) {
      console.log('No active user matched that username/email. No token was created.');
      process.exit(0);
    }
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    console.log('\nOne-time password reset link (valid for 15 minutes):');
    console.log(`${baseUrl}/reset-password?token=${result.token}\n`);
    console.log('Share this link securely. It is single-use and grants nothing else.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
