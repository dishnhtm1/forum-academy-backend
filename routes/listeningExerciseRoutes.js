const express = require('express');
const router = express.Router();
const {
  getListeningExercises,
  getListeningExercise,
  createListeningExercise,
  updateListeningExercise,
  deleteListeningExercise,
  getAudioFile,
  upload
} = require('../controllers/listeningExerciseController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// @route   GET /api/listening-exercises
// @desc    Get all listening exercises
// @access  Private
router.get('/', getListeningExercises);

// @route   GET /api/listening-exercises/audio/:id
// @desc    Serve audio file
// @access  Private
router.get('/audio/:id', getAudioFile);

// @route   GET /api/listening-exercises/:id
// @desc    Get single listening exercise
// @access  Private
router.get('/:id', getListeningExercise);

// @route   POST /api/listening-exercises
// @desc    Create new listening exercise
// @access  Private (Faculty/Admin)
router.post('/', authorize('faculty', 'admin'), upload.single('audioFile'), createListeningExercise);

// @route   PUT /api/listening-exercises/:id
// @desc    Update listening exercise
// @access  Private (Faculty/Admin)
router.put('/:id', authorize('faculty', 'admin'), upload.single('audioFile'), updateListeningExercise);

// @route   DELETE /api/listening-exercises/:id
// @desc    Delete listening exercise
// @access  Private (Faculty/Admin)
router.delete('/:id', authorize('faculty', 'admin'), deleteListeningExercise);

module.exports = router;