const Homework = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Course = require('../models/Course');

// @desc    Get all homework assignments
// @route   GET /api/homework
// @access  Private (Instructors/Admin)
const getHomework = async (req, res) => {
  try {
    console.log('📚 Fetching homework assignments...');
    
    const homework = await Homework.find()
      .populate('course', 'title code')
      .populate('assignedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${homework.length} homework assignments`);
    res.json(homework);
  } catch (error) {
    console.error('❌ Error fetching homework:', error);
    res.status(500).json({ message: 'Server error while fetching homework' });
  }
};

// @desc    Get homework by ID
// @route   GET /api/homework/:id
// @access  Private
const getHomeworkById = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate('course', 'title code')
      .populate('assignedBy', 'firstName lastName email');

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    res.json(homework);
  } catch (error) {
    console.error('Error fetching homework:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new homework
// @route   POST /api/homework
// @access  Private (Instructors/Admin)
const createHomework = async (req, res) => {
  try {
    console.log('📝 Creating new homework assignment...');
    console.log('Request body:', req.body);

    const {
      title,
      description,
      instructions,
      course,
      category,
      maxPoints,
      dueDate,
      assignedDate,
      submissionType,
      maxFileSize,
      latePenalty,
      lateSubmissionAllowed,
      isPublished,
      assignedBy
    } = req.body;

    // Validate required fields
    if (!title || !description || !course || !maxPoints || !dueDate) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: title, description, course, maxPoints, dueDate' 
      });
    }

    // Verify course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const homework = new Homework({
      title,
      description,
      instructions,
      course,
      category: category || 'assignment',
      maxPoints,
      dueDate,
      assignedDate: assignedDate || Date.now(),
      submissionType: submissionType || 'file_upload',
      maxFileSize: maxFileSize || 10,
      latePenalty: latePenalty || 0,
      lateSubmissionAllowed: lateSubmissionAllowed || false,
      isPublished: isPublished !== undefined ? isPublished : true,
      assignedBy: assignedBy || req.user.id
    });

    const savedHomework = await homework.save();
    
    // Populate the saved homework before sending response
    const populatedHomework = await Homework.findById(savedHomework._id)
      .populate('course', 'title code')
      .populate('assignedBy', 'firstName lastName email');

    console.log('✅ Homework created successfully:', populatedHomework.title);
    res.status(201).json(populatedHomework);
  } catch (error) {
    console.error('❌ Error creating homework:', error);
    res.status(500).json({ message: 'Server error while creating homework' });
  }
};

// @desc    Update homework
// @route   PUT /api/homework/:id
// @access  Private (Instructors/Admin)
const updateHomework = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        homework[key] = req.body[key];
      }
    });

    const updatedHomework = await homework.save();
    
    // Populate before sending response
    const populatedHomework = await Homework.findById(updatedHomework._id)
      .populate('course', 'title code')
      .populate('assignedBy', 'firstName lastName email');

    res.json(populatedHomework);
  } catch (error) {
    console.error('Error updating homework:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete homework
// @route   DELETE /api/homework/:id
// @access  Private (Instructors/Admin)
const deleteHomework = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    // Also delete all submissions for this homework
    await HomeworkSubmission.deleteMany({ homework: req.params.id });

    await homework.deleteOne();

    res.json({ message: 'Homework and all related submissions deleted successfully' });
  } catch (error) {
    console.error('Error deleting homework:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get homework for a specific course
// @route   GET /api/homework/course/:courseId
// @access  Private
const getHomeworkByCourse = async (req, res) => {
  try {
    const homework = await Homework.find({ course: req.params.courseId })
      .populate('course', 'title code')
      .populate('assignedBy', 'firstName lastName email')
      .sort({ dueDate: 1 });

    res.json(homework);
  } catch (error) {
    console.error('Error fetching homework by course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getHomework,
  getHomeworkById,
  createHomework,
  updateHomework,
  deleteHomework,
  getHomeworkByCourse
};