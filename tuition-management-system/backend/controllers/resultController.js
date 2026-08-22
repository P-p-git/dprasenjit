const Result = require('../models/Result');

const getResults = async (req, res) => {
  try {
    const { exam, student } = req.query;
    let conditions = {};
    if (exam) conditions.exam = exam;
    if (student) conditions.student = student;

    // Students may only ever read their own results
    if (req.user.role === 'student') {
      conditions.student = req.user.profile_id;
    }

    const results = await Result.find(conditions);
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createResult = async (req, res) => {
  try {
    const { student, exam, marks, totalMarks } = req.body;

    const result = await Result.findOneAndUpdate(
      { student, exam },
      { marks, totalMarks }
    );

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.params.studentId });

    const avgPercentage = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
      : 0;

    res.json({ success: true, data: { results, avgPercentage } });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getResults, createResult, getStudentResults };
