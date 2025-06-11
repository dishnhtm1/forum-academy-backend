const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const resetAllUsersAndTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log('🧹 CLEARING ALL USERS FOR FRESH TEST');
        
        // Delete all users except default admin
        await User.deleteMany({ email: { $ne: 'admin@example.com' } });
        
        // Ensure admin exists and is approved
        const admin = await User.findOne({ email: 'admin@example.com' });
        if (!admin) {
            const newAdmin = new User({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'admin123',
                role: 'admin',
                isApproved: true
            });
            await newAdmin.save();
            console.log('✅ Created admin user');
        } else {
            await User.updateOne(
                { email: 'admin@example.com' },
                { isApproved: true }
            );
            console.log('✅ Ensured admin is approved');
        }
        
        // Show final status
        const allUsers = await User.find();
        console.log('\n=== FINAL USER STATUS ===');
        allUsers.forEach(user => {
            console.log(`${user.email} | ${user.role} | Approved: ${user.isApproved}`);
        });
        
        console.log('\n🎉 FRESH START READY!');
        console.log('📧 Admin login: admin@example.com');
        console.log('🔑 Admin password: admin123');
        console.log('\n🧪 Now test:');
        console.log('1. Register a new user');
        console.log('2. Try to login (should be blocked)');
        console.log('3. Login as admin and approve');
        console.log('4. Try to login again (should work)');
        
        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.connection.close();
    }
};

resetAllUsersAndTest();