const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Batch = require('../models/Batch');
const { db } = require('../config/db');

// Personal/contact fields are OPTIONAL: blank values are stored as NULL (email,
// must stay unique-able) or '' (plain text fields).
const cleanOptionalText = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const validateNewPassword = (value) =>
  typeof value === 'string' && value.length >= 8 && value.length <= 128;

const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    console.error('Get teachers error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.json({ success: true, data: teacher });
  } catch (error) {
    console.error('Get teacher error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const addTeacher = async (req, res) => {
  try {
    const { name, email, phone, subject, qualification, joiningDate, username, password } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }
    if (!username || !String(username).trim()) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    if (password !== undefined && password !== '') {
      if (!validateNewPassword(password)) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      }
    }

    const existingUsername = await User.findOne({ username: String(username).trim() });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const cleanEmail = cleanOptionalText(email);
    if (cleanEmail) {
      const normalized = cleanEmail.toLowerCase();
      const emailExists = await User.findOne({ email: normalized });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Teacher with this email already exists' });
      }
    }

    const teacher = await Teacher.create({
      name: String(name).trim(),
      email: cleanEmail ? cleanEmail.toLowerCase() : null,
      phone: phone || '',
      subject: String(subject).trim(),
      qualification, joiningDate,
    });

    // Shared default teacher password unless admin provides a custom one.
    const accountPassword = password || 'teacher@123';
    const user = await User.create({
      name: String(name).trim(),
      username: String(username).trim(),
      email: cleanEmail ? cleanEmail.toLowerCase() : null,
      password: accountPassword,
      role: 'teacher',
      profileId: teacher._id,
      profileModel: 'Teacher',
    });

    await Teacher.findByIdAndUpdate(teacher._id, { userId: user._id });

    const updatedTeacher = await Teacher.findById(teacher._id);
    res.status(201).json({ success: true, data: updatedTeacher });
  } catch (error) {
    console.error('Add teacher error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload.username;
    delete payload.userId;
    if (payload.email !== undefined) {
      payload.email = cleanOptionalText(payload.email);
      if (payload.email) payload.email = payload.email.toLowerCase();
    }

    const teacher = await Teacher.findByIdAndUpdate(req.params.id, payload);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.json({ success: true, data: teacher });
  } catch (error) {
    console.error('Update teacher error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    db.prepare('UPDATE batches SET teacher_id = NULL WHERE teacher_id = ?').run(teacher._id);

    if (teacher.userId) {
      await User.findByIdAndDelete(teacher.userId);
    }

    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getTeachers, getTeacher, addTeacher, updateTeacher, deleteTeacher };
