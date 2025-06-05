const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    
    // Create default admin user if it doesn't exist
    await createDefaultAdmin();
    
  } catch (err) {
    console.error('DB connection error:', err.message);
    process.exit(1);
  }
};

// Function to create default admin user
const createDefaultAdmin = async () => {
  try {
    // Import User model (make sure the path is correct)
    const User = require('../models/User');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (!existingAdmin) {
      console.log('No admin user found. Creating default admin...');
      
      const defaultAdmin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'admin123', // This will be hashed automatically by the User model
        role: 'admin',
        isApproved: true // Admin is auto-approved
      });
      
      await defaultAdmin.save();
      console.log('✅ Default admin user created successfully!');
      console.log('📧 Email: admin@example.com');
      console.log('🔑 Password: admin123');
      console.log('⚠️  Please change the default password after first login!');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
  }
};

module.exports = connectDB;