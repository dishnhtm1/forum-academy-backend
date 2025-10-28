// services/notificationService.js
import Notification from "../models/Notification.js";

/**
 * Save a new notification to DB.
 */
export const sendNotification = async (userId, title, message, type = "general") => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      isRead: false,
    });
    await notification.save();
    console.log(`📩 Notification sent to ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error("❌ Error sending notification:", error.message);
  }
};

/**
 * Fetch notifications for a user.
 */
export const getUserNotifications = async (userId) => {
  try {
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    return notifications;
  } catch (error) {
    console.error("❌ Error fetching notifications:", error.message);
    return [];
  }
};
