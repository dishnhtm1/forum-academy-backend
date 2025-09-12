const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/forum-academy', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkUsers() {
    try {
        console.log('🔍 Checking all users in database...');
        
        const users = await User.find({}, { password: 0 }); // Exclude password field
        
        console.log('\n📋 Users in database:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user._id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   Approved: ${user.isApproved}`);
            console.log(`   Created: ${user.createdAt}`);
            console.log('   ---');
        });
        
        console.log(`\n✅ Total users found: ${users.length}`);
        
    } catch (error) {
        console.error('❌ Error checking users:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

checkUsers();
