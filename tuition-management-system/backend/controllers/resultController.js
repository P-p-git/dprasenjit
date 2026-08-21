const Result = require('../models/Result');

const getResults = async (req, res) => {
  try {
    const { exam, student } = req.query;
    let conditions = {};
    if (exam) conditions.exam = exam;
    if (student) conditions.student = student;

    const results = await Result.find(conditions);
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getResults, createResult, getStudentResults };
