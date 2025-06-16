// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// // GET all users (admin only)
// router.get('/', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         console.log('📋 Admin fetching all users...');
//         const { role, approved, search } = req.query;
        
//         let filter = {};
//         if (role) filter.role = role;
//         if (approved !== undefined) filter.isApproved = approved === 'true';
//         if (search) {
//             filter.$or = [
//                 { firstName: { $regex: search, $options: 'i' } },
//                 { lastName: { $regex: search, $options: 'i' } },
//                 { email: { $regex: search, $options: 'i' } }
//             ];
//         }
        
//         const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
//         console.log(`✅ Found ${users.length} users`);
        
//         res.json({
//             success: true,
//             users,
//             count: users.length
//         });
//     } catch (error) {
//         console.error('❌ Error fetching users:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching users',
//             error: error.message
//         });
//     }
// });

// // GET single user by ID (admin only)
// router.get('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         console.log(`👤 Fetching user with ID: ${req.params.id}`);
//         const user = await User.findById(req.params.id).select('-password');
        
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }
        
//         res.json({
//             success: true,
//             user
//         });
//     } catch (error) {
//         console.error('❌ Error fetching user:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching user',
//             error: error.message
//         });
//     }
// });

// // PUT update user by ID (admin only)
// router.put('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         console.log(`📝 Updating user with ID: ${req.params.id}`);
//         const { firstName, lastName, email, role, password } = req.body;
        
//         // Build update object
//         const updateData = {
//             firstName,
//             lastName,
//             email,
//             role
//         };
        
//         // Only update password if provided
//         if (password && password.trim() !== '') {
//             updateData.password = password;
//         }
        
//         const user = await User.findByIdAndUpdate(
//             req.params.id,
//             updateData,
//             { new: true, runValidators: true }
//         ).select('-password');
        
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }
        
//         console.log(`✅ User updated: ${user.email}`);
//         res.json({
//             success: true,
//             message: 'User updated successfully',
//             user
//         });
//     } catch (error) {
//         console.error('❌ Error updating user:', error);
        
//         // Handle duplicate email error
//         if (error.code === 11000) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Email already exists'
//             });
//         }
        
//         res.status(500).json({
//             success: false,
//             message: 'Error updating user',
//             error: error.message
//         });
//     }
// });

// // DELETE user by ID (admin only)
// router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         console.log(`🗑️ Deleting user with ID: ${req.params.id}`);
        
//         // Prevent admin from deleting themselves
//         if (req.params.id === req.user.id) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Cannot delete your own account'
//             });
//         }
        
//         const user = await User.findByIdAndDelete(req.params.id);
        
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }
        
//         console.log(`✅ User deleted: ${user.email}`);
//         res.json({
//             success: true,
//             message: 'User deleted successfully',
//             deletedUser: {
//                 id: user._id,
//                 email: user.email,
//                 name: `${user.firstName} ${user.lastName}`
//             }
//         });
//     } catch (error) {
//         console.error('❌ Error deleting user:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting user',
//             error: error.message
//         });
//     }
// });

// // POST approve/reject user (admin only) - moved from auth routes
// router.put('/:id/approval', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const { approved } = req.body; // true for approve, false for reject
//         console.log(`${approved ? '✅ Approving' : '❌ Rejecting'} user: ${req.params.id}`);
        
//         if (approved) {
//             // Approve user
//             const user = await User.findByIdAndUpdate(
//                 req.params.id, 
//                 { isApproved: true }, 
//                 { new: true }
//             ).select('-password');
            
//             if (!user) {
//                 return res.status(404).json({
//                     success: false,
//                     message: 'User not found'
//                 });
//             }
            
//             res.json({
//                 success: true,
//                 message: `${user.email} has been approved`,
//                 user
//             });
//         } else {
//             // Reject user (delete them)
//             const user = await User.findByIdAndDelete(req.params.id);
            
//             if (!user) {
//                 return res.status(404).json({
//                     success: false,
//                     message: 'User not found'
//                 });
//             }
            
//             res.json({
//                 success: true,
//                 message: `${user.email} has been rejected and removed`
//             });
//         }
//     } catch (error) {
//         console.error('❌ User approval/rejection error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Approval/rejection failed',
//             error: error.message
//         });
//     }
// });

// // GET pending users (admin only)
// router.get('/status/pending', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         console.log('📋 Fetching pending users...');
//         const pendingUsers = await User.find({ isApproved: false })
//             .select('-password')
//             .sort({ createdAt: -1 });
        
//         res.json({
//             success: true,
//             message: 'Pending users retrieved successfully',
//             users: pendingUsers,
//             count: pendingUsers.length
//         });
//     } catch (error) {
//         console.error('❌ Error fetching pending users:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch pending users',
//             error: error.message
//         });
//     }
// });

// // Bulk operations
// router.post('/bulk-approve', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const { userIds } = req.body;
//         console.log(`✅ Bulk approving ${userIds.length} users`);
        
//         const result = await User.updateMany(
//             { _id: { $in: userIds } },
//             { isApproved: true }
//         );
        
//         res.json({
//             success: true,
//             message: `${result.modifiedCount} users approved successfully`,
//             modifiedCount: result.modifiedCount
//         });
//     } catch (error) {
//         console.error('❌ Bulk approval error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Bulk approval failed',
//             error: error.message
//         });
//     }
// });

// router.post('/bulk-reject', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const { userIds } = req.body;
//         console.log(`❌ Bulk rejecting ${userIds.length} users`);
        
