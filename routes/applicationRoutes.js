// const express = require('express');
// const router = express.Router();
// const Application = require('../models/Application');
// const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// console.log('🔧 Loading applicationRoutes.js...');

// // Debug route - NO authentication required
// router.get('/debug', (req, res) => {
//     console.log('🐛 Debug route hit');
//     res.json({
//         message: 'Applications route is working!',
//         timestamp: new Date().toISOString(),
//         method: 'GET',
//         path: '/debug'
//     });
// });

// // ✅ ENHANCED: Add route debugging
// router.get('/routes-debug', (req, res) => {
//     console.log('🔍 Available routes:');
//     const routes = [];
//     router.stack.forEach((layer) => {
//         if (layer.route) {
//             const methods = Object.keys(layer.route.methods);
//             routes.push(`${methods.join(', ').toUpperCase()} /api/applications${layer.route.path}`);
//             console.log(`  ${methods.join(', ').toUpperCase()} /api/applications${layer.route.path}`);
//         }
//     });
    
//     res.json({
//         message: 'Application routes debug',
//         availableRoutes: routes,
//         timestamp: new Date().toISOString()
//     });
// });

// // GET all applications (admin only)
// router.get('/', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         console.log('📋 Admin fetching all applications...');
//         const applications = await Application.find().sort({ createdAt: -1 });
//         console.log(`✅ Found ${applications.length} applications`);
        
//         res.json({
//             success: true,
//             applications: applications,
//             count: applications.length
//         });
//     } catch (error) {
//         console.error('❌ Error fetching applications:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching applications',
//             error: error.message
//         });
//     }
// });*/

// // POST new application (public)
// router.post('/', async (req, res) => {
//     try {
//         console.log('📋 Creating new application:', req.body);
//         const application = new Application(req.body);
//         await application.save();
        
//         res.status(201).json({
//             success: true,
//             message: 'Application submitted successfully',
//             application
//         });
//     } catch (error) {
//         console.error('❌ Error creating application:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating application',
//             error: error.message
//         });
//     }
// });

// // PUT update application status (admin only) - ENHANCED
// router.put('/:id/status', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const { status } = req.body;
//         const applicationId = req.params.id;
        
//         console.log(`📝 Updating application ${applicationId} status to: ${status}`);
        
//         // ✅ ENHANCED: Validate status
//         const validStatuses = ['pending', 'approved', 'rejected'];
//         if (!validStatuses.includes(status)) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
//             });
//         }
        
//         // ✅ ENHANCED: Validate MongoDB ObjectId
//         if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid application ID format'
//             });
//         }
        
//         const application = await Application.findByIdAndUpdate(
//             applicationId,
//             { status, updatedAt: new Date() },
//             { new: true }
//         );
        
//         if (!application) {
//             console.log(`❌ Application not found: ${applicationId}`);
//             return res.status(404).json({
//                 success: false,
//                 message: 'Application not found'
//             });
//         }
        
//         console.log(`✅ Application status updated successfully: ${application.firstName} ${application.lastName}`);
//         res.json({
//             success: true,
//             message: 'Application status updated',
//             application
//         });
//     } catch (error) {
//         console.error('❌ Error updating application:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating application',
//             error: error.message
//         });
//     }
// });

// // ✅ ENHANCED: Delete application route with better error handling
// router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const applicationId = req.params.id;
//         console.log(`🗑️ DELETE request for application ID: ${applicationId}`);
//         console.log(`🔐 Requested by admin: ${req.user?.email || 'Unknown'}`);
        
//         // ✅ ENHANCED: Validate MongoDB ObjectId format
//         if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
//             console.log('❌ Invalid application ID format');
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid application ID format'
//             });
//         }
        
//         console.log(`🔍 Looking for application with ID: ${applicationId}`);
//         const application = await Application.findById(applicationId);
        
//         if (!application) {
//             console.log('❌ Application not found in database');
//             return res.status(404).json({
//                 success: false,
//                 message: 'Application not found'
//             });
//         }
        
//         console.log(`👤 Found application: ${application.firstName} ${application.lastName} (${application.email})`);
//         console.log(`🗑️ Deleting application...`);
        
//         await Application.findByIdAndDelete(applicationId);
        
//         console.log(`✅ Application deleted successfully: ${application.firstName} ${application.lastName}`);
        
//         res.json({
//             success: true,
//             message: 'Application deleted successfully',
//             deletedApplication: {
//                 id: application._id,
//                 name: `${application.firstName} ${application.lastName}`,
//                 email: application.email,
//                 program: application.programInterested
//             }
//         });
//     } catch (error) {
//         console.error('❌ Error deleting application:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting application',
//             error: error.message
//         });
//     }
// });

