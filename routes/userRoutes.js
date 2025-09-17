const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

console.log('🔧 Loading userRoutes.js...');

// ========================================
// GET /api/users
// List users with filters and optional populate
// ========================================
router.get('/', authenticate, authorizeRoles('admin', 'teacher', 'faculty'), async (req, res) => {
  try {
    console.log('📋 Fetching users...', 'User role:', req.user.role);
    const { role, approved, search, include } = req.query;

    let filter = {};

    // Teachers/faculty see only approved students
    if (req.user.role === 'teacher' || req.user.role === 'faculty') {
      filter.role = 'student';
      filter.isApproved = true;
    } else {
      if (role) filter.role = role;
      if (approved !== undefined) filter.isApproved = approved === 'true';
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Handle include query for populating relations
    const populateFields = [];
    if (include) {
      const includes = include.split(',');
      if (includes.includes('courses')) populateFields.push({ path: 'courses' });
      if (includes.includes('submissions')) populateFields.push({ path: 'submissions' });
      if (includes.includes('attendance')) populateFields.push({ path: 'attendance' });
    }

    let query = User.find(filter).select('-password').sort({ createdAt: -1 });
    populateFields.forEach(pop => {
      query = query.populate(pop);
    });

    const users = await query;
    console.log(`✅ Found ${users.length} users for role: ${req.user.role}`);
    res.json({ success: true, users, count: users.length });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
});

// ========================================
// GET /api/users/students/list
// Teachers/faculty fetch approved students
// ========================================
router.get('/students/list', authenticate, authorizeRoles('teacher', 'faculty', 'admin'), async (req, res) => {
  try {
    console.log('👥 Teacher fetching students...');
    const { search } = req.query;

    let filter = { role: 'student', isApproved: true };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(filter)
      .select('firstName lastName email studentId createdAt')
      .sort({ firstName: 1, lastName: 1 });

    console.log(`✅ Found ${students.length} approved students`);
    res.json({ success: true, users: students, students, count: students.length });
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Error fetching students', error: error.message });
  }
});

// ========================================
// GET /api/users/:id
// Get single user
// ========================================
router.get('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log(`👤 Fetching user with ID: ${req.params.id}`);
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Error fetching user', error: error.message });
  }
});

// ========================================
// PUT /api/users/:id
// Update user info
// ========================================
router.put('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log(`✏️ Updating user with ID: ${req.params.id}`);
    const updateData = { ...req.body };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
    if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });

    console.log(`✅ User updated successfully: ${updatedUser.email}`);
    res.json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
});

// ========================================
// PUT /api/users/:id/approval
// Approve or reject user
// ========================================
router.put('/:id/approval', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const { approved, rejectionReason } = req.body;
    console.log(`${approved ? '✅ Approving' : '❌ Rejecting'} user: ${req.params.id}`);
    const updateData = {
      isApproved: approved,
      approvedBy: approved ? req.user.id : null,
      approvedAt: approved ? new Date() : null,
      rejectionReason: approved ? null : rejectionReason
    };
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `User ${approved ? 'approved' : 'rejected'} successfully`, user });
  } catch (error) {
    console.error('❌ Error updating user approval:', error);
    res.status(500).json({ success: false, message: 'Error updating user approval', error: error.message });
  }
});

// ========================================
// DELETE /api/users/:id
// Delete user
// ========================================
router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log(`🗑️ Deleting user with ID: ${req.params.id}`);
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: { id: user._id, email: user.email, name: `${user.firstName} ${user.lastName}` }
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
  }
});

// ========================================
// POST /api/users
// Create new user
// ========================================
router.post('/', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log('👤 Admin creating new user...');
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'User with this email already exists' });

    const newUser = new User(req.body);
    await newUser.save();
    const userResponse = newUser.toObject();
    delete userResponse.password;
    console.log(`✅ User created successfully: ${newUser.email}`);
    res.status(201).json({ success: true, message: 'User created successfully', user: userResponse });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
});

console.log('✅ userRoutes.js loaded successfully');
module.exports = router;
