const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // System notifications won't have a sender
  },
  type: {
    type: String,
    enum: [
      'student_message',
      'assignment_submission', 
      'admin_announcement',
      'quiz_submission',
      'grade_request',
      'enrollment',
      'homework_reminder',
      'parent_message',
      'system',
      'live_class_started',
      'live_class_ended',
      'zoom_class'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  content: {
    type: String, // Additional detailed content
    required: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    required: false
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['Progress', 'Homework', 'Quiz', 'Course', 'Announcement', 'User'],
      required: false
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Additional data specific to notification type
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Virtual for getting icon based on type
notificationSchema.virtual('icon').get(function() {
  const iconMap = {
    'student_message': 'message',
    'assignment_submission': 'file-text',
    'admin_announcement': 'bell',
    'quiz_submission': 'question-circle',
    'grade_request': 'question-circle',
    'enrollment': 'user',
    'homework_reminder': 'clock-circle',
    'parent_message': 'team',
    'system': 'setting',
    'live_class_started': 'video-camera',
    'live_class_ended': 'video-camera',
    'zoom_class': 'video-camera'
  };
  return iconMap[this.type] || 'bell';
});

// Virtual for getting color based on type and priority
notificationSchema.virtual('color').get(function() {
  if (this.priority === 'high') return '#f5222d';
  if (this.priority === 'low') return '#13c2c2';
  
  const colorMap = {
    'student_message': '#1890ff',
    'assignment_submission': '#52c41a',
    'admin_announcement': '#faad14',
    'quiz_submission': '#722ed1',
    'grade_request': '#fa8c16',
    'enrollment': '#52c41a',
    'homework_reminder': '#f5222d',
    'parent_message': '#722ed1',
    'system': '#13c2c2',
    'live_class_started': '#dc2626',
    'live_class_ended': '#6b7280',
    'zoom_class': '#dc2626'
  };
  return colorMap[this.type] || '#1890ff';
});

// Ensure virtuals are included in JSON
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);