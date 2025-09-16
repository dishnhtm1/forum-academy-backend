const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

console.log('🔧 Loading announcementRoutes.js...');

// GET all announcements (filtered by user role and target audience)
router.get('/', authenticate, async (req, res) => {
    try {
        console.log(`📢 Fetching announcements for user: ${req.user.id}, role: ${req.user.role}`);
        const { type, priority, subject, isRead } = req.query;
        
        let filter = { isPublished: true };
        
        // Filter by target audience based on user role
        const targetAudienceFilter = {
            $or: [
                { targetAudience: 'all' },
                { targetAudience: req.user.role + 's' }, // 'students' or 'teachers'
                { targetUsers: req.user.id },
                { author: req.user.id } // User can see their own announcements
            ]
        };
        
        // Combine filters
        filter = { ...filter, ...targetAudienceFilter };
        
        // Apply additional filters
        if (type) filter.type = type;
        if (priority) filter.priority = priority;
        if (subject) filter.subject = subject;
        
        let announcements = await Announcement.find(filter)
            .populate('author', 'firstName lastName email role')
            .populate('targetUsers', 'firstName lastName email role')
            .sort({ isSticky: -1, priority: -1, publishDate: -1 });
        
        // Filter by read status if requested
        if (isRead !== undefined) {
            const isReadBool = isRead === 'true';
            announcements = announcements.filter(announcement => {
                const hasRead = announcement.isReadBy(req.user.id);
                return isReadBool ? hasRead : !hasRead;
            });
        }
        
        // Add read status to each announcement
        const announcementsWithReadStatus = announcements.map(announcement => {
            const announcementObj = announcement.toObject();
            announcementObj.isReadByCurrentUser = announcement.isReadBy(req.user.id);
            return announcementObj;
        });
        
        console.log(`✅ Found ${announcementsWithReadStatus.length} announcements`);
        
        res.json({
            success: true,
            announcements: announcementsWithReadStatus,
            count: announcementsWithReadStatus.length
        });
    } catch (error) {
        console.error('❌ Error fetching announcements:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching announcements',
            error: error.message
        });
    }
});

// GET single announcement by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        console.log(`📢 Fetching announcement with ID: ${req.params.id}`);
        const announcement = await Announcement.findById(req.params.id)
            .populate('author', 'firstName lastName email role')
            .populate('targetUsers', 'firstName lastName email role')
            .populate('readBy.user', 'firstName lastName email role');
        
        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }
        
        // Check if user can view this announcement
        const canView = announcement.targetAudience === 'all' ||
                       announcement.targetAudience === req.user.role + 's' ||
                       announcement.targetUsers.some(user => user._id.toString() === req.user.id) ||
                       announcement.author._id.toString() === req.user.id ||
                       req.user.role === 'admin';
        
        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this announcement'
            });
        }
        
        // Mark as read if not already read
        if (!announcement.isReadBy(req.user.id)) {
            await announcement.markAsRead(req.user.id);
        }
        
        const announcementObj = announcement.toObject();
        announcementObj.isReadByCurrentUser = true; // Just marked as read
        
        console.log('✅ Announcement fetched successfully');
        res.json({
            success: true,
            announcement: announcementObj
        });
    } catch (error) {
        console.error('❌ Error fetching announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching announcement',
            error: error.message
        });
    }
});

// POST create new announcement (teachers and admin only)
router.post('/', authenticate, authorizeRoles('teacher', 'admin'), async (req, res) => {
    try {
        console.log('📝 Creating new announcement...');
        const {
            title,
            content,
            targetAudience,
            targetUsers,
            subject,
            gradeLevel,
            priority,
            type,
            publishDate,
            expiryDate,
            isSticky,
            tags
        } = req.body;
        
        // Validate target users if specified
        if (targetUsers && targetUsers.length > 0) {
            const users = await User.find({ _id: { $in: targetUsers } });
            if (users.length !== targetUsers.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Some target users are invalid'
                });
            }
        }
        
        const announcement = new Announcement({
            title,
            content,
            author: req.user.id,
            targetAudience: targetAudience || 'all',
            targetUsers: targetUsers || [],
            subject,
            gradeLevel,
            priority: priority || 'medium',
            type: type || 'general',
            publishDate: publishDate ? new Date(publishDate) : new Date(),
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            isSticky: isSticky || false,
            tags: tags || []
        });
        
        await announcement.save();
        await announcement.populate('author', 'firstName lastName email role');
        await announcement.populate('targetUsers', 'firstName lastName email role');
        
        console.log('✅ Announcement created successfully');
        res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            announcement
        });
    } catch (error) {
        console.error('❌ Error creating announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating announcement',
            error: error.message
        });
    }
});