// // ✅ ENHANCED: Send message route with better validation
// router.post('/send-message', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const { to, subject, message, applicantName, applicationId } = req.body;
        
//         console.log('📧 Send message request received:');
//         console.log(`   From: ${req.user?.email || 'Unknown admin'}`);
//         console.log(`   To: ${to}`);
//         console.log(`   Subject: ${subject}`);
//         console.log(`   Applicant: ${applicantName}`);
//         console.log(`   Application ID: ${applicationId}`);
        
//         // ✅ ENHANCED: Validate required fields
//         if (!to || !subject || !message) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Missing required fields: to, subject, and message are required'
//             });
//         }
        
//         // ✅ ENHANCED: Validate email format
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(to)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid email address format'
//             });
//         }
        
//         // ✅ ENHANCED: Verify application exists if applicationId provided
//         if (applicationId) {
//             const application = await Application.findById(applicationId);
//             if (!application) {
//                 return res.status(404).json({
//                     success: false,
//                     message: 'Application not found'
//                 });
//             }
//         }
        
//         // Here you would integrate with your email service (SendGrid, NodeMailer, etc.)
//         // For now, we'll simulate sending with a delay
//         console.log('📧 Simulating email send...');
//         await new Promise(resolve => setTimeout(resolve, 1000));
        
//         console.log('✅ Message sent successfully');
        
//         res.json({
//             success: true,
//             message: 'Message sent successfully',
//             details: {
//                 recipient: to,
//                 subject: subject,
//                 applicant: applicantName,
//                 sentBy: req.user?.email,
//                 timestamp: new Date().toISOString()
//             }
//         });
//     } catch (error) {
//         console.error('❌ Error sending message:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error sending message',
//             error: error.message
//         });
//     }
// });

// // ✅ NEW: Get single application by ID (admin only)
// router.get('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const applicationId = req.params.id;
//         console.log(`👁️ Getting application details for ID: ${applicationId}`);
        
//         if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid application ID format'
//             });
//         }
        
//         const application = await Application.findById(applicationId);
        
//         if (!application) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Application not found'
//             });
//         }
        
//         console.log(`✅ Application found: ${application.firstName} ${application.lastName}`);
        
//         res.json({
//             success: true,
//             application: application
//         });
//     } catch (error) {
//         console.error('❌ Error fetching application:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching application',
//             error: error.message
//         });
//     }
// });

// console.log('✅ applicationRoutes.js loaded successfully');

// // ✅ ENHANCED: Log all registered routes
// console.log('📋 Registered application routes:');
// router.stack.forEach((layer) => {
//     if (layer.route) {
//         const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
//         console.log(`   ${methods} /api/applications${layer.route.path}`);
//     }
// });

// module.exports = router;

// const express = require('express');
// const router = express.Router();
// const Application = require('../models/Application');
// const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// console.log('🔧 Loading applicationRoutes.js...');

// // Debug route - NO authentication required
// router.get('/debug', (req, res) => {
//     console.log('🐛 Debug route hit');
//     res.json({
//         message: 'Applications route is working!',
//         timestamp: new Date().toISOString(),
//         method: 'GET',
//         path: '/debug'
//     });
// });

// // ✅ ENHANCED: Add route debugging
// router.get('/routes-debug', (req, res) => {
//     console.log('🔍 Available routes:');
//     const routes = [];
//     router.stack.forEach((layer) => {
//         if (layer.route) {
//             const methods = Object.keys(layer.route.methods);
//             routes.push(`${methods.join(', ').toUpperCase()} /api/applications${layer.route.path}`);
//             console.log(`  ${methods.join(', ').toUpperCase()} /api/applications${layer.route.path}`);
//         }
//     });
    
//     res.json({
//         message: 'Application routes debug',
//         availableRoutes: routes,
//         timestamp: new Date().toISOString()
//     });
// });

// // GET all applications (admin only)
// router.get('/', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         console.log('📋 Admin fetching all applications...');
//         const applications = await Application.find().sort({ createdAt: -1 });
//         console.log(`✅ Found ${applications.length} applications`);
        
//         res.json({
//             success: true,
//             applications: applications,
//             count: applications.length
//         });
//     } catch (error) {
//         console.error('❌ Error fetching applications:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching applications',
//             error: error.message
//         });
//     }
// });

// // POST new application (public)
// router.post('/', async (req, res) => {
//     try {
//         console.log('📋 Creating new application:', req.body);
//         const application = new Application(req.body);
//         await application.save();
        
