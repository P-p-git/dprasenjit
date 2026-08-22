const Student = require('../models/Student');
const User = require('../models/User');
const Batch = require('../models/Batch');

// Personal/contact fields are OPTIONAL: blank values are stored as NULL (email,
// must stay unique-able) or '' (plain text fields).
const cleanOptionalText = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const validateNewPassword = (value) =>
  typeof value === 'string' && value.length >= 8 && value.length <= 128;

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
    console.error('Get students error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getStudent = async (req, res) => {
  try {
    // Students may only view their own profile; staff may view all.
    if (req.user.role === 'student' && String(req.user.profile_id) !== String(req.params.id)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Get student error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const addStudent = async (req, res) => {
  try {
    const { fullName, email, phone, parentName, parentPhone, address, class: studentClass, batch, monthlyFee, joiningDate, username, password } = req.body;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!studentClass) {
      return res.status(400).json({ success: false, message: 'Class is required' });
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
      const existingEmail = await User.findOne({ email: cleanEmail.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Student with this email already exists' });
      }
      const existingStudentEmail = await Student.findOneByEmail(cleanEmail);
      if (existingStudentEmail) {
        return res.status(400).json({ success: false, message: 'Student with this email already exists' });
      }
    }

    const student = await Student.create({
      fullName: String(fullName).trim(),
      email: cleanEmail ? cleanEmail.toLowerCase() : null,
      phone: phone || '',
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      address, class: studentClass, batch, monthlyFee, joiningDate,
    });

    // Shared default student password unless admin provides a custom one.
    const accountPassword = password || 'student@123';
    const user = await User.create({
      name: String(fullName).trim(),
      username: String(username).trim(),
      email: cleanEmail ? cleanEmail.toLowerCase() : null,
      password: accountPassword,
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
    console.error('Add student error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Account identity fields are immutable here; blank optional fields stay blank.
    const payload = { ...req.body };
    delete payload.username;
    delete payload.userId;
    if (payload.email !== undefined) {
      payload.email = cleanOptionalText(payload.email);
      if (payload.email) {
        payload.email = payload.email.toLowerCase();
        const duplicate = await Student.findOneByEmail(payload.email);
        if (duplicate && String(duplicate._id) !== String(req.params.id)) {
          return res.status(400).json({ success: false, message: 'Another student already uses this email' });
        }
      }
    }

    if (req.body.batch && req.body.batch !== String(student.batch?._id || '')) {
      if (student.batch?._id) {
        await Batch.removeStudent(student.batch._id, student._id);
      }
      if (req.body.batch) {
        await Batch.addStudent(req.body.batch, student._id);
      }
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, payload);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update student error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
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
    console.error('Delete student error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getStudents, getStudent, addStudent, updateStudent, deleteStudent };
