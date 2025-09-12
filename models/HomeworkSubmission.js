const mongoose = require('mongoose');

const homeworkSubmissionSchema = new mongoose.Schema({
  homework: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Homework',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submissionText: {
    type: String // for text entries
  },
  attachments: [{
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isLate: {
    type: Boolean,
    default: false
  },
  daysLate: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned', 'resubmitted'],
    default: 'submitted'
  },
  grade: {
    type: Number
  },
  percentage: {
    type: Number
  },
  feedback: {
    type: String
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  rubric: [{
    criteria: String,
    points: Number,
    maxPoints: Number,
    feedback: String
  }],
  attemptNumber: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for better query performance
homeworkSubmissionSchema.index({ homework: 1, student: 1 });
homeworkSubmissionSchema.index({ status: 1 });

module.exports = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);
