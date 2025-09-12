const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'video', 'audio', 'document', 'image', 'other']
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['lecture', 'assignment', 'reading', 'supplementary', 'exam', 'other']
  },
  week: {
    type: Number,
    default: 1
  },
  lesson: {
    type: Number,
    default: 1
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  accessLevel: {
    type: String,
    enum: ['public', 'course_students', 'instructor_only'],
    default: 'course_students'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  duration: {
    type: Number // for video/audio files in seconds
  }
}, {
  timestamps: true
});

// Index for better query performance
courseMaterialSchema.index({ course: 1, category: 1 });
courseMaterialSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
