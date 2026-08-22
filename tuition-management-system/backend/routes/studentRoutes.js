const express = require('express');
const router = express.Router();
const { getStudents, getStudent, addStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Listing all students exposes personal data — staff only.
// Students can still view their own profile via GET /:id (scoped in controller).
// Teachers may add and edit students (coaching workflow); delete stays admin-only.
router.route('/')
  .get(authorize('admin', 'teacher'), getStudents)
  .post(authorize('admin', 'teacher'), addStudent);

router.route('/:id')
  .get(getStudent)
  .put(authorize('admin', 'teacher'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

module.exports = router;
