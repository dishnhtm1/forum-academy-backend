// fix-existing-teachers.js - Approve all existing unapproved teachers
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function fixExistingTeachers() {
    try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Connected to database...');
    
    // Find all unapproved teachers
    const unapprovedTeachers = await User.find({ 
        role: 'teacher', 
        isApproved: false 
    });
    
    console.log(`\n🔍 Found ${unapprovedTeachers.length} unapproved teacher(s):`);
    
    if (unapprovedTeachers.length === 0) {
        console.log('✅ All teachers are already approved!');
        mongoose.connection.close();
        return;
    }
    
    // List the teachers
    unapprovedTeachers.forEach((teacher, index) => {
        console.log(`${index + 1}. ${teacher.firstName || 'Unknown'} ${teacher.lastName || 'Unknown'} (${teacher.email})`);
    });
    
    // Approve all unapproved teachers
    const result = await User.updateMany(
        { role: 'teacher', isApproved: false },
        { $set: { isApproved: true } }
    );
    
    console.log(`\n✅ SUCCESS! Approved ${result.modifiedCount} teacher account(s)!`);
    console.log('🎉 All teachers can now login immediately!');
    
    // Verify the changes
    const allTeachers = await User.find({ role: 'teacher' }).select('firstName lastName email isApproved');
    console.log('\n📋 All Teacher Accounts Status:');
    allTeachers.forEach((teacher, index) => {
        const status = teacher.isApproved ? '✅ Approved' : '❌ Not Approved';
        console.log(`${index + 1}. ${teacher.firstName || 'Unknown'} ${teacher.lastName || 'Unknown'} (${teacher.email}) - ${status}`);
    });
    
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        mongoose.connection.close();
        console.log('\n🏁 Database connection closed.');
    }
}

fixExistingTeachers();