// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('MongoDB connected');
    
//     // Create default admin user if NO admin exists at all
//     await createDefaultAdminIfNeeded();
    
//   } catch (err) {
//     console.error('DB connection error:', err.message);
//     process.exit(1);
//   }
// };

// // ✅ FIXED: Only create admin if absolutely no admin exists
// const createDefaultAdminIfNeeded = async () => {
//   try {
//     const User = require('../models/User');
    
//     // Check if ANY admin exists (approved or not)
//     const existingAdmin = await User.findOne({ role: 'admin' });
    
//     if (!existingAdmin) {
//       console.log('No admin user found. Creating default admin...');
      
//       const defaultAdmin = new User({
//         firstName: 'Admin',
//         lastName: 'User',
//         email: 'admin@example.com',
//         password: 'admin123',
//         role: 'admin',
//         isApproved: true // Only the default admin gets auto-approved
//       });
      
//       await defaultAdmin.save();
//       console.log('✅ Default admin user created successfully!');
//       console.log('📧 Email: admin@example.com');
//       console.log('🔑 Password: admin123');
//       console.log('⚠️  Please change the default password after first login!');
//     } else {
//       console.log('✅ Admin user already exists');
//     }
//   } catch (error) {
//     console.error('❌ Error creating default admin:', error.message);
//   }
// };

// module.exports = connectDB;

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Optional: Create default admin only once
    await createDefaultAdminIfNeeded();

  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Required for Azure: Stop container if DB fails
  }
};

// ✅ Create default admin if none exists
const createDefaultAdminIfNeeded = async () => {
  try {
    console.log('🔍 Checking if any admin user exists...');
    const User = require('../models/User');

    const existingAdmin = await User.findOne({ role: 'admin' });

    if (!existingAdmin) {
      console.log('⚠️ No admin found. Creating default admin...');

      const defaultAdmin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'admin123', // 🔐 Will be hashed in pre-save
        role: 'admin',
        isApproved: true
      });

      await defaultAdmin.save();
      console.log('✅ Default admin created!');
      console.log('📧 Email: admin@example.com');
      console.log('🔑 Password: admin123');
      console.log('⚠️ Please change this password after first login.');
    } else {
      console.log('✅ Admin user already exists');
    }

  } catch (error) {
    console.error('❌ Error in createDefaultAdminIfNeeded:', error.message);
  }
};

module.exports = connectDB;
