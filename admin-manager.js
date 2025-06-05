// const mongoose = require('mongoose');

// const connectDB = async () => {
//     try {
//         await mongoose.connect(process.env.MONGO_URI);
//         console.log('MongoDB connected');
        
//         // Create default admin user if it doesn't exist
//         await createDefaultAdmin();
        
//     } catch (err) {
//         console.error('DB connection error:', err.message);
//         process.exit(1);
//     }
// };

// // Function to create default admin user
// const createDefaultAdmin = async () => {
//     try {
//         const User = require('../models/User'); // Correct path from config/ to models/
        
//         // Check if admin already exists
//         const existingAdmin = await User.findOne({ role: 'admin' });
        
//         if (!existingAdmin) {
//         console.log('No admin user found. Creating default admin...');
        
//         const defaultAdmin = new User({
//             firstName: 'Admin',
//             lastName: 'User',
//             email: 'admin@example.com',
//             password: 'admin123', // This will be hashed automatically by the User model
//             role: 'admin',
//             isApproved: true // Admin is auto-approved
//         });
        
//         await defaultAdmin.save();
//         console.log('✅ Default admin user created successfully!');
//         console.log('📧 Email: admin@example.com');
//         console.log('🔑 Password: admin123');
//         console.log('⚠️  Please change the default password after first login!');
//         } else {
//         console.log('✅ Admin user already exists');
//         }
//     } catch (error) {
//         console.error('❌ Error creating default admin:', error.message);
//     }
// };

// module.exports = connectDB;

const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const createAdmin = async () => {
    try {
        await connectDB();
        
        // Check if admin exists
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        
        if (existingAdmin) {
            // Update existing admin to be approved
            existingAdmin.isApproved = true;
            await existingAdmin.save();
            console.log('✅ Admin user updated and approved');
        } else {
            // Create new admin
            const admin = new User({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'admin123',
                role: 'admin',
                isApproved: true
            });
            
            await admin.save();
            console.log('✅ Admin user created successfully');
        }
        
        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        mongoose.connection.close();
    }
};

createAdmin();