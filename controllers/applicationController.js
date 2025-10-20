const Application = require('../models/Application');
const { sendReplyEmail, sendApplicationStatusEmail } = require('../services/emailService');
const NotificationService = require('../services/notificationService');

exports.submitApplication = async (req, res) => {
    try {
        console.log('📋 Received application data:', req.body);
        
        // Validate required fields
        const requiredFields = [
            'fullName', 
            'email', 
            'phone',
            'course',
            'startDate',
            'highestEducation',
            'howDidYouHear',
            'agreeToTerms'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            console.log('❌ Missing required fields:', missingFields);
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Ensure agreeToTerms is true
        if (!req.body.agreeToTerms) {
            return res.status(400).json({
                success: false,
                message: 'You must agree to the terms and conditions'
            });
        }

        // Prepare application data
        const applicationData = {
            // Personal Information
            fullName: req.body.fullName,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            dateOfBirth: req.body.dateOfBirth,
            address: req.body.address,
            nationality: req.body.nationality,
            
            // Education Information
            highestEducation: req.body.highestEducation,
            schoolName: req.body.schoolName,
            graduationYear: req.body.graduationYear,
            fieldOfStudy: req.body.fieldOfStudy,
            currentEmployment: req.body.currentEmployment,
            techExperience: req.body.techExperience,
            
            // Course Selection
            course: req.body.course,
            program: req.body.program || req.body.course, // Use course as fallback for program
            startDate: req.body.startDate,
            format: req.body.format,
            
            // Additional Information
            goals: req.body.goals,
            whyThisProgram: req.body.whyThisProgram,
            challenges: req.body.challenges,
            extraInfo: req.body.extraInfo,
            howDidYouHear: req.body.howDidYouHear,
            agreeToTerms: req.body.agreeToTerms,
            
            // Set default status
            status: 'pending'
        };

        // Create new application
        const application = new Application(applicationData);
        await application.save();

        console.log('✅ Application saved successfully:', application._id);

        // Create notification for admins about new application
        try {
            await NotificationService.notifyAdminsApplicationSubmission(application._id, null);
        } catch (notificationError) {
            console.error('⚠️ Failed to send application notification:', notificationError);
        }

        // Send success response
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully! We will review your application and get back to you soon.',
            applicationId: application._id,
            application: {
                id: application._id,
                fullName: application.fullName,
                email: application.email,
                course: application.course,
                status: application.status,
                createdAt: application.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Application submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting application. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
// New function to get all applications for admin
exports.getAllApplications = async (req, res) => {
    try {
        const { status, program, page = 1, limit = 10 } = req.query;
        
        let filter = {};
        if (status) filter.status = status;
        if (program) filter.program = program;
        
        const applications = await Application.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
            
        const total = await Application.countDocuments(filter);
        
        res.json({
            success: true,
            message: 'Applications retrieved successfully',
            applications,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications'
        });
    }
};

// New function to update application status
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['pending', 'approved', 'rejected', 'under_review'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }
        
        const application = await Application.findByIdAndUpdate(
            id,
            { status, updatedAt: new Date() },
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
            message: `Application marked as ${status}`,
            application
        });
    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update application status'
        });
    }
};

// New function to reply to application
exports.replyToApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { replySubject, replyMessage, sendStatusEmail = false } = req.body;
        
        if (!replySubject || !replyMessage) {
            return res.status(400).json({
                success: false,
                message: 'Reply subject and message are required'
            });
        }
        
        const application = await Application.findById(id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        
        // Send reply email
        if (sendStatusEmail) {
            // Send status-specific email with custom message
            await sendApplicationStatusEmail(
                application.email, 
                application.fullName, 
                application.status, 
                replyMessage
            );
        } else {
            // Send general reply email
            await sendReplyEmail(application.email, replySubject, replyMessage, 'application');
        }
        
        // Update application with reply info
        const updatedApplication = await Application.findByIdAndUpdate(
            id,
            { 
                repliedAt: new Date(),
                replySubject,
                replyMessage,
                updatedAt: new Date()
            },
            { new: true }
        );
        
        res.json({
            success: true,
            message: 'Reply sent successfully',
            application: updatedApplication
        });
    } catch (error) {
        console.error('Reply to application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reply: ' + error.message
        });
    }
};