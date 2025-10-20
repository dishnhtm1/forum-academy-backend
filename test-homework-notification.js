const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
const User = require('./models/User');
const Notification = require('./models/Notification');
const NotificationService = require('./services/notificationService');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Test function to create a homework notification
async function createTestHomeworkNotification() {
  try {
    await connectDB();
    
    // Find a teacher user
    const teacher = await User.findOne({ role: 'teacher' }).limit(1);
    
    if (!teacher) {
      console.log('❌ No teacher found in database');
      return;
    }
    
    console.log(`✅ Found teacher: ${teacher.email}`);
    
    // Find all students
    const students = await User.find({ role: 'student' }).select('_id email name');
    
    if (students.length === 0) {
      console.log('❌ No students found in database');
      return;
    }
    
    console.log(`✅ Found ${students.length} students`);
    
    // Create test homework notifications
    const notifications = [
      {
        recipients: students.map(s => s._id),
        sender: teacher._id,
        type: 'homework_reminder',
        title: 'New Homework Assignment Posted',
        message: 'React Component Design homework has been posted. Due date: Next Monday.',
        priority: 'high',
        actionUrl: '/homework'
      },
      {
        recipients: students.map(s => s._id),
        sender: teacher._id,
        type: 'homework_reminder',
        title: 'Homework Due Tomorrow',
        message: 'JavaScript Fundamentals homework is due tomorrow at 11:59 PM.',
        priority: 'high',
        actionUrl: '/homework'
      }
    ];
    
    console.log('📝 Creating homework notifications...');
    
    // Create notifications
    for (const notif of notifications) {
      await NotificationService.createBulkNotifications(notif);
      console.log(`✅ Created notification: ${notif.title}`);
    }
    
    console.log('\n✅ All test homework notifications created successfully!');
    
    // Verify notifications were created
    const createdNotifications = await Notification.find({
      sender: teacher._id,
      type: { $in: ['assignment_new', 'homework_due'] }
    }).limit(10);
    
    console.log(`\n✅ Verified ${createdNotifications.length} notifications created`);
    
  } catch (error) {
    console.error('❌ Error creating test homework notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
createTestHomeworkNotification();
