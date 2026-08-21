const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, getStudentAttendanceSummary } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getAttendance)
  .post(authorize('admin', 'teacher'), markAttendance);

router.get('/summary/:studentId', getStudentAttendanceSummary);

module.exports = router;
