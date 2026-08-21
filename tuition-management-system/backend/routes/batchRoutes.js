const express = require('express');
const router = express.Router();
const {
  getBatches, getBatch, createBatch, updateBatch, deleteBatch,
  addStudentToBatch, removeStudentFromBatch,
} = require('../controllers/batchController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getBatches)
  .post(authorize('admin'), createBatch);

router.route('/:id')
  .get(getBatch)
  .put(authorize('admin'), updateBatch)
  .delete(authorize('admin'), deleteBatch);

router.post('/:id/students', authorize('admin'), addStudentToBatch);
router.delete('/:id/students/:studentId', authorize('admin'), removeStudentFromBatch);

module.exports = router;
