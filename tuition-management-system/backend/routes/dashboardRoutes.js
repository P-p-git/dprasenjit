const express = require('express');
const router = express.Router();
const { getAdminDashboard, getTeacherDashboard, getStudentDashboard, getStudentPerformance } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/teacher', authorize('teacher'), getTeacherDashboard);
router.get('/student', authorize('student'), getStudentDashboard);
router.get('/performance/:studentId', authorize('admin', 'teacher'), getStudentPerformance);

module.exports = router;
