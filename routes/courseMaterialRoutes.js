const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CourseMaterial = require('../models/CourseMaterial');
const Course = require('../models/Course'); // Add Course model
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/course-materials';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow specific file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|txt|mp4|avi|mov|mp3|wav|aac/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: fileFilter
});

// Helper function to determine file type
const getFileType = (mimetype, filename) => {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('document') || mimetype.includes('word') || filename.endsWith('.doc') || filename.endsWith('.docx')) return 'document';
  return 'other';
};

// @route   GET /api/course-materials
// @desc    Get all course materials
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('📚 Fetching all course materials...');
    const { course, category, fileType } = req.query;
    let query = {};
    
    if (course) query.course = course;
    if (category) query.category = category;
    if (fileType) query.fileType = fileType;

    console.log('🔍 Query:', query);

    const materials = await CourseMaterial.find(query)
      .populate('course', 'title code')
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${materials.length} course materials`);
    console.log('📋 Materials:', materials.map(m => ({ id: m._id, title: m.title, course: m.course?.title })));
    
    res.json(materials);
  } catch (error) {
    console.error('❌ Error fetching course materials:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/course-materials/upload
// @desc    Upload course material
// @access  Private (Faculty/Admin only)
router.post('/upload', protect, authorize('superadmin', 'admin', 'faculty', 'teacher'), upload.single('file'), async (req, res) => {
  try {
    console.log('📁 File upload request received');
    console.log('📋 Request body:', req.body);
    console.log('� User info:', req.user ? { 
      id: req.user._id, 
      email: req.user.email, 
      role: req.user.role 
    } : 'No user');
    console.log('�📎 File info:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : 'No file');

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.user || !req.user._id) {
      console.log('❌ No user information available');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      title, description, course, category, week, lesson,
      tags, accessLevel
    } = req.body;

    console.log('🔍 Processing request data...');
    console.log('  - Title:', title);
    console.log('  - Course:', course);
    console.log('  - Category:', category);

    if (!title) {
      console.log('❌ Title is required');
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!course) {
      console.log('❌ Course is required');
      return res.status(400).json({ message: 'Course is required' });
    }

    const fileType = getFileType(req.file.mimetype, req.file.originalname);
    console.log('🔍 Detected file type:', fileType);

    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        if (typeof tags === 'string') {
          parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else {
          parsedTags = JSON.parse(tags);
        }
        console.log('🏷️ Parsed tags:', parsedTags);
      } catch (tagError) {
        console.log('⚠️ Error parsing tags, using empty array:', tagError.message);
        parsedTags = [];
      }
    }
    
    const materialData = {
      title,
      description: description || '',
      course,
      uploadedBy: req.user._id,
      fileType,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category: category || 'other',
      week: parseInt(week) || 1,
      lesson: parseInt(lesson) || 1,
      accessLevel: accessLevel || 'course_students',
      tags: parsedTags
    };

    console.log('💾 Creating material with data:', materialData);
    
    const material = new CourseMaterial(materialData);
    console.log('💾 Saving material to database...');
    const savedMaterial = await material.save();
    
    console.log('🔗 Populating references...');
    await savedMaterial.populate('course', 'title code');
    await savedMaterial.populate('uploadedBy', 'firstName lastName email');
    
    console.log('✅ Material saved successfully:', savedMaterial.title);
    res.status(201).json(savedMaterial);
  } catch (error) {
    console.error('❌ Error uploading material:', error.message);
    console.error('❌ Full error:', error);
    
    // Delete uploaded file if there was an error
    if (req.file && req.file.path) {
      try {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      } catch (deleteError) {
        console.error('Error deleting file:', deleteError);
      }
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/course-materials/:id
// @desc    Get single course material
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const material = await CourseMaterial.findById(req.params.id)
      .populate('course', 'title code')
      .populate('uploadedBy', 'firstName lastName email');
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    res.json(material);
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/course-materials/download/:id
// @desc    Download course material
// @access  Private
router.get('/download/:id', protect, async (req, res) => {
  try {
    const material = await CourseMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if file exists
    if (!fs.existsSync(material.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Increment download count
    material.downloadCount += 1;
    await material.save();

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${material.fileName}"`);
    res.setHeader('Content-Type', material.mimeType);
    
    // Stream the file
    const fileStream = fs.createReadStream(material.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading material:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/course-materials/:id
// @desc    Update course material
// @access  Private (Faculty/Admin only)
router.put('/:id', protect, authorize('superadmin', 'admin', 'faculty', 'teacher'), async (req, res) => {
  try {
    console.log('🔄 Updating material:', req.params.id);
    console.log('📋 Update data:', req.body);
    
    const material = await CourseMaterial.findById(req.params.id);
    
    if (!material) {
      console.log('❌ Material not found:', req.params.id);
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if user uploaded this material or is admin
    if (material.uploadedBy.toString() !== req.user._id.toString() && 
        !['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update this material' });
    }

    // Process tags if provided
    let updateData = { ...req.body };
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    console.log('🔍 Processed update data:', updateData);

    const updatedMaterial = await CourseMaterial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('course', 'title code')
     .populate('uploadedBy', 'firstName lastName email');
    
    console.log('✅ Material updated successfully:', updatedMaterial.title);
    res.json(updatedMaterial);
  } catch (error) {
    console.error('❌ Error updating material:', error.message);
    console.error('Error details:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// @route   DELETE /api/course-materials/:id
// @desc    Delete course material
// @access  Private (Faculty/Admin only)
router.delete('/:id', protect, authorize('superadmin', 'admin', 'faculty', 'teacher'), async (req, res) => {
  try {
    const material = await CourseMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if user uploaded this material or is admin
    if (material.uploadedBy.toString() !== req.user._id.toString() && 
        !['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this material' });
    }

    // Delete the file from filesystem
    if (fs.existsSync(material.filePath)) {
      fs.unlink(material.filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    await CourseMaterial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/course-materials/course/:courseId
// @desc    Get materials for specific course
// @access  Private
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const materials = await CourseMaterial.find({ course: req.params.courseId })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ week: 1, lesson: 1, createdAt: 1 });
    
    res.json(materials);
  } catch (error) {
    console.error('Error fetching course materials:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
