const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Registration and Login Routes
router.post('/register', register);
router.post('/login', login);

// Admin route to approve a user by ID
router.put('/approve/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `${user.email} has been approved`, user: { id: user._id, email: user.email, role: user.role, isApproved: user.isApproved } });
  } catch (err) {
    console.error('Approval error:', err);
    res.status(500).json({ message: 'Approval failed' });
  }
});

// Admin route to reject/delete a user by ID
router.delete('/reject/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `${user.email} has been rejected and removed` });
  } catch (err) {
    console.error('Rejection error:', err);
    res.status(500).json({ message: 'Rejection failed' });
  }
});

// Admin route to fetch all pending users
router.get('/pending', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const pendingUsers = await User.find({ isApproved: false }).select('-password');
    res.json({
      message: 'Pending users retrieved successfully',
      users: pendingUsers,
      count: pendingUsers.length
    });
  } catch (err) {
    console.error('Fetch pending users error:', err);
    res.status(500).json({ message: 'Failed to fetch pending users' });
  }
});

// Admin route to fetch all users
router.get('/users', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const { role, approved } = req.query;
    
    let filter = {};
    if (role) filter.role = role;
    if (approved !== undefined) filter.isApproved = approved === 'true';
    
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({
      message: 'Users retrieved successfully',
      users,
      count: users.length
    });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      message: 'User info retrieved successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Get user info error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check approval status for a specific email
router.get('/check-approval/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      message: 'User status retrieved successfully',
      user: {
        email: user.email,
        isApproved: user.isApproved,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Check approval error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token endpoint
router.get('/verify', authenticate, async (req, res) => {
  try {
    res.json({
      message: 'Token is valid',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        isApproved: req.user.isApproved
      }
    });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ message: 'Token verification failed' });
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// // Admin route to create teacher/admin accounts (pre-approved)
// router.post('/create-user', authenticate, authorizeRoles('admin'), async (req, res) => {
//   try {
//     const { firstName, lastName, email, password, role } = req.body;
    
//     // Validate input
//     if (!firstName || !lastName || !email || !password || !role) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }
    
//     if (!['teacher', 'admin'].includes(role)) {
//       return res.status(400).json({ message: 'Only teacher and admin roles can be created through this endpoint' });
//     }
    
//     // Check if user already exists
//     const existingUser = await User.findOne({ email: email.toLowerCase() });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists with this email' });
//     }
    
//     const user = new User({
//       firstName,
//       lastName,
//       email: email.toLowerCase(),
//       password,
//       role,
//       isApproved: true // Admin-created users are pre-approved
//     });
    
//     await user.save();
    
//     res.status(201).json({
//       message: `${role} account created successfully`,
//       user: {
//         id: user._id,
//         email: user.email,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         role: user.role,
//         isApproved: user.isApproved
//       }
//     });
//   } catch (err) {
//     console.error('Create user error:', err);
//     res.status(500).json({ message: 'Failed to create user' });
//   }
// });

// REPLACE the existing create-user route (around line 165) with this:

router.post('/create-user', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Validate input
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role,
      isApproved: true // Admin-created users are pre-approved
    });
    
    await user.save();
    
    res.status(201).json({
      message: `${role} account created successfully`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

module.exports = router;

