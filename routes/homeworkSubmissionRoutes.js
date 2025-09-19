const express = require('express');
const router = express.Router();
const {
  submitHomework,
  getSubmissionsByHomework,
  getMySubmissions,
  gradeSubmission,
  getSubmission,
  updateSubmission,
  deleteSubmission
} = require('../controllers/homeworkSubmissionController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// @route   POST /api/homework-submissions
// @desc    Submit homework
// @access  Private (Student)
router.post('/', authorize(['student']), submitHomework);

// @route   GET /api/homework-submissions/my-submissions
// @desc    Get student's own submissions
// @access  Private (Student)
router.get('/my-submissions', authorize(['student']), getMySubmissions);

// @route   GET /api/homework-submissions/homework/:homeworkId
// @desc    Get all submissions for a homework
// @access  Private (Teacher/Admin)
router.get('/homework/:homeworkId', authorize(['faculty', 'admin']), getSubmissionsByHomework);

// @route   GET /api/homework-submissions/:id
// @desc    Get single submission
// @access  Private
router.get('/:id', getSubmission);

// @route   PUT /api/homework-submissions/:id
// @desc    Update submission
// @access  Private (Student - own submissions only)
router.put('/:id', authorize(['student']), updateSubmission);

// @route   PUT /api/homework-submissions/:id/grade
// @desc    Grade homework submission
// @access  Private (Teacher/Admin)
router.put('/:id/grade', authorize(['faculty', 'admin']), gradeSubmission);

// @route   DELETE /api/homework-submissions/:id
// @desc    Delete submission
// @access  Private (Student - own submissions, Admin)
router.delete('/:id', deleteSubmission);

module.exports = router;