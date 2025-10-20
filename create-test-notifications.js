// Test script to create sample notifications for testing
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Notification = require('./models/Notification');
const User = require('./models/User');
const NotificationService = require('./services/notificationService');

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/forum_academy', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestNotifications() {
  try {
    await connectDB();
    
    // Find admin users (teachers and admins)
    const adminUsers = await User.find({ 
      role: { $in: ['teacher', 'admin'] } 
    }).limit(2);
    
    const students = await User.find({ role: 'student' }).limit(3);
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin/teacher users found. Please create some first.');
      return;
    }
    
    if (students.length === 0) {
      console.log('❌ No student users found. Please create some first.');
      return;
    }
    
    console.log(`📧 Creating test notifications for ${adminUsers.length} teachers...`);
    
    const adminUser = adminUsers[0];
    const student1 = students[0];
    const student2 = students.length > 1 ? students[1] : student1;
    
    // Create various types of notifications
    const testNotifications = [
      {
        recipient: adminUser._id,
        sender: student1._id,
        type: 'assignment_submission',
        title: 'New Assignment Submission',
        message: `${student1.firstName} ${student1.lastName} submitted "Math Homework #5"`,
        priority: 'high',
        relatedEntity: {
          entityType: 'HomeworkSubmission',
          entityId: student1._id // Using student ID as placeholder
        },
        actionUrl: `/admin/homework/submissions`
      },
      {
        recipient: adminUser._id,
        sender: student2._id,
        type: 'student_message',
        title: 'Student Question',
        message: `${student2.firstName} ${student2.lastName} asked a question about the English lesson`,
        priority: 'medium',
        actionUrl: `/messages/${student2._id}`
      },
      {
        recipient: adminUser._id,
        sender: adminUsers.length > 1 ? adminUsers[1]._id : adminUser._id,
        type: 'admin_announcement',
        title: 'Staff Meeting Reminder',
        message: 'Don\'t forget about the staff meeting tomorrow at 2 PM',
        priority: 'medium',
        actionUrl: `/announcements`
      },
      {
        recipient: adminUser._id,
        sender: student1._id,
        type: 'quiz_submission',
        title: 'Quiz Completed',
        message: `${student1.firstName} ${student1.lastName} completed the "Grammar Quiz #3" with 85% score`,
        priority: 'low',
        actionUrl: `/admin/quizzes/submissions`
      },
      {
        recipient: adminUser._id,
        sender: student2._id,
        type: 'progress_update',
        title: 'Student Progress Update',
        message: `${student2.firstName} ${student2.lastName} completed "Conversation Practice Unit 4"`,
        priority: 'low',
        actionUrl: `/admin/students/${student2._id}/progress`
      },
      {
        recipient: adminUser._id,
        sender: null,
        type: 'system_alert',
        title: 'System Notification',
        message: 'New notification system is now active and functional!',
        priority: 'high',
        actionUrl: `/admin/dashboard`
      }
    ];
    
    // Insert notifications
    const createdNotifications = await Notification.insertMany(testNotifications);
    console.log(`✅ Created ${createdNotifications.length} test notifications`);
    
    // Create notification for all admins about a system update
    if (adminUsers.length > 1) {
      await NotificationService.createBulkNotifications({
        recipients: adminUsers.map(u => u._id),
        sender: adminUser._id,
        type: 'admin_announcement',
        title: 'System Update Complete',
        message: 'The notification system has been successfully integrated and is now live!',
        priority: 'medium',
        actionUrl: '/admin/dashboard'
      });
      console.log('✅ Created bulk notification for all admins');
    }
    
    console.log('\n🎉 Test notifications created successfully!');
    console.log('💡 You can now view them in the Teacher Dashboard notification panel.');
    
  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createTestNotifications();
}

module.exports = createTestNotifications;