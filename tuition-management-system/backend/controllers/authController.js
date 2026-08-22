const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const JWT_ISSUER = 'smart-tuition';
const SESSION_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

let dummyHashPromise = null;
const getDummyHash = () => {
  if (!dummyHashPromise) {
    dummyHashPromise = bcrypt.hash('timing-equalizer-dummy', 10);
  }
  return dummyHashPromise;
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: SESSION_EXPIRES_IN,
    issuer: JWT_ISSUER,
  });
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
});

const validateIdentifier = (value) =>
  typeof value === 'string' && value.trim().length >= 1 && value.trim().length <= 64;

const validatePassword = (value) =>
  typeof value === 'string' && value.length >= 1 && value.length <= 128;

// Single-step login: username + password => session token.
// The role is ALWAYS taken from the database row, never from the request.
const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!validateIdentifier(username) || !validatePassword(password)) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      await getDummyHash().then((h) => bcrypt.compare(password, h));
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }

    const isMatch = await User.matchPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    res.json({
      success: true,
      data: {
        ...sanitizeUser(user),
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const validateNewPassword = (value) =>
  typeof value === 'string' && value.length >= 8 && value.length <= 128;

// Admin-only convenience: set a new password for any account without knowing
// or retrieving the old one. Old passwords are never returned by this API.
const adminResetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body || {};

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    if (!validateNewPassword(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }
    // Admins cannot reset other admins through this endpoint
    const target = await User.findById(userId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (target.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin passwords cannot be reset here' });
    }

    await User.findByIdAndUpdate(userId, { password: newPassword });
    console.log(`Admin reset password for user _id=${userId}`);

    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Admin reset password error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const register = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    const allowedRoles = ['teacher', 'student'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be teacher or student' });
    }

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const existingEmail = email ? await User.findOne({ email }) : null;
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({ name, username, email: email || null, password, role });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }
    const userData = User.toJSON(user);
    if (user.profile_id && user.profile_model) {
      const Model = user.profile_model === 'Teacher' ? require('../models/Teacher') : require('../models/Student');
      const profile = await Model.findById(user.profile_id);
      if (profile) userData.profile = profile;
    }
    res.json({ success: true, data: userData });
  } catch (error) {
    console.error('GetMe error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { register, login, getMe, adminResetPassword };
