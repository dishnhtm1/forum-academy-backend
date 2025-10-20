const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');
const ZoomMeeting = require('../models/ZoomMeeting');
const AttendanceRecord = require('../models/AttendanceRecord');
const zoomService = require('../services/zoomService');

// Get all Zoom meetings (with database persistence)
router.get('/meetings', async (req, res) => {
  try {
    const meetings = await ZoomMeeting.find()
      .populate('courseId', 'title')
      .populate('instructor', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      meetings: meetings,
      total: meetings.length,
      message: 'Zoom meetings loaded successfully'
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Zoom meetings for a specific student (based on enrollment)
router.get('/meetings/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Convert string studentId to ObjectId if it's a valid ObjectId format
    let queryStudentId = studentId;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      queryStudentId = new mongoose.Types.ObjectId(studentId);
    }
    
    // Find meetings where the student is in the allowedStudents array
    const meetings = await ZoomMeeting.find({
      allowedStudents: queryStudentId,
      status: { $in: ['scheduled', 'live'] } // Only show active meetings
    })
    .populate('courseId', 'title description')
    .populate('instructor', 'firstName lastName email')
    .populate('allowedStudents', 'firstName lastName email')
    .sort({ startTime: 1 }); // Sort by start time, earliest first

    // Format meetings for student dashboard
    const formattedMeetings = meetings.map(meeting => ({
      _id: meeting._id,
      title: meeting.title,
      description: meeting.description,
      courseName: meeting.courseName,
      instructorName: meeting.instructorName,
      startTime: meeting.startTime,
      duration: meeting.duration,
      status: meeting.status,
      meetingId: meeting.meetingId,
      meetingPassword: meeting.meetingPassword,
      joinUrl: meeting.joinUrl,
      isEnrolled: true, // Since we filtered by enrollment
      settings: meeting.settings
    }));

    res.json({
      success: true,
      meetings: formattedMeetings,
      total: formattedMeetings.length,
      message: 'Student Zoom meetings loaded successfully'
    });
  } catch (error) {
    console.error('Error fetching student meetings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Zoom meetings for a specific teacher
router.get('/meetings/teacher/:teacherId', authenticate, roleMiddleware(['teacher', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, courseId } = req.query;
    const skip = (page - 1) * limit;

    let query = { instructor: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (courseId) {
      query.courseId = courseId;
    }

    const meetings = await ZoomMeeting.find(query)
      .populate('courseId', 'title')
      .populate('allowedStudents', 'firstName lastName email')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ZoomMeeting.countDocuments(query);

    res.json({
      success: true,
      meetings,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching teacher meetings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific Zoom meeting
router.get('/meetings/:id', async (req, res) => {
  try {
    const meeting = await ZoomMeeting.findById(req.params.id)
      .populate('courseId', 'title')
      .populate('instructor', 'firstName lastName')
      .populate('allowedStudents', 'firstName lastName email');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    res.json({
      success: true,
      meeting
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new Zoom meeting (with database persistence)
router.post('/meetings', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      courseId, 
      startTime, 
      duration = 60, 
      allowedStudents = [],
      settings = {}
    } = req.body;

    // For now, use your personal meeting ID for all meetings
    // In production, this would create real Zoom meetings via API
    const personalMeetingId = '3360628977';
    const uniqueMeetingId = personalMeetingId + '-' + Math.floor(Math.random() * 1000).toString();
    const password = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    // Get course information to populate courseName
    const Course = require('../models/Course');
    const course = await Course.findById(courseId);
    const courseName = course ? course.title : 'Live Class';

    // Get instructor information
    const User = require('../models/User');
    const instructor = req.user?.id ? await User.findById(req.user.id) : null;
    const instructorName = instructor ? `${instructor.firstName} ${instructor.lastName}` : 'Instructor';

    // If no allowedStudents specified, get all enrolled students from the course
    let enrolledStudents = allowedStudents;
    if (!allowedStudents || allowedStudents.length === 0) {
      if (course && course.students) {
        enrolledStudents = course.students;
      }
    }

    const meeting = new ZoomMeeting({
      title: title,
      description: description || 'Live class session',
      startTime: startTime || new Date(),
      duration: duration,
      meetingId: uniqueMeetingId,
      meetingPassword: password,
      joinUrl: `https://zoom.us/j/${personalMeetingId}?pwd=${password}`,
      courseId: courseId || new mongoose.Types.ObjectId(),
      courseName: courseName,
      instructor: req.user?.id || new mongoose.Types.ObjectId(),
      instructorName: instructorName,
      allowedStudents: enrolledStudents,
      status: 'scheduled',
      settings: {
        waitingRoom: true,
        muteOnEntry: true,
        recordMeeting: false,
        autoRecording: 'local',
        ...settings
      }
    });

    await meeting.save();

    // Populate the response
    await meeting.populate('courseId', 'title students');
    await meeting.populate('instructor', 'firstName lastName');
    await meeting.populate('allowedStudents', 'firstName lastName email');

    res.status(201).json({
      success: true,
      meeting: meeting,
      message: 'Meeting created successfully with automatic enrollment'
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a Zoom meeting
router.put('/meetings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const meeting = await ZoomMeeting.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    res.json({
      success: true,
      meeting: meeting,
      message: 'Meeting updated successfully'
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a Zoom meeting
router.delete('/meetings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await ZoomMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Delete the meeting from database
    await ZoomMeeting.findByIdAndDelete(id);
    
    // Also delete related attendance records
    await AttendanceRecord.deleteMany({ meeting: id });
    
    res.json({
      success: true,
      message: 'Meeting deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start a Zoom meeting
router.post('/meetings/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await ZoomMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Update meeting status to live
    meeting.status = 'live';
    meeting.startedAt = new Date();
    await meeting.save();
    
    res.json({
      success: true,
      meeting: meeting,
      message: 'Meeting started successfully'
    });
  } catch (error) {
    console.error('Error starting meeting:', error);
    res.status(500).json({ error: error.message });
  }
});

// End a Zoom meeting
router.post('/meetings/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await ZoomMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Update meeting status to ended
    meeting.status = 'ended';
    meeting.endedAt = new Date();
    await meeting.save();
    
    res.json({
      success: true,
      meeting: meeting,
      message: 'Meeting ended successfully'
    });
  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Join a Zoom meeting
router.post('/meetings/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    
    const meeting = await ZoomMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if student is allowed to join
    if (!meeting.allowedStudents.includes(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to join this meeting.'
      });
    }

    // Record attendance
    const attendance = new AttendanceRecord({
      meeting: id,
      student: studentId,
      joinTime: new Date()
    });

    await attendance.save();
    
    res.json({
      success: true,
      meeting: meeting,
      attendance: attendance,
      message: 'Successfully joined meeting'
    });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update attendance record
router.post('/meetings/:id/attendance', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, leaveTime } = req.body;
    
    const attendance = await AttendanceRecord.findOne({
      meeting: id,
      student: studentId
    });
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    attendance.leaveTime = leaveTime || new Date();
    attendance.duration = attendance.leaveTime - attendance.joinTime;
    await attendance.save();
    
    res.json({
      success: true,
      attendance: attendance,
      message: 'Attendance updated successfully'
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get SDK signature for Zoom Web SDK
router.get('/sdk-signature/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role = 0 } = req.query;
    
    // For testing, return a mock signature
    // In production, this would generate a real JWT signature
    const mockSignature = {
      signature: 'mock_signature_' + id + '_' + role + '_' + Date.now(),
      meetingId: id,
      role: parseInt(role),
      timestamp: Date.now(),
      expiresIn: 3600
    };
    
    res.json({
      success: true,
      signature: mockSignature.signature,
      meetingId: id,
      role: parseInt(role),
      message: 'SDK signature generated successfully'
    });
  } catch (error) {
    console.error('Error generating SDK signature:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;