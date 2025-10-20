const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
const Announcement = require('./models/Announcement');

async function debugNotifications() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/forum-academy', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Count total users
        const userCount = await User.countDocuments();
        console.log(`👥 Total users in database: ${userCount}`);

        // List all users
        const users = await User.find({}, 'email role firstName lastName').limit(10);
        console.log('📋 Users:');
        users.forEach(user => {
            console.log(`  - ${user.email} (${user.role}) - ID: ${user._id}`);
        });

        // Count total notifications
        const notificationCount = await Notification.countDocuments();
        console.log(`📬 Total notifications in database: ${notificationCount}`);

        // List all notifications
        const notifications = await Notification.find({})
            .populate('recipient', 'email role')
            .populate('sender', 'email role')
            .limit(20);
        
        console.log('📧 Recent notifications:');
        notifications.forEach(notification => {
            console.log(`  - ${notification.title} 
              To: ${notification.recipient?.email || 'Unknown'} (${notification.recipient?.role || 'N/A'})
              From: ${notification.sender?.email || 'Unknown'} (${notification.sender?.role || 'N/A'})
              Type: ${notification.type}
              Created: ${notification.createdAt}`);
        });

        // Count total announcements
        const announcementCount = await Announcement.countDocuments();
        console.log(`📢 Total announcements in database: ${announcementCount}`);

        // List all announcements
        const announcements = await Announcement.find({})
            .populate('author', 'email role')
            .limit(10);
        
        console.log('📢 Recent announcements:');
        announcements.forEach(announcement => {
            console.log(`  - "${announcement.title}" by ${announcement.author?.email || 'Unknown'}
              Target: ${announcement.targetAudience}
              Created: ${announcement.createdAt}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

debugNotifications();