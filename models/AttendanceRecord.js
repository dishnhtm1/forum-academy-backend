const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ZoomMeeting',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  meetingTitle: {
    type: String,
    required: true
  },
  joinTime: {
    type: Date,
    required: true
  },
  leaveTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'left', 'absent'],
    default: 'present'
  },
  attendancePercentage: {
    type: Number, // percentage of meeting attended
    default: 100
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    platform: String
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
attendanceRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
attendanceRecordSchema.index({ meetingId: 1, studentId: 1 });
attendanceRecordSchema.index({ studentId: 1, createdAt: -1 });
attendanceRecordSchema.index({ courseId: 1, createdAt: -1 });
attendanceRecordSchema.index({ instructorId: 1, createdAt: -1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
