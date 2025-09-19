const express = require('express');
const router = express.Router();
const {
  getHomework,
  getHomeworkById,
  createHomework,
  updateHomework,
  deleteHomework,
  getHomeworkByCourse
} = require('../controllers/homeworkController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/homework
// @desc    Get all homework assignments
// @access  Private (Instructors/Admin)
router.get('/', protect, getHomework);

// @route   GET /api/homework/course/:courseId
// @desc    Get homework for a specific course
// @access  Private
router.get('/course/:courseId', protect, getHomeworkByCourse);

// @route   GET /api/homework/:id
// @desc    Get homework by ID
// @access  Private
router.get('/:id', protect, getHomeworkById);

// @route   POST /api/homework
// @desc    Create new homework
// @access  Private (Instructors/Admin)
router.post('/', protect, authorize('admin', 'superadmin', 'faculty', 'teacher'), createHomework);

// @route   PUT /api/homework/:id
// @desc    Update homework
// @access  Private (Instructors/Admin)
router.put('/:id', protect, authorize('admin', 'superadmin', 'faculty', 'teacher'), updateHomework);

// @route   DELETE /api/homework/:id
// @desc    Delete homework
// @access  Private (Instructors/Admin)
router.delete('/:id', protect, authorize('admin', 'superadmin', 'faculty', 'teacher'), deleteHomework);

module.exports = router;