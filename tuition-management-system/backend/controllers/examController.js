const Exam = require('../models/Exam');
const Teacher = require('../models/Teacher');

const getExams = async (req, res) => {
  try {
    const { batch, subject } = req.query;
    let conditions = {};
    if (batch) conditions.batch = batch;
    if (subject) conditions.subject = subject;

    const exams = await Exam.find(conditions);
    res.json({ success: true, count: exams.length, data: exams });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createExam = async (req, res) => {
  try {
    let teacherId = req.user.profile_id;
    if (!teacherId && req.user.role === 'admin') {
      const teachers = await Teacher.find({ userId: req.user._id });
      teacherId = teachers.length > 0 ? teachers[0]._id : null;
    }

    const exam = await Exam.create({
      ...req.body,
      batch: req.body.batch,
      teacher: teacherId,
    });
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getExams, createExam };
