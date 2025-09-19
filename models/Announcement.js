const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'teachers', 'specific_class', 'specific_student'],
    default: 'all'
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  subject: {
    type: String,
    trim: true
  },
  gradeLevel: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['general', 'assignment', 'exam', 'event', 'reminder', 'grade_update'],
    default: 'general'
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isSticky: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Virtual for checking if announcement is active
announcementSchema.virtual('isActive').get(function() {
  const now = new Date();
  const isPublished = this.isPublished;
  const isAfterPublishDate = this.publishDate <= now;
  const isBeforeExpiryDate = !this.expiryDate || this.expiryDate >= now;
  
  return isPublished && isAfterPublishDate && isBeforeExpiryDate;
});

// Virtual for read count
announcementSchema.virtual('readCount').get(function() {
  return this.readBy ? this.readBy.length : 0;
});

// Index for efficient queries
announcementSchema.index({ author: 1, createdAt: -1 });
announcementSchema.index({ targetAudience: 1, isPublished: 1, publishDate: -1 });
announcementSchema.index({ publishDate: -1, expiryDate: 1 });
announcementSchema.index({ isSticky: -1, priority: -1, publishDate: -1 });
announcementSchema.index({ subject: 1, gradeLevel: 1 });

// Method to mark as read by a user
announcementSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
  if (!alreadyRead) {
    this.readBy.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to check if read by a user
announcementSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

module.exports = mongoose.model('Announcement', announcementSchema);