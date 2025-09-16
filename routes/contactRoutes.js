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
const { submitContact, getAllContacts, updateContactStatus, replyToContact } = require('../controllers/contactController');

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

// Add this DELETE route with your existing routes
router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const contactId = req.params.id;
        console.log(`🗑️ DELETE request for contact ID: ${contactId}`);
        
        // Validate MongoDB ObjectId format
        if (!contactId.match(/^[0-9a-fA-F]{24}$/)) {
            console.log('❌ Invalid contact ID format');
            return res.status(400).json({
                success: false,
                message: 'Invalid contact ID format'
            });
        }
        
        const contact = await Contact.findById(contactId);
        
        if (!contact) {
            console.log('❌ Contact not found in database');
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }
        
        console.log(`👤 Found contact: ${contact.name} (${contact.email})`);
        
        await Contact.findByIdAndDelete(contactId);
        
        console.log(`✅ Contact deleted successfully`);
        
        res.json({
            success: true,
            message: 'Contact deleted successfully',
            deletedContact: {
                id: contact._id,
                name: contact.name,
                email: contact.email,
                subject: contact.subject
            }
        });
    } catch (error) {
        console.error('❌ Error deleting contact:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting contact',
            error: error.message
        });
    }
});

// Add reply endpoint - NOW WITH REAL EMAIL SENDING
router.post('/reply', authenticate, authorizeRoles('admin'), async (req, res) => {
    try {
        const { contactId, subject, message, recipientEmail } = req.body;
        console.log(`📧 Sending reply to contact ${contactId}`);
        
        // Validate required fields
        if (!contactId || !subject || !message || !recipientEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: contactId, subject, message, recipientEmail'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address format'
            });
        }
        
        // Find the original contact
        const contact = await Contact.findById(contactId);
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }
        
        console.log(`📧 Reply Details:
        To: ${recipientEmail}
        Subject: ${subject}
        Message: ${message}
        Original Contact: ${contact.name} (${contact.email})`);
        
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
                <p style="color: #666; margin: 5px 0;">Response to Your Inquiry</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h3 style="color: #1e40af; margin-top: 0;">${subject}</h3>
                <div style="color: #374151; line-height: 1.6;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    <strong>Reference:</strong> This is a reply to your inquiry: "${contact.subject}"
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                    <strong>Original message submitted:</strong> ${new Date(contact.createdAt).toLocaleDateString()}
                </p>
            </div>
            
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
                to: recipientEmail,
                subject: subject,
                text: message + `\n\n---\nThis is a reply to your inquiry: "${contact.subject}"`,
                html: htmlMessage
            });
            
            console.log('✅ Email sent successfully');
            
            // Update contact status to indicate reply was sent
            await Contact.findByIdAndUpdate(contactId, {
                status: 'resolved',
                repliedAt: new Date(),
                replySubject: subject,
                replyMessage: message
            });
            
            res.json({
                success: true,
                message: 'Reply sent successfully via email',
                details: {
                    recipient: recipientEmail,
                    subject: subject,
                    originalInquiry: contact.subject,
                    sentAt: new Date().toISOString()
                }
            });
            
        } catch (emailError) {
            console.error('❌ Error sending email:', emailError);
            
            // Still update the status but indicate email failed
            await Contact.findByIdAndUpdate(contactId, {
                status: 'resolved',
                repliedAt: new Date(),
                replySubject: subject,
                replyMessage: message,
                emailSent: false,
                emailError: emailError.message
            });
            
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
        console.error('❌ Error sending reply:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending reply',
            error: error.message
        });
    }
});

// Add new route using controller
router.post('/:id/reply', authenticate, authorizeRoles('admin'), replyToContact);

console.log('✅ contactRoutes.js loaded successfully');
module.exports = router;