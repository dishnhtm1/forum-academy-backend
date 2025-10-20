const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const User = require('../models/User');

console.log('🔧 Loading notificationRoutes.js...');

// Test route for notifications without authentication (for development)
router.get('/test', async (req, res) => {
  try {
    // Return mock notifications for testing
    const mockNotifications = [
      {
        _id: '1',
        title: 'Welcome to Forum Academy',
        message: 'Your account has been created successfully!',
        type: 'info',
        read: false,
        createdAt: new Date(),
        recipient: 'test-user'
      },
      {
        _id: '2',
        title: 'New Assignment Posted',
        message: 'A new homework assignment has been posted for your course.',
        type: 'assignment',
        read: false,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        recipient: 'test-user'
      }
    ];

    res.json({
      notifications: mockNotifications,
      total: mockNotifications.length,
      unreadCount: mockNotifications.filter(n => !n.read).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    console.log(`📧 Fetching notifications for user: ${userId}`);

    // Build query
    const query = { recipient: userId };
    if (unreadOnly) {
      query.read = false;
    }

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .populate('sender', 'firstName lastName email avatar')
      .populate('relatedEntity.entityId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    // Get total count
    const totalCount = await Notification.countDocuments({ recipient: userId });

    console.log(`✅ Found ${notifications.length} notifications (${unreadCount} unread)`);

    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        unreadCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { 
        read: true, 
        readAt: new Date() 
      },
      { new: true }
    ).populate('sender', 'firstName lastName email');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    console.log(`✅ Marked notification ${id} as read`);

    res.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { 
        read: true, 
        readAt: new Date() 
      }
    );

    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    console.log(`🗑️ Deleted notification ${id}`);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// Get notification statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Notification.aggregate([
      { $match: { recipient: userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          }
        }
      }
    ]);

    const totalUnread = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    res.json({
      success: true,
      stats,
      totalUnread
    });

  } catch (error) {
    console.error('❌ Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics',
      error: error.message
    });
  }
});

console.log('✅ notificationRoutes.js loaded successfully');

module.exports = router;