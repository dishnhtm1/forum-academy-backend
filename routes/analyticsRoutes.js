// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const Progress = require('../models/Progress');
const User = require('../models/User');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const Homework = require('../models/Homework');

console.log('🔧 Loading analyticsRoutes.js...');

// Teacher Analytics endpoint
router.get('/teacher', authenticate, async (req, res) => {
  try {
    console.log(`📊 Fetching teacher analytics for user: ${req.user ? req.user.id : 'undefined'}, role: ${req.user ? req.user.role : 'undefined'}`);
    console.log('🔍 Full req.user object:', req.user);
    
    // Check if user exists
    if (!req.user) {
      console.log('❌ No user in request object');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. No user found.'
      });
    }
    
    // Only teachers and admins can access this endpoint
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      console.log(`❌ Access denied. User role: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers can access analytics.'
      });
    }

    const teacherId = req.user.id;
    const currentDate = new Date();
    const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get teacher's students
    const students = await User.find({ 
      role: 'student',
      isApproved: true 
    }).select('firstName lastName email createdAt');

    // Get teacher's progress records
    const progressRecords = await Progress.find({ teacher: teacherId })
      .populate('student', 'firstName lastName email')
      .populate('teacher', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Get teacher's courses
    const courses = await Course.find({ teacher: teacherId })
      .populate('teacher', 'firstName lastName email');

    // Calculate performance trends (last 4 weeks)
    const performanceTrends = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(currentDate.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(currentDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      
      const weekProgress = progressRecords.filter(record => {
        const recordDate = new Date(record.createdAt);
        return recordDate >= weekStart && recordDate < weekEnd;
      });

      const avgScore = weekProgress.length > 0 
        ? weekProgress.reduce((sum, record) => sum + record.percentage, 0) / weekProgress.length 
        : 0;

      performanceTrends.push({
        week: `Week ${4 - i}`,
        averageScore: Math.round(avgScore * 100) / 100,
        submissions: weekProgress.length
      });
    }

    // Calculate assignment type distribution
    const assignmentTypes = progressRecords.reduce((acc, record) => {
      const type = record.assignmentType || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Calculate grade distribution
    const gradeDistribution = progressRecords.reduce((acc, record) => {
      const grade = record.grade || 'N/A';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});

    // Calculate recent activity
    const recentProgress = progressRecords.slice(0, 10).map(record => ({
      id: record._id,
      studentName: `${record.student?.firstName} ${record.student?.lastName}`,
      assignment: record.assignment,
      subject: record.subject,
      grade: record.grade,
      percentage: record.percentage,
      date: record.createdAt,
      type: record.assignmentType
    }));

    // Calculate statistics
    const totalSubmissions = progressRecords.length;
    const averageScore = totalSubmissions > 0 
      ? progressRecords.reduce((sum, record) => sum + record.percentage, 0) / totalSubmissions 
      : 0;

    const recentSubmissions = progressRecords.filter(record => 
      new Date(record.createdAt) >= oneWeekAgo
    ).length;

    const activeStudents = new Set(
      progressRecords
        .filter(record => new Date(record.createdAt) >= oneMonthAgo)
        .map(record => record.student?._id?.toString())
    ).size;

    const analyticsData = {
      success: true,
      teacherInfo: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      overview: {
        totalStudents: students.length,
        totalCourses: courses.length,
        totalSubmissions: totalSubmissions,
        activeStudents: activeStudents,
        averageScore: Math.round(averageScore * 100) / 100,
        recentSubmissions: recentSubmissions
      },
      performanceTrends: performanceTrends,
      assignmentTypeDistribution: assignmentTypes,
      gradeDistribution: gradeDistribution,
      recentActivity: recentProgress,
      charts: {
        performanceData: {
          labels: performanceTrends.map(trend => trend.week),
          datasets: [{
            label: 'Average Score (%)',
            data: performanceTrends.map(trend => trend.averageScore),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          }]
        },
        engagementData: {
          labels: Object.keys(assignmentTypes),
          datasets: [{
            data: Object.values(assignmentTypes),
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(255, 159, 64, 0.8)'
            ]
          }]
        }
      }
    };

    console.log(`✅ Teacher analytics calculated: ${totalSubmissions} submissions, ${activeStudents} active students`);
    res.json(analyticsData);

  } catch (error) {
    console.error('❌ Error fetching teacher analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher analytics',
      error: error.message
    });
  }
});

// Example: Return fake dashboard stats so frontend stops 404
router.get('/dashboard', (req, res) => {
  const period = req.query.period || 'month';
  res.json({
    period,
    users: 120,
    courses: 8,
    quizzesTaken: 45,
    submissions: 30,
    timestamp: new Date().toISOString()
  });
});

// Stats endpoint for dashboard
router.get('/stats', (req, res) => {
  res.json({
    totalUsers: 150,
    totalCourses: 12,
    totalQuizzes: 25,
    totalHomework: 18,
    totalListeningExercises: 8,
    activeUsers: 75,
    completedCourses: 45,
    averageScore: 85
  });
});

// Enrollments endpoint
router.get('/enrollments', (req, res) => {
  res.json([
    {
      id: 1,
      studentName: 'John Doe',
      courseName: 'JavaScript Fundamentals',
      enrolledAt: new Date().toISOString(),
      progress: 75,
      status: 'active'
    },
    {
      id: 2,
      studentName: 'Jane Smith', 
      courseName: 'React Advanced',
      enrolledAt: new Date().toISOString(),
      progress: 60,
      status: 'active'
    }
  ]);
});

// Enrollment logs endpoint
router.get('/enrollment-logs', (req, res) => {
  res.json([
    {
      id: 1,
      action: 'enrolled',
      studentName: 'John Doe',
      courseName: 'JavaScript Fundamentals',
      timestamp: new Date().toISOString(),
      details: 'Student enrolled in course'
    },
    {
      id: 2,
      action: 'completed',
      studentName: 'Jane Smith',
      courseName: 'HTML & CSS Basics',
      timestamp: new Date().toISOString(),
      details: 'Student completed course'
    }
  ]);
});

module.exports = router;
