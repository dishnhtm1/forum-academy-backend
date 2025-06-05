const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const approveAllUsers = async () => {
    try {
        await connectDB();
        
        const result = await User.updateMany(
            { isApproved: false },
            { isApproved: true }
        );
        
        console.log(`✅ ${result.modifiedCount} users approved successfully`);
        
        // Also ensure all existing users are approved
        const allUsersResult = await User.updateMany(
            {},
            { isApproved: true }
        );
        
        console.log(`✅ Total users updated: ${allUsersResult.modifiedCount}`);
        
        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error approving users:', error);
        mongoose.connection.close();
    }
};

approveAllUsers();