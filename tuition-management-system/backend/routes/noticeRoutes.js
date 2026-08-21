const express = require('express');
const router = express.Router();
const { getNotices, createNotice, deleteNotice } = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getNotices)
  .post(authorize('admin', 'teacher'), createNotice);

router.delete('/:id', authorize('admin', 'teacher'), deleteNotice);

module.exports = router;
