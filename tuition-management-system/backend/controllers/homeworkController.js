const Homework = require('../models/Homework');
const Teacher = require('../models/Teacher');

const getHomework = async (req, res) => {
  try {
    const { batch, subject } = req.query;
    let conditions = {};

    if (batch) conditions.batch = batch;
    if (subject) conditions.subject = subject;

    const homework = await Homework.find(conditions);
    res.json({ success: true, count: homework.length, data: homework });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createHomework = async (req, res) => {
  try {
    let teacherId = req.user.profile_id;
    if (!teacherId && req.user.role === 'admin') {
      const teachers = await Teacher.find({ userId: req.user._id });
      teacherId = teachers.length > 0 ? teachers[0]._id : null;
    }

    const homework = await Homework.create({
      ...req.body,
      batch: req.body.batch,
      teacher: teacherId,
    });
    res.status(201).json({ success: true, data: homework });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateHomework = async (req, res) => {
  try {
    const homework = await Homework.findByIdAndUpdate(req.params.id, req.body);
    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }
    res.json({ success: true, data: homework });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteHomework = async (req, res) => {
  try {
    const homework = await Homework.findByIdAndDelete(req.params.id);
    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }
    res.json({ success: true, message: 'Homework deleted successfully' });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getHomework, createHomework, updateHomework, deleteHomework };