//         res.status(201).json({
//             success: true,
//             message: 'Application submitted successfully',
//             application
//         });
//     } catch (error) {
//         console.error('❌ Error creating application:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating application',
//             error: error.message
//         });
//     }
// });

// // PUT update application status (admin only) - ENHANCED
// router.put('/:id/status', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const { status } = req.body;
//         const applicationId = req.params.id;
        
//         console.log(`📝 Updating application ${applicationId} status to: ${status}`);
        
//         // ✅ ENHANCED: Validate status
//         const validStatuses = ['pending', 'approved', 'rejected', 'under_review'];
//         if (!validStatuses.includes(status)) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
//             });
//         }
        
//         // ✅ ENHANCED: Validate MongoDB ObjectId
//         if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid application ID format'
//             });
//         }
        
//         const application = await Application.findByIdAndUpdate(
//             applicationId,
//             { status, updatedAt: new Date() },
//             { new: true }
//         );
        
//         if (!application) {
//             console.log(`❌ Application not found: ${applicationId}`);
//             return res.status(404).json({
//                 success: false,
//                 message: 'Application not found'
//             });
//         }
        
//         console.log(`✅ Application status updated successfully: ${application.firstName} ${application.lastName}`);
//         res.json({
//             success: true,
//             message: 'Application status updated',
//             application
//         });
//     } catch (error) {
//         console.error('❌ Error updating application:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating application',
//             error: error.message
//         });
//     }
// });

// // UNCOMMENT THIS ENTIRE SECTION (remove the // at the beginning of each line):

// // ✅ ENHANCED: Delete application route with better error handling
// router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const applicationId = req.params.id;
//         console.log(`🗑️ DELETE request for application ID: ${applicationId}`);
//         console.log(`🔐 Requested by admin: ${req.user?.email || 'Unknown'}`);
        
//         // ✅ ENHANCED: Validate MongoDB ObjectId format
//         if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
//             console.log('❌ Invalid application ID format');
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid application ID format'
//             });
//         }
        
//         console.log(`🔍 Looking for application with ID: ${applicationId}`);
//         const application = await Application.findById(applicationId);
        
//         if (!application) {
//             console.log('❌ Application not found in database');
//             return res.status(404).json({
//                 success: false,
//                 message: 'Application not found'
//             });
//         }
        
//         console.log(`👤 Found application: ${application.firstName} ${application.lastName} (${application.email})`);
//         console.log(`🗑️ Deleting application...`);
        
//         await Application.findByIdAndDelete(applicationId);
        
//         console.log(`✅ Application deleted successfully: ${application.firstName} ${application.lastName}`);
        
//         res.json({
//             success: true,
//             message: 'Application deleted successfully',
//             deletedApplication: {
//                 id: application._id,
//                 name: `${application.firstName} ${application.lastName}`,
//                 email: application.email,
//                 program: application.program
//             }
//         });
//     } catch (error) {
//         console.error('❌ Error deleting application:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting application',
//             error: error.message
//         });
//     }
// });

// // Make sure this DELETE route is uncommented and active:

// router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const applicationId = req.params.id;
//         console.log(`🗑️ DELETE request for application ID: ${applicationId}`);
//         console.log(`🔐 Requested by admin: ${req.user?.email || 'Unknown'}`);
        
//         // Validate MongoDB ObjectId format
//         if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
//             console.log('❌ Invalid application ID format');
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid application ID format'
//             });
//         }
        
//         console.log(`🔍 Looking for application with ID: ${applicationId}`);
//         const application = await Application.findById(applicationId);
        
//         if (!application) {
//             console.log('❌ Application not found in database');
//             return res.status(404).json({
//                 success: false,
//                 message: 'Application not found'
//             });
//         }
        
//         console.log(`👤 Found application: ${application.firstName} ${application.lastName} (${application.email})`);
//         console.log(`🗑️ Deleting application...`);
        
//         await Application.findByIdAndDelete(applicationId);
        
//         console.log(`✅ Application deleted successfully: ${application.firstName} ${application.lastName}`);
        
//         res.json({
//             success: true,
//             message: 'Application deleted successfully',
//             deletedApplication: {
//                 id: application._id,
//                 name: `${application.firstName} ${application.lastName}`,
//                 email: application.email,
//                 program: application.program
//             }
//         });
//     } catch (error) {
//         console.error('❌ Error deleting application:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting application',
//             error: error.message
//         });
//     }
// });

// // ✅ FIXED: Send message route with better validation
// router.post('/send-message', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const { to, subject, message, applicantName, applicationId } = req.body;
        
