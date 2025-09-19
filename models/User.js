// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   firstName: { 
//     type: String,
//     trim: true
//   },
//   lastName: { 
//     type: String,
//     trim: true
//   },
//   email: { 
//     type: String, 
//     required: true, 
//     unique: true,
//     trim: true,
//     lowercase: true
//   },
//   password: { 
//     type: String, 
//     required: true 
//   },
//   role: {
//     type: String,
//     enum: ['student', 'teacher', 'admin'],
//     required: true
//   },
//   isApproved: {
//     type: Boolean,
//     default: false // must be true to login
//   },
//       // Password reset fields
//     resetPasswordToken: String,
//     resetPasswordExpires: Date,
//     otp: String,
//     otpExpires: Date,
//     isEmailVerified: {
//         type: Boolean,
//         default: false
//     }
// }, { timestamps: true });

// // Hash password before saving
// userSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) return next();
    
//     try {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

// // Compare password method
// userSchema.methods.comparePassword = async function(candidatePassword) {
//     return await bcrypt.compare(candidatePassword, this.password);
// };

// module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { 
    type: String,
    trim: true
  },
  lastName: { 
    type: String,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'faculty', 'teacher', 'student'],
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false // ✅ All users require approval by default
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  // Additional profile fields
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    type: String,
    trim: true
  },
  nationality: {
    type: String,
    trim: true
  },
  // Teacher-specific fields
  qualifications: {
    type: String,
    trim: true
  },
  experience: {
    type: String,
    trim: true
  },
  specialization: {
    type: String,
    trim: true
  },
  // Student-specific fields
  currentEducation: {
    type: String,
    trim: true
  },
  japaneseLevel: {
    type: String,
    enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'native'],
    trim: true
  },
  studyGoals: {
    type: String,
    trim: true
  },
  // Common fields
  bio: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    trim: true
  },
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  otp: String,
  otpExpires: Date,
  isEmailVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ✅ Make sure both method names work
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.matchPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);