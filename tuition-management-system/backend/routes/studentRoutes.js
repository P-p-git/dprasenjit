const express = require('express');
const router = express.Router();
const { getStudents, getStudent, addStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Listing all students exposes personal data — staff only.
// Students can still view their own profile via GET /:id (scoped in controller).
router.route('/')
  .get(authorize('admin', 'teacher'), getStudents)
  .post(authorize('admin'), addStudent);

router.route('/:id')
  .get(getStudent)
  .put(authorize('admin'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

module.exports = router;
