const express = require('express');
const router = express.Router();
const { getExams, createExam } = require('../controllers/examController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getExams)
  .post(authorize('admin', 'teacher'), createExam);

module.exports = router;
