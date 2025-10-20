const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

console.log('🔧 Loading userRoutes.js...');

// GET all users (admin only)
router.get('/', authenticate, authorizeRoles('admin', 'teacher', 'faculty'), async (req, res) => {
    try {
        console.log('📋 Fetching users...', 'User role:', req.user.role);
        const { role, approved, search } = req.query;
        
        let filter = {};
        
        // If the requester is a teacher/faculty, they can only see students
        if (req.user.role === 'teacher' || req.user.role === 'faculty') {
            filter.role = 'student';
            filter.isApproved = true; // Teachers should only see approved students
        } else {
            // Admin can see all users with filters
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
        
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
        console.log(`✅ Found ${users.length} users for role: ${req.user.role}`);
        
        res.json({
            success: true,
            users,
            count: users.length
        });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// GET students for teachers/faculty
router.get('/students/list', authenticate, authorizeRoles('teacher', 'faculty', 'admin'), async (req, res) => {
    try {
        console.log('👥 Teacher fetching students...');
        const { search } = req.query;
        
        let filter = {
            role: 'student',
            isApproved: true  // Only approved students
        };
        
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
        
        res.json({
            success: true,
            users: students,  // Keep the 'users' key for compatibility
            students: students,
            count: students.length
        });
    } catch (error) {
        console.error('❌ Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students',
            error: error.message
        });
    }
});

// GET single user by ID (admin only)
router.get('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        console.log(`👤 Fetching user with ID: ${req.params.id}`);
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

// PUT update user information (admin only)
router.put('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        console.log(`✏️ Updating user with ID: ${req.params.id}`);
        const { 
            firstName, 
            lastName, 
            email, 
            role, 
            phone,
            dateOfBirth,
            address,
            // Teacher specific fields
            qualifications,
            experience,
            specialization,
            // Student specific fields
            japaneseLevel,
            studyGoals,
            previousEducation,
            // Optional password update
            password
        } = req.body;

        // Build update object
        const updateData = {
            firstName,
            lastName,
            email,
            role,
            phone,
            dateOfBirth,
            address
        };

        // Add role-specific fields
        if (role === 'teacher') {
            if (qualifications !== undefined) updateData.qualifications = qualifications;
            if (experience !== undefined) updateData.experience = experience;
            if (specialization !== undefined) updateData.specialization = specialization;
        } else if (role === 'student') {
            if (japaneseLevel !== undefined) updateData.japaneseLevel = japaneseLevel;
            if (studyGoals !== undefined) updateData.studyGoals = studyGoals;
            if (previousEducation !== undefined) updateData.previousEducation = previousEducation;
        }

        // Only update password if provided
        if (password && password.trim() !== '') {
            updateData.password = password;
        }

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log(`✅ User updated successfully: ${updatedUser.email}`);
        res.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('❌ Error updating user:', error);
        
        // Handle duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});

// PUT update user approval status (admin only)
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
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log(`✅ User ${approved ? 'approved' : 'rejected'}: ${user.email}`);
        res.json({
            success: true,
            message: `User ${approved ? 'approved' : 'rejected'} successfully`,
            user
        });
    } catch (error) {
        console.error('❌ Error updating user approval:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user approval',
            error: error.message
        });
    }
});

// DELETE user by ID (admin only)
router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        console.log(`🗑️ Deleting user with ID: ${req.params.id}`);
        
        // Prevent admin from deleting themselves
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }
        
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log(`✅ User deleted: ${user.email}`);
        res.json({
            success: true,
            message: 'User deleted successfully',
            deletedUser: {
                id: user._id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`
            }
        });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// POST create new user (admin only)
router.post('/', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        console.log('👤 Admin creating new user...');
        const { 
            firstName, 
            lastName, 
            email, 
            password, 
            role, 
            isApproved = true,  // Default to true when admin creates users
            phone,
            dateOfBirth,
            address,
            // Teacher specific fields
            qualifications,
            experience,
            specialization,
            // Student specific fields
            japaneseLevel,
            studyGoals,
            previousEducation
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user data object
        const userData = {
            firstName,
            lastName,
            email,
            password, // Will be hashed by the User model pre-save hook
            role,
            isApproved: true,  // Always approve users created by admin
            phone,
            dateOfBirth,
            address,
            approvedBy: req.user.id,  // Track who approved
            approvedAt: new Date(),
            isEmailVerified: true  // Also mark email as verified for admin-created users
        };

        // Add role-specific fields
        if (role === 'teacher') {
            if (qualifications) userData.qualifications = qualifications;
            if (experience) userData.experience = experience;
            if (specialization) userData.specialization = specialization;
        } else if (role === 'student') {
            if (japaneseLevel) userData.japaneseLevel = japaneseLevel;
            if (studyGoals) userData.studyGoals = studyGoals;
            if (previousEducation) userData.previousEducation = previousEducation;
        }

        const newUser = new User(userData);
        await newUser.save();

        console.log(`✅ User created successfully: ${newUser.email} (${newUser.role}) - Pre-approved by admin`);
        
        // Return user without password
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('❌ Error creating user:', error);
        
        // Handle duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
});

console.log('✅ userRoutes.js loaded successfully');
module.exports = router;