//         console.log('📧 Send message request received:');
//         console.log(`   From: ${req.user?.email || 'Unknown admin'}`);
//         console.log(`   To: ${to}`);
//         console.log(`   Subject: ${subject}`);
//         console.log(`   Applicant: ${applicantName}`);
//         console.log(`   Application ID: ${applicationId}`);
        
//         // ✅ ENHANCED: Validate required fields
//         if (!to || !subject || !message) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Missing required fields: to, subject, and message are required'
//             });
//         }
        
//         // ✅ ENHANCED: Validate email format
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(to)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid email address format'
//             });
//         }
        
//         // ✅ ENHANCED: Verify application exists if applicationId provided
//         if (applicationId) {
//             const application = await Application.findById(applicationId);
//             if (!application) {
//                 return res.status(404).json({
//                     success: false,
//                     message: 'Application not found'
//                 });
//             }
//         }
        
//         // Here you would integrate with your email service (SendGrid, NodeMailer, etc.)
//         // For now, we'll simulate sending with a delay
//         console.log('📧 Simulating email send...');
//         await new Promise(resolve => setTimeout(resolve, 1000));
        
//         console.log('✅ Message sent successfully');
        
//         res.json({
//             success: true,
//             message: 'Message sent successfully',
//             details: {
//                 recipient: to,
//                 subject: subject,
//                 applicant: applicantName,
//                 sentBy: req.user?.email,
//                 timestamp: new Date().toISOString()
//             }
//         });
//     } catch (error) {
//         console.error('❌ Error sending message:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error sending message',
//             error: error.message
//         });
//     }
// });

// // ✅ FIXED: Get single application by ID (admin only)
// router.get('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const applicationId = req.params.id;
//         console.log(`👁️ Getting application details for ID: ${applicationId}`);
        
//         if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid application ID format'
//             });
//         }
        
//         const application = await Application.findById(applicationId);
        
//         if (!application) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Application not found'
//             });
//         }
        
//         console.log(`✅ Application found: ${application.firstName} ${application.lastName}`);
        
//         res.json({
//             success: true,
//             application: application
//         });
//     } catch (error) {
//         console.error('❌ Error fetching application:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching application',
//             error: error.message
//         });
//     }
// });

// console.log('✅ applicationRoutes.js loaded successfully');

// // ✅ ENHANCED: Log all registered routes
// console.log('📋 Registered application routes:');
// router.stack.forEach((layer) => {
//     if (layer.route) {
//         const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
//         console.log(`   ${methods} /api/applications${layer.route.path}`);
//     }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { submitApplication, getAllApplications, updateApplicationStatus, replyToApplication } = require('../controllers/applicationController');

console.log('🔧 Loading applicationRoutes.js...');

// Debug route - NO authentication required
router.get('/debug', (req, res) => {
    console.log('🐛 Debug route hit');
    res.json({
        message: 'Applications route is working!',
        timestamp: new Date().toISOString(),
        method: 'GET',
        path: '/debug'
    });
});

// GET all applications (admin only)
router.get('/', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        console.log('📋 Admin fetching all applications...');
        const applications = await Application.find().sort({ createdAt: -1 });
        console.log(`✅ Found ${applications.length} applications`);
        
        res.json({
            success: true,
            applications: applications,
            count: applications.length
        });
    } catch (error) {
        console.error('❌ Error fetching applications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching applications',
            error: error.message
        });
    }
});

// POST new application (public)
router.post('/', async (req, res) => {
    try {
        console.log('📋 Creating new application:', req.body);
        const application = new Application(req.body);
        await application.save();
        
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application
        });
    } catch (error) {
        console.error('❌ Error creating application:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating application',
            error: error.message
        });
    }
});

// PUT update application status (admin only)
router.put('/:id/status', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const applicationId = req.params.id;
        
        console.log(`📝 Updating application ${applicationId} status to: ${status}`);
        
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        
        if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application ID format'
            });
        }
        
        const application = await Application.findByIdAndUpdate(
            applicationId,
            { status, updatedAt: new Date() },
            { new: true }
        );
        
        if (!application) {
            console.log(`❌ Application not found: ${applicationId}`);
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        
        console.log(`✅ Application status updated successfully: ${application.firstName} ${application.lastName}`);
        res.json({
            success: true,
            message: 'Application status updated',
            application
        });
    } catch (error) {
        console.error('❌ Error updating application:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating application',
            error: error.message
        });
    }
});

