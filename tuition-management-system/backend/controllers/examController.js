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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getExams, createExam };
