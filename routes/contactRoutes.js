// const express = require('express');
// const router = express.Router();
// const Contact = require('../models/Contact');
// const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// // GET all contacts (admin only) - This is what your dashboard calls
// router.get('/', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         console.log('📧 Fetching all contact submissions...');
//         const contacts = await Contact.find().sort({ createdAt: -1 });
//         console.log(`✅ Found ${contacts.length} contact submissions`);
        
//         res.json({
//             success: true,
//             contacts: contacts,
//             count: contacts.length
//         });
//     } catch (error) {
//         console.error('❌ Error fetching contacts:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching contact submissions',
//             error: error.message
//         });
//     }
// });

// // POST new contact (public) - For contact form submissions
// router.post('/', async (req, res) => {
//     try {
//         console.log('📧 Creating new contact submission:', req.body);
//         const contact = new Contact(req.body);
//         await contact.save();
        
//         res.status(201).json({
//             success: true,
//             message: 'Contact message sent successfully',
//             contact
//         });
//     } catch (error) {
//         console.error('❌ Error creating contact:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error sending contact message',
//             error: error.message
//         });
//     }
// });

// // PUT update contact status (admin only)
// router.put('/:id/status', authenticate, authorizeRoles('admin'), async (req, res) => {
//     try {
//         const { status } = req.body;
//         const contactId = req.params.id;
        
//         console.log(`📧 Updating contact ${contactId} status to: ${status}`);
        
//         const contact = await Contact.findByIdAndUpdate(
//             contactId,
//             { status, updatedAt: new Date() },
//             { new: true }
//         );
        
//         if (!contact) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Contact submission not found'
//             });
//         }
        
//         console.log(`✅ Contact status updated successfully`);
//         res.json({
//             success: true,
//             message: 'Contact status updated successfully',
//             contact
//         });
//     } catch (error) {
//         console.error('❌ Error updating contact status:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating contact status',
//             error: error.message
//         });
//     }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

console.log('🔧 Loading contactRoutes.js...');

// Debug route
router.get('/debug', (req, res) => {
    res.json({
        message: 'Contact route is working!',
        timestamp: new Date().toISOString()
    });
});

// GET all contacts (admin only)
router.get('/', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        console.log('📧 Admin fetching all contacts...');
        const contacts = await Contact.find().sort({ createdAt: -1 });
        console.log(`✅ Found ${contacts.length} contacts`);
        
        res.json({
            success: true,
            contacts: contacts,
            count: contacts.length
        });
    } catch (error) {
        console.error('❌ Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contacts',
            error: error.message
        });
    }
});

// POST new contact (public)
router.post('/', async (req, res) => {
    try {
        console.log('📧 Creating new contact:', req.body);
        const contact = new Contact(req.body);
        await contact.save();
        
        res.status(201).json({
            success: true,
            message: 'Contact submitted successfully',
            contact
        });
    } catch (error) {
        console.error('❌ Error creating contact:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating contact',
            error: error.message
        });
    }
});

// PUT update contact status (admin only) - FIXED ROUTE
router.put('/:id/status', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Contact status updated',
            contact
        });
    } catch (error) {
        console.error('❌ Error updating contact:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating contact',
            error: error.message
        });
    }
});

console.log('✅ contactRoutes.js loaded successfully');
module.exports = router;