// PUT update announcement (author and admin only)
router.put('/:id', authenticate, async (req, res) => {
    try {
        console.log(`✏️ Updating announcement with ID: ${req.params.id}`);
        const announcement = await Announcement.findById(req.params.id);
        
        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }
        
        // Check authorization (author or admin)
        if (announcement.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this announcement'
            });
        }
        
        const {
            title,
            content,
            targetAudience,
            targetUsers,
            subject,
            gradeLevel,
            priority,
            type,
            publishDate,
            expiryDate,
            isPublished,
            isSticky,
            tags
        } = req.body;
        
        // Validate target users if specified
        if (targetUsers && targetUsers.length > 0) {
            const users = await User.find({ _id: { $in: targetUsers } });
            if (users.length !== targetUsers.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Some target users are invalid'
                });
            }
        }
        
        // Update fields
        if (title !== undefined) announcement.title = title;
        if (content !== undefined) announcement.content = content;
        if (targetAudience !== undefined) announcement.targetAudience = targetAudience;
        if (targetUsers !== undefined) announcement.targetUsers = targetUsers;
        if (subject !== undefined) announcement.subject = subject;
        if (gradeLevel !== undefined) announcement.gradeLevel = gradeLevel;
        if (priority !== undefined) announcement.priority = priority;
        if (type !== undefined) announcement.type = type;
        if (publishDate !== undefined) announcement.publishDate = new Date(publishDate);
        if (expiryDate !== undefined) announcement.expiryDate = expiryDate ? new Date(expiryDate) : undefined;
        if (isPublished !== undefined) announcement.isPublished = isPublished;
        if (isSticky !== undefined) announcement.isSticky = isSticky;
        if (tags !== undefined) announcement.tags = tags;
        
        await announcement.save();
        await announcement.populate('author', 'firstName lastName email role');
        await announcement.populate('targetUsers', 'firstName lastName email role');
        
        console.log('✅ Announcement updated successfully');
        res.json({
            success: true,
            message: 'Announcement updated successfully',
            announcement
        });
    } catch (error) {
        console.error('❌ Error updating announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating announcement',
            error: error.message
        });
    }
});

// DELETE announcement (author and admin only)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        console.log(`🗑️ Deleting announcement with ID: ${req.params.id}`);
        const announcement = await Announcement.findById(req.params.id);
        
        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }
        
        // Check authorization (author or admin)
        if (announcement.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this announcement'
            });
        }
        
        await Announcement.findByIdAndDelete(req.params.id);
        
        console.log('✅ Announcement deleted successfully');
        res.json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting announcement',
            error: error.message
        });
    }
});

// POST mark announcement as read
router.post('/:id/read', authenticate, async (req, res) => {
    try {
        console.log(`👁️ Marking announcement ${req.params.id} as read by user ${req.user.id}`);
        const announcement = await Announcement.findById(req.params.id);
        
        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }
        
        await announcement.markAsRead(req.user.id);
        
        console.log('✅ Announcement marked as read');
        res.json({
            success: true,
            message: 'Announcement marked as read'
        });
    } catch (error) {
        console.error('❌ Error marking announcement as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking announcement as read',
            error: error.message
        });
    }
});

// GET announcements statistics (admin and teachers only)
router.get('/stats/summary', authenticate, authorizeRoles('teacher', 'admin'), async (req, res) => {
    try {
        console.log('📊 Fetching announcement statistics...');
        
        let filter = { isPublished: true };
        if (req.user.role === 'teacher') {
            filter.author = req.user.id;
        }
        
        const totalAnnouncements = await Announcement.countDocuments(filter);
        const activeAnnouncements = await Announcement.countDocuments({
            ...filter,
            $or: [
                { expiryDate: { $exists: false } },
                { expiryDate: { $gte: new Date() } }
            ]
        });
        
        const priorityStats = await Announcement.aggregate([
            { $match: filter },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);
        
        const typeStats = await Announcement.aggregate([
            { $match: filter },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        
        console.log('✅ Announcement statistics calculated');
        res.json({
            success: true,
            stats: {
                totalAnnouncements,
                activeAnnouncements,
                priorityStats,
                typeStats
            }
        });
    } catch (error) {
        console.error('❌ Error fetching announcement statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching announcement statistics',
            error: error.message
        });
    }
});

module.exports = router;