//         const result = await User.deleteMany({ _id: { $in: userIds } });
        
//         res.json({
//             success: true,
//             message: `${result.deletedCount} users rejected and removed`,
//             deletedCount: result.deletedCount
//         });
//     } catch (error) {
//         console.error('❌ Bulk rejection error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Bulk rejection failed',
//             error: error.message
//         });
//     }
// });

// console.log('✅ userRoutes.js loaded successfully');
// module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

console.log('🔧 Loading userRoutes.js...');

// Test route to verify routes are working
router.get('/test', (req, res) => {
    console.log('✅ User routes test endpoint hit');
    res.json({ message: 'User routes are working!' });
});

// GET all users (admin only)
router.get('/', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        console.log('📋 Admin fetching all users...');
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        console.log(`✅ Found ${users.length} users`);
        
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

// // DELETE user by ID (admin only)
// router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         console.log(`🗑️ DELETE request received for user ID: ${req.params.id}`);
//         console.log(`🔐 Auth user: ${req.user?.email || 'Unknown'}`);
        
//         // Prevent admin from deleting themselves
//         if (req.params.id === req.user.id || req.params.id === req.user._id.toString()) {
//             console.log('❌ User trying to delete themselves');
//             return res.status(400).json({
//                 success: false,
//                 message: 'Cannot delete your own account'
//             });
//         }
        
//         console.log(`🔍 Looking for user with ID: ${req.params.id}`);
//         const user = await User.findById(req.params.id);
        
//         if (!user) {
//             console.log('❌ User not found in database');
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }
        
//         console.log(`👤 Found user: ${user.email}, deleting...`);
//         await User.findByIdAndDelete(req.params.id);
        
//         console.log(`✅ User deleted successfully: ${user.email}`);
//         res.json({
//             success: true,
//             message: 'User deleted successfully',
//             deletedUser: {
//                 id: user._id,
//                 email: user.email,
//                 name: `${user.firstName} ${user.lastName}`
//             }
//         });
//     } catch (error) {
//         console.error('❌ Error deleting user:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting user',
//             error: error.message
//         });
//     }
// });

// // PUT update user by ID (admin only)
// router.put('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         console.log(`📝 Updating user with ID: ${req.params.id}`);
//         const { firstName, lastName, email, role, password } = req.body;
        
//         const updateData = {
//             firstName,
//             lastName,
//             email,
//             role
//         };
        
//         // Only update password if provided
//         if (password && password.trim() !== '') {
//             updateData.password = password;
//         }
        
//         const user = await User.findByIdAndUpdate(
//             req.params.id,
//             updateData,
//             { new: true, runValidators: true }
//         ).select('-password');
        
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }
        
//         console.log(`✅ User updated: ${user.email}`);
//         res.json({
//             success: true,
//             message: 'User updated successfully',
//             user
//         });
//     } catch (error) {
//         console.error('❌ Error updating user:', error);
        
//         if (error.code === 11000) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Email already exists'
//             });
//         }
        
//         res.status(500).json({
//             success: false,
//             message: 'Error updating user',
//             error: error.message
//         });
//     }
// });

// PUT update user by ID (admin only) - FIXED RESPONSE
router.put('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        console.log(`📝 Updating user with ID: ${req.params.id}`);
        const { firstName, lastName, email, role, password } = req.body;
        
        const updateData = {
            firstName,
            lastName,
            email,
            role
        };
        
        // Only update password if provided
        if (password && password.trim() !== '') {
            updateData.password = password;
        }
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log(`✅ User updated: ${user.email}`);
        res.json({
            success: true,
            message: 'User updated successfully',
            user: user  // ✅ Return the updated user object directly
        });
    } catch (error) {
        console.error('❌ Error updating user:', error);
        
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

// DELETE user by ID (admin only) - FIXED IMPLEMENTATION
router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        console.log(`🗑️ DELETE request received for user ID: ${req.params.id}`);
        console.log(`🔐 Auth user: ${req.user?.email || 'Unknown'}`);
        
        // Prevent admin from deleting themselves
        if (req.params.id === req.user.id || req.params.id === req.user._id.toString()) {
            console.log('❌ User trying to delete themselves');
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }
        
        console.log(`🔍 Looking for user with ID: ${req.params.id}`);
        const user = await User.findById(req.params.id);
        
        if (!user) {
            console.log('❌ User not found in database');
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log(`👤 Found user: ${user.email}, deleting...`);
        await User.findByIdAndDelete(req.params.id);
        
        console.log(`✅ User deleted successfully: ${user.email}`);
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


// PUT approve/reject user (admin only)
router.put('/:id/approval', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const { approved } = req.body;
        console.log(`${approved ? '✅ Approving' : '❌ Rejecting'} user: ${req.params.id}`);
        
        if (approved) {
            const user = await User.findByIdAndUpdate(
                req.params.id, 
                { isApproved: true }, 
                { new: true }
            ).select('-password');
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            res.json({
                success: true,
                message: `${user.email} has been approved`,
                user
            });
        } else {
            const user = await User.findByIdAndDelete(req.params.id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            res.json({
                success: true,
                message: `${user.email} has been rejected and removed`
            });
        }
    } catch (error) {
        console.error('❌ User approval/rejection error:', error);
        res.status(500).json({
            success: false,
            message: 'Approval/rejection failed',
            error: error.message
        });
    }
});

console.log('✅ userRoutes.js loaded successfully');
module.exports = router;