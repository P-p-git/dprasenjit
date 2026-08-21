const express = require('express');
const router = express.Router();
const { getHomework, createHomework, updateHomework, deleteHomework } = require('../controllers/homeworkController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getHomework)
  .post(authorize('admin', 'teacher'), createHomework);

router.route('/:id')
  .put(authorize('admin', 'teacher'), updateHomework)
  .delete(authorize('admin', 'teacher'), deleteHomework);

module.exports = router;
