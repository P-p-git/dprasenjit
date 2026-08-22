const express = require('express');
const router = express.Router();
const { getQueries, createQuery, replyToQuery } = require('../controllers/queryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// List queries: students see their own (scoped in controller), staff see all
router.route('/')
  .get(getQueries)
  .post(authorize('student'), createQuery);

// Only staff can reply / resolve
router.put('/:id/reply', authorize('admin', 'teacher'), replyToQuery);

module.exports = router;
