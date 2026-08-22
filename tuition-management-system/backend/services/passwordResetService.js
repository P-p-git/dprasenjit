const crypto = require('crypto');
const { db } = require('../config/db');
const User = require('../models/User');

const TOKEN_TTL_MINUTES = 15;

const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
};

const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

// Creates a single-use, hashed, expiring reset token for the given identifier.
// Returns true only when delivery is possible; callers MUST respond generically
// either way so account existence is never revealed.
const createPasswordResetToken = async (identifier) => {
  const trimmed = String(identifier || '').trim();
  if (!trimmed) return null;

  const user = await User.findOne({ username: trimmed }) ||
               await User.findOne({ email: trimmed.toLowerCase() });
  if (!user) return null;

  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL').run(user._id);

  const { token, tokenHash } = generateResetToken();
  db.prepare(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, datetime('now', ?))`
  ).run(user._id, tokenHash, `+${TOKEN_TTL_MINUTES} minutes`);

  return { token, user };
};

// Validates a raw token: must exist, be unused and unexpired. Single use.
const consumePasswordResetToken = (rawToken) => {
  if (typeof rawToken !== 'string' || rawToken.length < 32) return null;
  const tokenHash = hashResetToken(rawToken);
  const row = db.prepare(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')`
  ).get(tokenHash);
  return row || null;
};

const markTokenUsed = (tokenId) => {
  const row = db.prepare('SELECT user_id FROM password_reset_tokens WHERE _id = ?').get(tokenId);
  if (!row) return;
  // Single use + invalidate any other outstanding tokens for this user
  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(row.user_id);
};

module.exports = { createPasswordResetToken, consumePasswordResetToken, markTokenUsed, TOKEN_TTL_MINUTES };
