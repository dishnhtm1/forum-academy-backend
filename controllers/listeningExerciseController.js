const ListeningExercise = require('../models/ListeningExercise');
const ListeningSubmission = require('../models/ListeningSubmission');
const multer = require('multer');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// GridFS bucket for storing large audio files
let gfsBucket;
mongoose.connection.once('open', () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'audioFiles'
  });
});

// Configure multer for memory storage (save to MongoDB)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB limit to handle larger files temporarily
  },
  fileFilter: function (req, file, cb) {
    console.log('🔍 File upload filter - File:', file.originalname, 'Size:', file.size, 'Type:', file.mimetype);
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

// @desc    Get all listening exercises
// @route   GET /api/listening-exercises
// @access  Private
const getListeningExercises = async (req, res) => {
  try {
    const exercises = await ListeningExercise.find()
      .populate('course', 'title code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(exercises);
  } catch (error) {
    console.error('Error fetching listening exercises:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single listening exercise
// @route   GET /api/listening-exercises/:id
// @access  Private
const getListeningExercise = async (req, res) => {
  try {
    const exercise = await ListeningExercise.findById(req.params.id)
      .populate('course', 'title code')
      .populate('createdBy', 'name email');

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    console.error('Error fetching listening exercise:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create listening exercise
// @route   POST /api/listening-exercises
// @access  Private (Faculty/Admin)
const createListeningExercise = async (req, res) => {
  try {
    const {
      title,
      description,
      course,
      level,
      instructions,
      transcript,
      timeLimit,
      playLimit,
      questions,
      createdBy
    } = req.body;

    // Parse questions if it's a string
    let parsedQuestions = questions;
    if (typeof questions === 'string') {
      parsedQuestions = JSON.parse(questions);
    }

    const exerciseData = {
      title,
      description,
      course,
      level,
      instructions,
      transcript,
      timeLimit: parseInt(timeLimit) || 30,
      playLimit: parseInt(playLimit) || 3,
      questions: parsedQuestions || [],
      createdBy: createdBy || req.user.id
    };

    // Add audio file information if uploaded
    if (req.file) {
      console.log('📁 Processing uploaded file:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // Check file size limit
      const maxSize = 30 * 1024 * 1024; // 30MB limit for testing
      if (req.file.size > maxSize) {
        console.log('❌ File too large:', req.file.size, 'Max:', maxSize);
        return res.status(400).json({ 
          message: 'Audio file too large. Maximum size is 30MB.',
          fileSize: req.file.size,
          maxSize: maxSize
        });
      }

      // Store file in GridFS instead of base64
      console.log('� Storing file in GridFS...');
      
      try {
        // Create a readable stream from the buffer
        const uploadStream = gfsBucket.openUploadStream(req.file.originalname, {
          metadata: {
            exerciseId: null, // Will be updated after exercise is created
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadDate: new Date()
          }
        });

        // Store the GridFS file ID in the exercise data
        const fileId = uploadStream.id;
        
        exerciseData.audioFile = {
          filename: req.file.originalname,
          originalName: req.file.originalname,
          gridfsId: fileId, // Store GridFS ObjectId instead of base64 data
          size: req.file.size,
          mimetype: req.file.mimetype,
          uploadDate: new Date()
        };

        // Upload the file to GridFS
        uploadStream.end(req.file.buffer);

        console.log('✅ File stored in GridFS with ID:', fileId);
      } catch (error) {
        console.error('❌ Error storing file in GridFS:', error);
        return res.status(500).json({ 
          message: 'Error storing audio file',
          error: error.message 
        });
      }
    }

    const exercise = new ListeningExercise(exerciseData);
    await exercise.save();

    // Populate the response
    await exercise.populate([
      { path: 'course', select: 'title code' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Listening exercise created successfully',
      exercise
    });

  } catch (error) {
    console.error('Error creating listening exercise:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update listening exercise
// @route   PUT /api/listening-exercises/:id
// @access  Private (Faculty/Admin)
const updateListeningExercise = async (req, res) => {
  try {
    const exercise = await ListeningExercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    const {
      title,
      description,
      course,
      level,
      instructions,
      transcript,
      timeLimit,
      playLimit,
      questions
    } = req.body;

    // Parse questions if it's a string
    let parsedQuestions = questions;
    if (typeof questions === 'string') {
      parsedQuestions = JSON.parse(questions);
    }

    // Update fields
    exercise.title = title || exercise.title;
    exercise.description = description || exercise.description;
    exercise.course = course || exercise.course;
    exercise.level = level || exercise.level;
    exercise.instructions = instructions || exercise.instructions;
    exercise.transcript = transcript || exercise.transcript;
    exercise.timeLimit = timeLimit ? parseInt(timeLimit) : exercise.timeLimit;
    exercise.playLimit = playLimit ? parseInt(playLimit) : exercise.playLimit;
    exercise.questions = parsedQuestions || exercise.questions;

    // Update audio file if new one uploaded
    if (req.file) {
      console.log('📁 Processing uploaded file for update:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // Check file size limit
      const maxSize = 30 * 1024 * 1024; // 30MB limit for testing
      if (req.file.size > maxSize) {
        console.log('❌ File too large:', req.file.size, 'Max:', maxSize);
        return res.status(400).json({ 
          message: 'Audio file too large. Maximum size is 30MB.',
          fileSize: req.file.size,
          maxSize: maxSize
        });
      }

      // Delete old file from GridFS if it exists
      if (exercise.audioFile && exercise.audioFile.gridfsId) {
        try {
          await gfsBucket.delete(exercise.audioFile.gridfsId);
          console.log('🗑️ Old file deleted from GridFS');
        } catch (deleteError) {
          console.warn('⚠️ Could not delete old file from GridFS:', deleteError.message);
        }
      }

      // Store new file in GridFS
      console.log('� Storing new file in GridFS...');
      
      try {
        const uploadStream = gfsBucket.openUploadStream(req.file.originalname, {
          metadata: {
            exerciseId: exercise._id,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadDate: new Date()
          }
        });

        const fileId = uploadStream.id;
        
        exercise.audioFile = {
          filename: req.file.originalname,
          originalName: req.file.originalname,
          gridfsId: fileId,
          size: req.file.size,
          mimetype: req.file.mimetype,
          uploadDate: new Date()
        };

        uploadStream.end(req.file.buffer);
        console.log('✅ New file stored in GridFS with ID:', fileId);
      } catch (error) {
        console.error('❌ Error storing new file in GridFS:', error);
        return res.status(500).json({ 
          message: 'Error storing audio file',
          error: error.message 
        });
      }
    }

    await exercise.save();

    // Populate the response
    await exercise.populate([
      { path: 'course', select: 'title code' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      message: 'Listening exercise updated successfully',
      exercise
    });

  } catch (error) {
    console.error('Error updating listening exercise:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete listening exercise
// @route   DELETE /api/listening-exercises/:id
// @access  Private (Faculty/Admin)
const deleteListeningExercise = async (req, res) => {
  try {
    const exercise = await ListeningExercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    await ListeningExercise.findByIdAndDelete(req.params.id);

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Error deleting listening exercise:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Serve audio file
// @route   GET /api/listening-exercises/audio/:id
// @access  Private
const getAudioFile = async (req, res) => {
  try {
    console.log('🎵 Audio file request for exercise ID:', req.params.id);
    console.log('👤 Request user:', req.user ? req.user.id : 'No user');
    
    const exercise = await ListeningExercise.findById(req.params.id);
    console.log('📚 Exercise found:', exercise ? 'Yes' : 'No');
    
    if (!exercise) {
      console.log('❌ Exercise not found');
      return res.status(404).json({ message: 'Exercise not found' });
    }
    
    console.log('🔍 Exercise audioFile field:', exercise.audioFile);
    
    if (!exercise.audioFile || !exercise.audioFile.gridfsId) {
      console.log('❌ No audio file data in exercise');
      return res.status(404).json({ 
        message: 'Audio file not found. This exercise was created without an audio file. Please edit the exercise and upload an audio file.',
        hint: 'Use the edit button to upload an audio file for this exercise.'
      });
    }

    console.log('📁 Audio file info:', {
      filename: exercise.audioFile.filename,
      originalName: exercise.audioFile.originalName,
      size: exercise.audioFile.size,
      mimetype: exercise.audioFile.mimetype,
      gridfsId: exercise.audioFile.gridfsId
    });
    
    console.log('✅ Audio file found in GridFS, streaming...');
    
    try {
      // Create download stream from GridFS
      const downloadStream = gfsBucket.openDownloadStream(exercise.audioFile.gridfsId);
      
      // Set appropriate headers for audio streaming
      const mimetype = exercise.audioFile.mimetype || 'audio/mpeg';
      res.setHeader('Content-Type', mimetype);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', exercise.audioFile.size);
      res.setHeader('Content-Disposition', `inline; filename="${exercise.audioFile.filename}"`);
      
      // Handle stream errors
      downloadStream.on('error', (error) => {
        console.error('❌ GridFS download error:', error);
        if (!res.headersSent) {
          res.status(404).json({ message: 'Audio file not found in storage', error: error.message });
        }
      });
      
      // Pipe the file stream to the response
      downloadStream.pipe(res);
      
    } catch (gridfsError) {
      console.error('❌ GridFS error:', gridfsError);
      res.status(500).json({ message: 'Error retrieving audio file', error: gridfsError.message });
    }
    
  } catch (error) {
    console.error('❌ Error serving audio file:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getListeningExercises,
  getListeningExercise,
  createListeningExercise,
  updateListeningExercise,
  deleteListeningExercise,
  getAudioFile,
  upload
};