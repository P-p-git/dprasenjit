const express = require('express');
const router = express.Router();
const { getRoutine, addRoutine, updateRoutine, deleteRoutine } = require('../controllers/routineController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Everyone logged in can VIEW the weekly routine
router.route('/')
  .get(getRoutine)
  .post(authorize('admin', 'teacher'), addRoutine);

// Students can never modify the routine
router.route('/:id')
  .put(authorize('admin', 'teacher'), updateRoutine)
  .delete(authorize('admin', 'teacher'), deleteRoutine);

module.exports = router;
