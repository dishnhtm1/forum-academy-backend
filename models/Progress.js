const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  assignment: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  grade: {
    type: String,
    required: true,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'],
    default: 'C'
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  maxScore: {
    type: Number,
    min: 1,
    max: 100,
    default: 100
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  comments: {
    type: String,
    trim: true
  },
  assignmentType: {
    type: String,
    enum: ['homework', 'quiz', 'exam', 'project', 'participation', 'other'],
    default: 'homework'
  },
  submissionDate: {
    type: Date
  },
  gradedDate: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Calculate percentage before saving
progressSchema.pre('save', function(next) {
  if (this.score !== undefined && this.maxScore !== undefined) {
    this.percentage = Math.round((this.score / this.maxScore) * 100);
  }
  next();
});

// Virtual for grade calculation based on percentage
progressSchema.virtual('calculatedGrade').get(function() {
  const percentage = this.percentage;
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 65) return 'D';
  return 'F';
});

// Index for efficient queries
progressSchema.index({ student: 1, subject: 1, createdAt: -1 });
progressSchema.index({ teacher: 1, createdAt: -1 });
progressSchema.index({ isPublished: 1, createdAt: -1 });

module.exports = mongoose.model('Progress', progressSchema);