const Student = require('../models/Student');
const User = require('../models/User');
const Batch = require('../models/Batch');

const getStudents = async (req, res) => {
  try {
    const { search, class: studentClass, batch } = req.query;
    let conditions = {};

    if (search) {
      conditions.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (studentClass) conditions.class = studentClass;
    if (batch) conditions.batch = batch;

    const students = await Student.find(conditions);
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addStudent = async (req, res) => {
  try {
    const { fullName, email, phone, parentName, parentPhone, address, class: studentClass, batch, monthlyFee, joiningDate, username } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const existing = await Student.find({ $or: [{ email: { $regex: email, $options: 'i' } }] });
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Student with this email already exists' });
    }

    const student = await Student.create({
      fullName, email, phone, parentName, parentPhone,
      address, class: studentClass, batch, monthlyFee, joiningDate,
    });

    const password = 'student@123';
    const user = await User.create({
      name: fullName,
      username,
      email,
      password,
      role: 'student',
      profileId: student._id,
      profileModel: 'Student',
    });

    await Student.findByIdAndUpdate(student._id, { userId: user._id });

    if (batch) {
      await Batch.addStudent(batch, student._id);
    }

    const updatedStudent = await Student.findById(student._id);
    res.status(201).json({ success: true, data: updatedStudent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (req.body.batch && req.body.batch !== String(student.batch?._id || '')) {
      if (student.batch?._id) {
        await Batch.removeStudent(student.batch._id, student._id);
      }
      if (req.body.batch) {
        await Batch.addStudent(req.body.batch, student._id);
      }
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.batch?._id) {
      await Batch.removeStudent(student.batch._id, student._id);
    }

    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStudents, getStudent, addStudent, updateStudent, deleteStudent };
