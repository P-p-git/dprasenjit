const express = require('express');
const router = express.Router();
const { getResults, createResult, getStudentResults } = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getResults)
  .post(authorize('admin', 'teacher'), createResult);

router.get('/student/:studentId', getStudentResults);

module.exports = router;
