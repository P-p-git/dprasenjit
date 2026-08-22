const express = require('express');
const router = express.Router();
const { getTeachers, getTeacher, addTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(authorize('admin'), getTeachers)
  .post(authorize('admin'), addTeacher);

router.route('/:id')
  .get(authorize('admin'), getTeacher)
  .put(authorize('admin'), updateTeacher)
  .delete(authorize('admin'), deleteTeacher);

module.exports = router;
