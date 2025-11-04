const Notification = require("../models/Notification");
const User = require("../models/User");

console.log("🔧 Loading notificationService.js...");

class NotificationService {
  // Create a new notification
  static async createNotification({
    recipient,
    sender,
    type,
    title,
    message,
    priority = "medium",
    relatedEntity = null,
    actionUrl = null,
  }) {
    try {
      const notification = new Notification({
        recipient,
        sender,
        type,
        title,
        message,
        priority,
        relatedEntity,
        actionUrl,
      });

      await notification.save();
      console.log(`✅ Created notification: ${type} for user ${recipient}`);

      return notification;
    } catch (error) {
      console.error("❌ Error creating notification:", error);
      throw error;
    }
  }

  // Create notifications for multiple recipients
  static async createBulkNotifications({
    recipients,
    sender,
    type,
    title,
    message,
    priority = "medium",
    relatedEntity = null,
    actionUrl = null,
  }) {
    try {
      const notifications = recipients.map((recipient) => ({
        recipient,
        sender,
        type,
        title,
        message,
        priority,
        relatedEntity,
        actionUrl,
      }));

      const result = await Notification.insertMany(notifications);
      console.log(`✅ Created ${result.length} bulk notifications`);

      return result;
    } catch (error) {
      console.error("❌ Error creating bulk notifications:", error);
      throw error;
    }
  }

  // Notification creators for specific events

  // Student progress notification
  static async notifyTeachersStudentProgress(
    studentId,
    courseId,
    progressData
  ) {
    try {
      // Get all teachers (users with role 'teacher' or 'admin')
      const teachers = await User.find({
        role: { $in: ["teacher", "admin"] },
      }).select("_id");

      const student = await User.findById(studentId).select(
        "firstName lastName"
      );

      if (!student || teachers.length === 0) {
        console.log("⚠️ No teachers found or student not found");
        return;
      }

      const teacherIds = teachers.map((teacher) => teacher._id);

      await this.createBulkNotifications({
        recipients: teacherIds,
        sender: studentId,
        type: "progress_update",
        title: "Student Progress Update",
        message: `${student.firstName} ${student.lastName} completed a lesson`,
        priority: "low",
        relatedEntity: {
          entityType: "Progress",
          entityId: progressData._id,
        },
        actionUrl: `/admin/students/${studentId}/progress`,
      });
    } catch (error) {
      console.error("❌ Error notifying teachers of student progress:", error);
    }
  }

  // Homework submission notification
  static async notifyTeachersHomeworkSubmission(
    studentId,
    homeworkId,
    submissionId
  ) {
    try {
      const teachers = await User.find({
        role: { $in: ["teacher", "admin"] },
      }).select("_id");

      const student = await User.findById(studentId).select(
        "firstName lastName"
      );

      if (!student || teachers.length === 0) {
        console.log("⚠️ No teachers found or student not found");
        return;
      }

      const teacherIds = teachers.map((teacher) => teacher._id);

      await this.createBulkNotifications({
        recipients: teacherIds,
        sender: studentId,
        type: "assignment_submission",
        title: "New Homework Submission",
        message: `${student.firstName} ${student.lastName} submitted homework`,
        priority: "medium",
        relatedEntity: {
          entityType: "HomeworkSubmission",
          entityId: submissionId,
        },
        actionUrl: `/admin/homework/${homeworkId}/submissions`,
      });
    } catch (error) {
      console.error(
        "❌ Error notifying teachers of homework submission:",
        error
      );
    }
  }

  // Quiz submission notification
  static async notifyTeachersQuizSubmission(studentId, quizId, submissionId) {
    try {
      const teachers = await User.find({
        role: { $in: ["teacher", "admin"] },
      }).select("_id");

      const student = await User.findById(studentId).select(
        "firstName lastName"
      );

      if (!student || teachers.length === 0) {
        console.log("⚠️ No teachers found or student not found");
        return;
      }

      const teacherIds = teachers.map((teacher) => teacher._id);

      await this.createBulkNotifications({
        recipients: teacherIds,
        sender: studentId,
        type: "quiz_submission",
        title: "New Quiz Submission",
        message: `${student.firstName} ${student.lastName} completed a quiz`,
        priority: "medium",
        relatedEntity: {
          entityType: "QuizSubmission",
          entityId: submissionId,
        },
        actionUrl: `/admin/quiz/${quizId}/submissions`,
      });
    } catch (error) {
      console.error("❌ Error notifying teachers of quiz submission:", error);
    }
  }