// PATCH update application status (admin only) - Alternative route for frontend compatibility
router.patch('/:id/status', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const applicationId = req.params.id;
        
        console.log(`📝 PATCH: Updating application ${applicationId} status to: ${status}`);
        
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        
        if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application ID format'
            });
        }
        
        const application = await Application.findByIdAndUpdate(
            applicationId,
            { status, updatedAt: new Date() },
            { new: true }
        );
        
        if (!application) {
            console.log(`❌ Application not found: ${applicationId}`);
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        
        console.log(`✅ Application status updated successfully: ${application.firstName} ${application.lastName}`);
        res.json({
            success: true,
            message: 'Application status updated',
            application
        });
    } catch (error) {
        console.error('❌ Error updating application:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating application',
            error: error.message
        });
    }
});

// DELETE application route (admin only) - THIS IS THE MISSING ROUTE
router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const applicationId = req.params.id;
        console.log(`🗑️ DELETE request for application ID: ${applicationId}`);
        console.log(`🔐 Requested by admin: ${req.user?.email || 'Unknown'}`);
        
        // Validate MongoDB ObjectId format
        if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
            console.log('❌ Invalid application ID format');
            return res.status(400).json({
                success: false,
                message: 'Invalid application ID format'
            });
        }
        
        console.log(`🔍 Looking for application with ID: ${applicationId}`);
        const application = await Application.findById(applicationId);
        
        if (!application) {
            console.log('❌ Application not found in database');
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        
        console.log(`👤 Found application: ${application.firstName} ${application.lastName} (${application.email})`);
        console.log(`🗑️ Deleting application...`);
        
        await Application.findByIdAndDelete(applicationId);
        
        console.log(`✅ Application deleted successfully: ${application.firstName} ${application.lastName}`);
        
        res.json({
            success: true,
            message: 'Application deleted successfully',
            deletedApplication: {
                id: application._id,
                name: `${application.firstName} ${application.lastName}`,
                email: application.email,
                program: application.program
            }
        });
    } catch (error) {
        console.error('❌ Error deleting application:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting application',
            error: error.message
        });
    }
});

// ✅ Send message to application route with REAL EMAIL SENDING
router.post('/send-message', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const { to, subject, message, recipientName, applicationId } = req.body;
        
        console.log('📧 Send application message request received:');
        console.log(`   From: ${req.user?.email || 'Unknown admin'}`);
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Applicant: ${recipientName}`);
        console.log(`   Application ID: ${applicationId}`);
        
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
        
        // Verify application exists if applicationId provided
        let application = null;
        if (applicationId) {
            application = await Application.findById(applicationId);
            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
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
                <p style="color: #666; margin: 5px 0;">Application Update</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h3 style="color: #1e40af; margin-top: 0;">${subject}</h3>
                <div style="color: #374151; line-height: 1.6;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            ${application ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    <strong>Regarding your application for:</strong> ${application.program}
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                    <strong>Application submitted:</strong> ${new Date(application.createdAt).toLocaleDateString()}
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                    <strong>Current status:</strong> ${application.status}
                </p>
            </div>
            ` : recipientName ? `
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
            console.log('📧 Attempting to send application email...');
            await transporter.sendMail({
                from: `"Forum Academy" <${process.env.EMAIL_USER}>`,
                to: to,
                subject: subject,
                text: message + (application ? `\n\n---\nRegarding your application for: ${application.program}` : ''),
                html: htmlMessage
            });
            
            console.log('✅ Application email sent successfully');
            
            res.json({
                success: true,
                message: 'Message sent successfully via email',
                details: {
                    recipient: to,
                    subject: subject,
                    recipientName: recipientName,
                    application: application ? application.program : null,
                    sentBy: req.user?.email,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (emailError) {
            console.error('❌ Error sending application email:', emailError);
            
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
        console.error('❌ Error sending application message:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending application message',
            error: error.message
        });
    }
});

// Add new route using controller
router.post('/:id/reply', authenticate, authorizeRoles('admin'), replyToApplication);

// Approve application route
router.put('/:id/approve', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const applicationId = req.params.id;
        console.log(`✅ Approving application: ${applicationId}`);
        
        const application = await Application.findByIdAndUpdate(
            applicationId,
            { status: 'approved', updatedAt: new Date() },
            { new: true }
        );
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Application approved successfully',
            application
        });
    } catch (error) {
        console.error('❌ Error approving application:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving application',
            error: error.message
        });
    }
});

// Reject application route
router.put('/:id/reject', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const applicationId = req.params.id;
        console.log(`❌ Rejecting application: ${applicationId}`);
        
        const application = await Application.findByIdAndUpdate(
            applicationId,
            { status: 'rejected', updatedAt: new Date() },
            { new: true }
        );
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Application rejected successfully',
            application
        });
    } catch (error) {
        console.error('❌ Error rejecting application:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting application',
            error: error.message
        });
    }
});

module.exports = router;