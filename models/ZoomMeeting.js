const mongoose = require('mongoose');

const zoomMeetingSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
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
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  joinUrl: {
    type: String,
    required: true
  },
  meetingPassword: {
    type: String,
    default: ''
  },
  allowedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  settings: {
    waitingRoom: {
      type: Boolean,
      default: true
    },
    muteOnEntry: {
      type: Boolean,
      default: true
    },
    recordMeeting: {
      type: Boolean,
      default: false
    },
    autoRecording: {
      type: String,
      enum: ['local', 'cloud', 'none'],
      default: 'none'
    }
  },
  attendance: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    joinTime: {
      type: Date,
      default: Date.now
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
      enum: ['present', 'left'],
      default: 'present'
    }
  }],
  recording: {
    hasRecording: {
      type: Boolean,
      default: false
    },
    recordingUrl: {
      type: String,
      default: ''
    },
    recordingStartTime: {
      type: Date,
      default: null
    },
    recordingEndTime: {
      type: Date,
      default: null
    }
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
zoomMeetingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
zoomMeetingSchema.index({ instructor: 1, startTime: 1 });
zoomMeetingSchema.index({ status: 1 });
zoomMeetingSchema.index({ courseId: 1 });

module.exports = mongoose.model('ZoomMeeting', zoomMeetingSchema);
