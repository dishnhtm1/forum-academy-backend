const Application = require('../models/Application');

exports.submitApplication = async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = [
            'firstName', 
            'lastName', 
            'email', 
            'phone',
            'program',
            'agreeToTerms'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Create new application
        const application = new Application(req.body);
        await application.save();

        // Send success response
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            applicationId: application._id
        });

    } catch (error) {
        console.error('Application submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting application. Please try again.'
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