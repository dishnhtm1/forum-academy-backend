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

// Test function to create an announcement notification
async function createTestAnnouncement() {
  try {
    await connectDB();
    
    // Find an admin or teacher user
    const teacher = await User.findOne({ role: 'teacher' }).limit(1);
    const admin = await User.findOne({ role: 'admin' }).limit(1);
    
    const sender = teacher || admin;
    
    if (!sender) {
      console.log('❌ No teacher or admin found in database');
      return;
    }
    
    console.log(`✅ Found sender: ${sender.email} (${sender.role})`);
    
    // Find all students
    const students = await User.find({ role: 'student' }).select('_id email name');
    
    if (students.length === 0) {
      console.log('❌ No students found in database');
      return;
    }
    
    console.log(`✅ Found ${students.length} students`);
    
    // Create a test announcement notification
    const announcementData = {
      recipients: students.map(s => s._id),
      sender: sender._id,
      type: 'admin_announcement',
      title: 'Important: Class Schedule Update',
      message: 'Dear students, tomorrow\'s JavaScript class will start at 10:00 AM instead of 9:00 AM. Please make note of this change.',
      priority: 'high',
      actionUrl: '/announcements'
    };
    
    console.log('📢 Creating announcement notification...');
    
    // Create notifications for all students
    await NotificationService.createBulkNotifications(announcementData);
    
    console.log('✅ Test announcement created successfully!');
    console.log('📊 Notification details:');
    console.log(`   - Sender: ${sender.email} (${sender.role})`);
    console.log(`   - Recipients: ${students.length} students`);
    console.log(`   - Type: admin_announcement`);
    console.log(`   - Title: ${announcementData.title}`);
    console.log(`   - Message: ${announcementData.message}`);
    
    // Verify notifications were created
    const createdNotifications = await Notification.find({
      type: 'admin_announcement',
      sender: sender._id
    }).limit(5);
    
    console.log(`\n✅ Verified ${createdNotifications.length} notifications created`);
    
  } catch (error) {
    console.error('❌ Error creating test announcement:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
createTestAnnouncement();