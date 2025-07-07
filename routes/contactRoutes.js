const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { sendMessageToUser } = require('../controllers/authController');


// Import password reset controller functions
const {
    forgotPassword,
    verifyOTP,
    resendOTP,
    resetPassword
} = require('../controllers/passwordResetController');

// Registration and Login Routes
router.post('/register', register);
router.post('/login', login);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/reset-password', resetPassword);
router.post('/send-message', authenticate, authorizeRoles('admin'), sendMessageToUser);


// Admin route to approve a user by ID
router.put('/approve/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ 
            message: `${user.email} has been approved`, 
            user: { 
                id: user._id, 
                email: user.email, 
                role: user.role, 
                isApproved: user.isApproved 
            } 
        });
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
        
        const isMatch = await user.comparePassword(currentPassword);
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

// Admin route to create user accounts
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

// Send message to user endpoint
router.post('/send-message', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const { to, subject, message, recipientName, recipientId } = req.body;
        
        console.log('📧 Send message request received:');
        console.log(`   From: ${req.user?.email || 'Unknown admin'}`);
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Recipient: ${recipientName}`);
        console.log(`   Recipient ID: ${recipientId}`);
        
        // Validate required fields
        if (!to || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: to, subject, and message are required'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address format'
            });
        }
        
        // Verify user exists if recipientId provided
        if (recipientId) {
            const user = await User.findById(recipientId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
        }
        
        // ✅ REAL EMAIL SENDING using NodeMailer (same config as password reset)
        const nodemailer = require('nodemailer');
        
        // Email configuration (same as password reset controller)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        // Create professional email template
        const htmlMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #2563eb; margin: 0;">Forum Academy</h2>
                <p style="color: #666; margin: 5px 0;">Message from Administration</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h3 style="color: #1e40af; margin-top: 0;">${subject}</h3>
                <div style="color: #374151; line-height: 1.6;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            ${recipientName ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    <strong>Recipient:</strong> ${recipientName}
                </p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Forum Academy. All rights reserved.
                </p>
            </div>
        </div>
        `;
        
        try {
            // Send the email
            console.log('📧 Attempting to send email...');
            await transporter.sendMail({
                from: `"Forum Academy" <${process.env.EMAIL_USER}>`,
                to: to,
                subject: subject,
                text: message,
                html: htmlMessage
            });
            
            console.log('✅ Email sent successfully');
            
            res.json({
                success: true,
                message: 'Message sent successfully via email',
                details: {
                    recipient: to,
                    subject: subject,
                    recipientName: recipientName,
                    sentBy: req.user?.email,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (emailError) {
            console.error('❌ Error sending email:', emailError);
            
            return res.status(500).json({
                success: false,
                message: 'Failed to send email. Please check email configuration.',
                error: emailError.message,
                emailConfig: {
                    hasEmailUser: !!process.env.EMAIL_USER,
                    hasEmailPass: !!process.env.EMAIL_PASS
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
});

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const { register, login } = require('../controllers/authController');
// const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
// const User = require('../models/User');

// // Import password reset controller functions
// const {
//     forgotPassword,
//     verifyOTP,
//     resendOTP,
//     resetPassword
// } = require('../controllers/passwordResetController');

// // Registration and Login Routes
// router.post('/register', register);
// router.post('/login', login);

// // Password Reset Routes
// router.post('/forgot-password', forgotPassword);
// router.post('/verify-otp', verifyOTP);
// router.post('/resend-otp', resendOTP);
// router.post('/reset-password', resetPassword);

// // Test route
// router.get('/test', (req, res) => {
//     res.json({ 
//         message: 'Auth routes are working',
//         timestamp: new Date().toISOString()
//     });
// });

// // Admin route to approve a user by ID
// router.put('/approve/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
//         if (!user) return res.status(404).json({ message: 'User not found' });
//         res.json({ 
//             message: `${user.email} has been approved`, 
//             user: { 
//                 id: user._id, 
//                 email: user.email, 
//                 role: user.role, 
//                 isApproved: user.isApproved 
//             } 
//         });
//     } catch (err) {
//         console.error('Approval error:', err);
//         res.status(500).json({ message: 'Approval failed' });
//     }
// });

// // Admin route to reject/delete a user by ID
// router.delete('/reject/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const user = await User.findByIdAndDelete(req.params.id);
//         if (!user) return res.status(404).json({ message: 'User not found' });
//         res.json({ message: `${user.email} has been rejected and removed` });
//     } catch (err) {
//         console.error('Rejection error:', err);
//         res.status(500).json({ message: 'Rejection failed' });
//     }
// });

// // Admin route to fetch all pending users
// router.get('/pending', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const pendingUsers = await User.find({ isApproved: false }).select('-password');
//         res.json({
//             message: 'Pending users retrieved successfully',
//             users: pendingUsers,
//             count: pendingUsers.length
//         });
//     } catch (err) {
//         console.error('Fetch pending users error:', err);
//         res.status(500).json({ message: 'Failed to fetch pending users' });
//     }
// });

// // Admin route to fetch all users
// router.get('/users', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const { role, approved } = req.query;
        
//         let filter = {};
//         if (role) filter.role = role;
//         if (approved !== undefined) filter.isApproved = approved === 'true';
        
//         const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
//         res.json({
//             message: 'Users retrieved successfully',
//             users,
//             count: users.length
//         });
//     } catch (err) {
//         console.error('Fetch users error:', err);
//         res.status(500).json({ message: 'Failed to fetch users' });
//     }
// });

// // Get current user info
// router.get('/me', authenticate, async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id).select('-password');
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.json({
//             message: 'User info retrieved successfully',
//             user: {
//                 id: user._id,
//                 email: user.email,
//                 firstName: user.firstName,
//                 lastName: user.lastName,
//                 role: user.role,
//                 isApproved: user.isApproved,
//                 createdAt: user.createdAt
//             }
//         });
//     } catch (err) {
//         console.error('Get user info error:', err);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // Check approval status for a specific email
// router.get('/check-approval/:email', async (req, res) => {
//     try {
//         const user = await User.findOne({ email: req.params.email }).select('-password');
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.json({
//             message: 'User status retrieved successfully',
//             user: {
//                 email: user.email,
//                 isApproved: user.isApproved,
//                 role: user.role,
//                 createdAt: user.createdAt
//             }
//         });
//     } catch (err) {
//         console.error('Check approval error:', err);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // Verify token endpoint
// router.get('/verify', authenticate, async (req, res) => {
//     try {
//         res.json({
//             message: 'Token is valid',
//             user: {
//                 id: req.user.id,
//                 email: req.user.email,
//                 role: req.user.role,
//                 isApproved: req.user.isApproved
//             }
//         });
//     } catch (err) {
//         console.error('Token verification error:', err);
//         res.status(500).json({ message: 'Token verification failed' });
//     }
// });

// // Change password
// router.put('/change-password', authenticate, async (req, res) => {
//     try {
//         const { currentPassword, newPassword } = req.body;
        
//         if (!currentPassword || !newPassword) {
//             return res.status(400).json({ message: 'Current password and new password are required' });
//         }
        
//         if (newPassword.length < 6) {
//             return res.status(400).json({ message: 'New password must be at least 6 characters long' });
//         }
        
//         const user = await User.findById(req.user.id);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
        
//         const isMatch = await user.comparePassword(currentPassword);
//         if (!isMatch) {
//             return res.status(400).json({ message: 'Current password is incorrect' });
//         }
        
//         user.password = newPassword;
//         await user.save();
        
//         res.json({ message: 'Password changed successfully' });
//     } catch (err) {
//         console.error('Change password error:', err);
//         res.status(500).json({ message: 'Failed to change password' });
//     }
// });

// // Admin route to create user accounts
// router.post('/create-user', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const { firstName, lastName, email, password, role } = req.body;
        
//         // Validate input
//         if (!firstName || !lastName || !email || !password || !role) {
//             return res.status(400).json({ message: 'All fields are required' });
//         }
        
//         if (!['student', 'teacher', 'admin'].includes(role)) {
//             return res.status(400).json({ message: 'Invalid role specified' });
//         }
        
//         // Check if user already exists
//         const existingUser = await User.findOne({ email: email.toLowerCase() });
//         if (existingUser) {
//             return res.status(400).json({ message: 'User already exists with this email' });
//         }
        
//         const user = new User({
//             firstName,
//             lastName,
//             email: email.toLowerCase(),
//             password,
//             role,
//             isApproved: true // Admin-created users are pre-approved
//         });
        
//         await user.save();
        
//         res.status(201).json({
//             message: `${role} account created successfully`,
//             user: {
//                 id: user._id,
//                 email: user.email,
//                 firstName: user.firstName,
//                 lastName: user.lastName,
//                 role: user.role,
//                 isApproved: user.isApproved
//             }
//         });
//     } catch (err) {
//         console.error('Create user error:', err);
//         res.status(500).json({ message: 'Failed to create user' });
//     }
// });

// module.exports = router;

// const express = require('express');
// const router = express.Router();

// router.get('/test', (req, res) => res.json({ message: 'Test OK' }));

// module.exports = router;