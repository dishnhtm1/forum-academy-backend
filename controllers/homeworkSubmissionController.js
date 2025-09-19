const HomeworkSubmission = require('../models/HomeworkSubmission');
const Homework = require('../models/Homework');
const User = require('../models/User');

// @desc    Submit homework
// @route   POST /api/homework-submissions
// @access  Private (Student)
const submitHomework = async (req, res) => {
  try {
    const { homeworkId, textSubmission, fileUrls } = req.body;

    // Check if homework exists
    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    // Check if already submitted
    const existingSubmission = await HomeworkSubmission.findOne({
      homework: homeworkId,
      student: req.user.id
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this homework' });
    }

    // Check submission deadline
    if (new Date() > homework.dueDate && !homework.lateSubmissionAllowed) {
      return res.status(400).json({ message: 'Homework submission deadline has passed' });
    }

    const submission = new HomeworkSubmission({
      homework: homeworkId,
      student: req.user.id,
      textSubmission,
      fileUrls,
      submittedAt: new Date(),
      isLate: new Date() > homework.dueDate
    });

    await submission.save();
    
    // Populate fields for response
    await submission.populate([
      { path: 'homework', select: 'title description' },
      { path: 'student', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Homework submitted successfully',
      submission
    });

  } catch (error) {
    console.error('Error submitting homework:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get submissions for a homework (Teacher/Admin)
// @route   GET /api/homework-submissions/homework/:homeworkId
// @access  Private (Teacher/Admin)
const getSubmissionsByHomework = async (req, res) => {
  try {
    const { homeworkId } = req.params;

    const submissions = await HomeworkSubmission.find({ homework: homeworkId })
      .populate('student', 'name email')
      .populate('homework', 'title description dueDate')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get student's own submissions
// @route   GET /api/homework-submissions/my-submissions
// @access  Private (Student)
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await HomeworkSubmission.find({ student: req.user.id })
      .populate('homework', 'title description dueDate')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Grade homework submission
// @route   PUT /api/homework-submissions/:id/grade
// @access  Private (Teacher/Admin)
const gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;

    const submission = await HomeworkSubmission.findById(id)
      .populate('student', 'name email')
      .populate('homework', 'title');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedAt = new Date();
    submission.gradedBy = req.user.id;

    await submission.save();

    res.json({
      message: 'Homework graded successfully',
      submission
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single submission
// @route   GET /api/homework-submissions/:id
// @access  Private
const getSubmission = async (req, res) => {
  try {
    const submission = await HomeworkSubmission.findById(req.params.id)
      .populate('student', 'name email')
      .populate('homework', 'title description dueDate')
      .populate('gradedBy', 'name');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Students can only view their own submissions
    if (req.user.role === 'student' && submission.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update submission (for late submissions or revisions)
// @route   PUT /api/homework-submissions/:id
// @access  Private (Student - own submissions only)
const updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { textSubmission, fileUrls } = req.body;

    const submission = await HomeworkSubmission.findById(id);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Students can only update their own submissions
    if (req.user.role === 'student' && submission.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if homework allows revisions or if it's not graded yet
    if (submission.grade !== undefined && submission.grade !== null) {
      return res.status(400).json({ message: 'Cannot update graded submission' });
    }

    const homework = await Homework.findById(submission.homework);
    if (!homework.lateSubmissionAllowed && new Date() > homework.dueDate) {
      return res.status(400).json({ message: 'Late submissions not allowed for this homework' });
    }

    submission.textSubmission = textSubmission || submission.textSubmission;
    submission.fileUrls = fileUrls || submission.fileUrls;
    submission.submittedAt = new Date();
    submission.isLate = new Date() > homework.dueDate;

    await submission.save();
    
    await submission.populate([
      { path: 'homework', select: 'title description' },
      { path: 'student', select: 'name email' }
    ]);

    res.json({
      message: 'Submission updated successfully',
      submission
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete submission
// @route   DELETE /api/homework-submissions/:id
// @access  Private (Student - own submissions, Admin)
const deleteSubmission = async (req, res) => {
  try {
    const submission = await HomeworkSubmission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Students can only delete their own ungraded submissions
    if (req.user.role === 'student') {
      if (submission.student.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (submission.grade !== undefined && submission.grade !== null) {
        return res.status(400).json({ message: 'Cannot delete graded submission' });
      }
    }

    await HomeworkSubmission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitHomework,
  getSubmissionsByHomework,
  getMySubmissions,
  gradeSubmission,
  getSubmission,
  updateSubmission,
  deleteSubmission
};