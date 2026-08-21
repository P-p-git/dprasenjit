const express = require('express');
const router = express.Router();
const { getFees, createFee, updateFee, getFeeSummary, getStudentFees, getPendingFeesRange, recordRangePayment } = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getFees)
  .post(authorize('admin'), createFee);

router.get('/summary', getFeeSummary);
router.get('/student/:studentId', getStudentFees);
router.get('/pending-range', getPendingFeesRange);
router.post('/record-range', authorize('admin', 'teacher'), recordRangePayment);

router.put('/:id', authorize('admin'), updateFee);

module.exports = router;