  // New student registration notification
  static async notifyAdminsNewStudent(studentId) {
    try {
      const admins = await User.find({ role: "admin" }).select("_id");
      const student = await User.findById(studentId).select(
        "firstName lastName email"
      );

      if (!student || admins.length === 0) {
        console.log("⚠️ No admins found or student not found");
        return;
      }

      const adminIds = admins.map((admin) => admin._id);

      await this.createBulkNotifications({
        recipients: adminIds,
        sender: studentId,
        type: "student_registration",
        title: "New Student Registration",
        message: `${student.firstName} ${student.lastName} has registered`,
        priority: "medium",
        relatedEntity: {
          entityType: "User",
          entityId: studentId,
        },
        actionUrl: `/admin/students/${studentId}`,
      });
    } catch (error) {
      console.error("❌ Error notifying admins of new student:", error);
    }
  }

  // Application submission notification
  static async notifyAdminsApplicationSubmission(applicationId, studentId) {
    try {
      const admins = await User.find({ role: "admin" }).select("_id");
      const student = await User.findById(studentId).select(
        "firstName lastName"
      );

      if (!student || admins.length === 0) {
        console.log("⚠️ No admins found or student not found");
        return;
      }

      const adminIds = admins.map((admin) => admin._id);

      await this.createBulkNotifications({
        recipients: adminIds,
        sender: studentId,
        type: "application_update",
        title: "New Application Submitted",
        message: `${student.firstName} ${student.lastName} submitted an application`,
        priority: "high",
        relatedEntity: {
          entityType: "Application",
          entityId: applicationId,
        },
        actionUrl: `/admin/applications/${applicationId}`,
      });
    } catch (error) {
      console.error(
        "❌ Error notifying admins of application submission:",
        error
      );
    }
  }

  // Contact submission notification
  static async notifyAdminsContactSubmission(
    contactId,
    contactName,
    contactEmail
  ) {
    try {
      const admins = await User.find({ role: "admin" }).select("_id");

      if (admins.length === 0) {
        console.log("⚠️ No admins found");
        return;
      }

      const adminIds = admins.map((admin) => admin._id);

      await this.createBulkNotifications({
        recipients: adminIds,
        sender: null, // Contact submissions don't have a user ID
        type: "contact_message",
        title: "New Contact Message",
        message: `${contactName} (${contactEmail}) sent you a message`,
        priority: "high",
        relatedEntity: {
          entityType: "Contact",
          entityId: contactId,
        },
        actionUrl: `/admin/applications`, // or wherever you show contacts
      });
    } catch (error) {
      console.error("❌ Error notifying admins of contact submission:", error);
    }
  }

  // System announcement notification
  static async notifyAllUsersAnnouncement(announcementId, senderId, title) {
    try {
      // Get all active users
      const users = await User.find({
        role: { $in: ["student", "teacher", "admin"] },
        _id: { $ne: senderId }, // Exclude the sender
      }).select("_id");

      if (users.length === 0) {
        console.log("⚠️ No users found to notify");
        return;
      }

      const userIds = users.map((user) => user._id);

      await this.createBulkNotifications({
        recipients: userIds,
        sender: senderId,
        type: "admin_announcement",
        title: "New Announcement",
        message: title,
        priority: "medium",
        relatedEntity: {
          entityType: "Announcement",
          entityId: announcementId,
        },
        actionUrl: `/announcements/${announcementId}`,
      });
    } catch (error) {
      console.error("❌ Error notifying users of announcement:", error);
    }
  }

  // Grade posted notification
  static async notifyStudentGrade(studentId, teacherId, courseId, grade) {
    try {
      const teacher = await User.findById(teacherId).select(
        "firstName lastName"
      );

      if (!teacher) {
        console.log("⚠️ Teacher not found");
        return;
      }

      await this.createNotification({
        recipient: studentId,
        sender: teacherId,
        type: "grade_update",
        title: "New Grade Posted",
        message: `${teacher.firstName} ${teacher.lastName} posted your grade: ${grade}%`,
        priority: "medium",
        relatedEntity: {
          entityType: "Progress",
          entityId: courseId,
        },
        actionUrl: `/student/grades`,
      });
    } catch (error) {
      console.error("❌ Error notifying student of grade:", error);
    }
  }

  // System maintenance notification
  static async notifySystemMaintenance(adminId, maintenanceDetails) {
    try {
      // Get all users
      const users = await User.find({
        role: { $in: ["student", "teacher", "admin"] },
        _id: { $ne: adminId },
      }).select("_id");

      if (users.length === 0) {
        console.log("⚠️ No users found to notify");
        return;
      }

      const userIds = users.map((user) => user._id);

      await this.createBulkNotifications({
        recipients: userIds,
        sender: adminId,
        type: "system_alert",
        title: "System Maintenance Notice",
        message: maintenanceDetails.message || "Scheduled system maintenance",
        priority: "high",
        actionUrl: "/maintenance-notice",
      });
    } catch (error) {
      console.error("❌ Error notifying users of system maintenance:", error);
    }
  }

  // Clean up old notifications (for maintenance)
  static async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        read: true,
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error("❌ Error cleaning up old notifications:", error);
      throw error;
    }
  }
}

console.log("✅ notificationService.js loaded successfully");

module.exports = NotificationService;
