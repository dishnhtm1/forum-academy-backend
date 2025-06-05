// const express = require('express');
// const router = express.Router();
// const Application = require('../models/Application');
// const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// // Add this BEFORE your existing routes (around line 18):

// // TEMPORARY TEST ROUTE - Remove this in production
// router.get('/test', async (req, res) => {
//     try {
//         console.log('🧪 Testing applications route...');
//         const applications = await Application.find().sort({ createdAt: -1 });
//         res.json({
//             success: true,
//             message: 'Applications route is working',
//             count: applications.length,
//             applications: applications
//         });
//     } catch (error) {
//         console.error('❌ Test route error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Test route error',
//             error: error.message
//         });
//     }
// });


// // GET all applications (admin only) - This is what your dashboard calls
// router.get('/', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         console.log('📋 Fetching all applications...');
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

// // POST new application (public) - For application form submissions
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
//             message: 'Error submitting application',
//             error: error.message
//         });
//     }
// });

// // PUT update application status (admin only)
// router.put('/:id/status', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const { status } = req.body;
//         const applicationId = req.params.id;
        
//         console.log(`📋 Updating application ${applicationId} status to: ${status}`);
        
//         const application = await Application.findByIdAndUpdate(
//             applicationId,
//             { status, updatedAt: new Date() },
//             { new: true }
//         );
        
//         if (!application) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Application not found'
//             });
//         }
        
//         console.log(`✅ Application status updated successfully`);
//         res.json({
//             success: true,
//             message: 'Application status updated successfully',
//             application
//         });
//     } catch (error) {
//         console.error('❌ Error updating application status:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating application status',
//             error: error.message
//         });
//     }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

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

// PUT update application status (admin only) - FIXED ROUTE
router.put('/:id/status', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { status },
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

console.log('✅ applicationRoutes.js loaded successfully');
module.exports = router;