const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Batch = require('../models/Batch');
const { db } = require('../config/db');

const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

const addTeacher = async (req, res) => {
  try {
    const { name, email, phone, subject, qualification, joiningDate, username } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const existing = await Teacher.find();
    const emailExists = existing.find(t => t.email === email);
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Teacher with this email already exists' });
    }

    const teacher = await Teacher.create({ name, email, phone, subject, qualification, joiningDate });

    const password = 'teacher@123';
    const user = await User.create({
      name,
      username,
      email,
      password,
      role: 'teacher',
      profileId: teacher._id,
      profileModel: 'Teacher',
    });

    await Teacher.findByIdAndUpdate(teacher._id, { userId: user._id });

    const updatedTeacher = await Teacher.findById(teacher._id);
    res.status(201).json({ success: true, data: updatedTeacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTeachers, getTeacher, addTeacher, updateTeacher, deleteTeacher };
