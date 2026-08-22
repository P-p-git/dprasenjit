const Attendance = require('../models/Attendance');

const markAttendance = async (req, res) => {
  try {
    const { batchId, date, attendance } = req.body;

    if (!batchId || !date || !attendance) {
      return res.status(400).json({ success: false, message: 'Please provide batch, date, and attendance data' });
    }

    const results = [];

    for (const record of attendance) {
      const result = await Attendance.findOneAndUpdate(
        { student: record.studentId, batch: batchId, date: date },
        { status: record.status, markedBy: req.user.profile_id || null },
        { upsert: true }
      );
      results.push(result);
    }

    res.status(201).json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { batch, date, student } = req.query;
    let conditions = {};

    if (batch) conditions.batch = batch;
    if (date) conditions.date = date;
    if (student) conditions.student = student;

    // Students may only ever read their own attendance records
    if (req.user.role === 'student') {
      conditions.student = req.user.profile_id;
      delete conditions.batch;
    }

    const records = await Attendance.find(conditions);

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getStudentAttendanceSummary = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.params.studentId });

    const totalClasses = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;

    res.json({
      success: true,
      data: { totalClasses, present, absent, percentage },
    });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { markAttendance, getAttendance, getStudentAttendanceSummary };
