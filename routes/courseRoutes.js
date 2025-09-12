const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/courses
// @desc    Get all courses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'firstName lastName email')
      .populate('students', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName email')
      .populate('students', 'firstName lastName email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Faculty/Admin only)
router.post('/', protect, authorize('superadmin', 'admin', 'faculty', 'teacher'), async (req, res) => {
  try {
    const {
      title, description, code, category, level, duration,
      startDate, endDate, maxStudents, isActive
    } = req.body;

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ message: 'Course code already exists' });
    }

    const course = new Course({
      title,
      description,
      code,
      instructor: req.user._id,
      category,
      level,
      duration,
      startDate,
      endDate,
      maxStudents,
      isActive
    });

    const savedCourse = await course.save();
    await savedCourse.populate('instructor', 'firstName lastName email');
    
    res.status(201).json(savedCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Faculty/Admin only)
router.put('/:id', protect, authorize('superadmin', 'admin', 'faculty', 'teacher'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && 
        !['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('instructor', 'firstName lastName email')
     .populate('students', 'firstName lastName email');
    
    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Faculty/Admin only)
router.delete('/:id', protect, authorize('superadmin', 'admin', 'faculty', 'teacher'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && 
        !['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses/:id/students
// @desc    Add student to course
// @access  Private (Faculty/Admin only)
router.post('/:id/students', protect, authorize('superadmin', 'admin', 'faculty', 'teacher'), async (req, res) => {
  try {
    const { studentIds } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Add students to course
    const uniqueStudentIds = [...new Set(studentIds)];
    course.students = [...new Set([...course.students, ...uniqueStudentIds])];
    
    await course.save();
    await course.populate('students', 'firstName lastName email');
    
    res.json(course);
  } catch (error) {
    console.error('Error adding students to course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id/students/:studentId
// @desc    Remove student from course
// @access  Private (Faculty/Admin only)
router.delete('/:id/students/:studentId', protect, authorize('superadmin', 'admin', 'faculty', 'teacher'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.students = course.students.filter(
      student => student.toString() !== req.params.studentId
    );
    
    await course.save();
    await course.populate('students', 'firstName lastName email');
    
    res.json(course);
  } catch (error) {
    console.error('Error removing student from course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
