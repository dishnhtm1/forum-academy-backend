// debug-users.js - Script to debug and fix user approval issues
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for debugging');
    } catch (err) {
        console.error('DB connection error:', err.message);
        process.exit(1);
    }
};

const debugUsers = async () => {
    try {
        console.log('\n🔍 DEBUGGING USER ACCOUNTS:');
        console.log('=====================================');
        
        const allUsers = await User.find({});
        
        if (allUsers.length === 0) {
        console.log('❌ No users found in database');
        return;
        }
        
        console.log(`📊 Total users: ${allUsers.length}\n`);
        
        allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName || 'Unknown'} ${user.lastName || 'Unknown'}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Role: ${user.role}`);
        console.log(`   ✅ Approved: ${user.isApproved ? 'YES' : 'NO'}`);
        console.log(`   🗓️ Created: ${user.createdAt}`);
        console.log(`   🆔 ID: ${user._id}`);
        console.log('   -----------------------------------');
        });
        
        // Check for issues
        const unapprovedStudents = allUsers.filter(user => user.role === 'student' && !user.isApproved);
        const noAdmins = allUsers.filter(user => user.role === 'admin').length === 0;
        
        if (unapprovedStudents.length > 0) {
        console.log('\n⚠️  ISSUES FOUND:');
        console.log(`❌ ${unapprovedStudents.length} student(s) are not approved (they should be auto-approved)`);
        
        console.log('\n🔧 FIXING STUDENT APPROVALS...');
        for (const student of unapprovedStudents) {
            await User.findByIdAndUpdate(student._id, { isApproved: true });
            console.log(`✅ Fixed: ${student.email} is now approved`);
        }
        }
        
        if (noAdmins) {
        console.log('\n⚠️  NO ADMIN USERS FOUND!');
        console.log('🔧 Creating default admin user...');
        
        const defaultAdmin = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin',
            isApproved: true
        });
        
        await defaultAdmin.save();
        console.log('✅ Default admin created: admin@example.com / admin123');
        }
        
        console.log('\n✅ All user issues have been resolved!');
        
    } catch (error) {
        console.error('❌ Error debugging users:', error.message);
    }
};

const main = async () => {
    await connectDB();
    await debugUsers();
    mongoose.connection.close();
    console.log('\n🏁 Debug complete. You can now try logging in again.');
};

main().catch(console.error);