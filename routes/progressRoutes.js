const express = require("express");
const router = express.Router();
const Progress = require("../models/Progress");
const User = require("../models/User");
const Course = require("../models/Course");
const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");
const NotificationService = require("../services/notificationService");

console.log("🔧 Loading progressRoutes.js...");

// GET all progress records (admin and teachers can see all, students see only their own)
router.get("/", authenticate, async (req, res) => {
  try {
    console.log(
      `📊 Fetching progress records for user: ${req.user.id}, role: ${req.user.role}`
    );
    const { subject, student, teacher, assignmentType } = req.query;

    let filter = {};

    // Apply role-based filtering
    if (req.user.role === "student") {
      filter.student = req.user.id;
    } else if (req.user.role === "teacher") {
      filter.teacher = req.user.id;
    }
    // Admin can see all records (no additional filter)

    // Apply query filters
    if (subject) filter.subject = subject;
    if (student && req.user.role !== "student") filter.student = student;
    if (teacher && req.user.role === "admin") filter.teacher = teacher;
    if (assignmentType) filter.assignmentType = assignmentType;

    const progressRecords = await Progress.find(filter)
      .populate("student", "firstName lastName email studentId gradeLevel")
      .populate("teacher", "firstName lastName email subject")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${progressRecords.length} progress records`);

    res.json({
      success: true,
      progress: progressRecords,
      count: progressRecords.length,
    });
  } catch (error) {
    console.error("❌ Error fetching progress records:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress records",
      error: error.message,
    });
  }
});

// GET single progress record by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    console.log(`📊 Fetching progress record with ID: ${req.params.id}`);
    const progress = await Progress.findById(req.params.id)
      .populate("student", "firstName lastName email studentId gradeLevel")
      .populate("teacher", "firstName lastName email subject");

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress record not found",
      });
    }

    // Check authorization
    const canView =
      req.user.role === "admin" ||
      progress.student._id.toString() === req.user.id ||
      progress.teacher._id.toString() === req.user.id;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this progress record",
      });
    }

    console.log("✅ Progress record fetched successfully");
    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("❌ Error fetching progress record:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress record",
      error: error.message,
    });
  }
});

// POST create new progress record (teachers and admin only)
router.post(
  "/",
  authenticate,
  authorizeRoles("teacher", "admin"),
  async (req, res) => {
    try {
      console.log("� POST /api/progress - Creating new progress record");
      console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
      console.log("👤 User:", req.user.id, "Role:", req.user.role);
      console.log("�📝 Creating new progress record...");
      const {
        student,
        subject,
        assignment,
        assignmentName,
        description,
        feedback,
        grade,
        score,
        maxScore,
        comments,
        assignmentType,
        submissionDate,
        isPublished,
        tags,
        course,
        courseId,
      } = req.body;

      // Verify student exists
      const studentUser = await User.findById(student);
      if (!studentUser || studentUser.role !== "student") {
        return res.status(400).json({
          success: false,
          message: "Invalid student ID",
        });
      }

      const resolveCourseId = courseId || course;
      let resolvedCourse = null;
      if (resolveCourseId) {
        try {
          resolvedCourse = await Course.findById(resolveCourseId).lean();
        } catch (courseError) {
          console.warn(
            "⚠️ Unable to resolve course for progress record:",
            courseError
          );
        }
      }

      let resolvedSubject =
        subject ||
        resolvedCourse?.title ||
        resolvedCourse?.name ||
        resolvedCourse?.code ||
        "General";

      const normalizedAssignment =
        assignmentName || assignment || "Assignment";

      const normalizedComments =
        comments || feedback || description || "";

      const parsedScore =
        typeof score === "string" ? Number(score) : score;
      const parsedMaxScore =
        typeof maxScore === "string" ? Number(maxScore) : maxScore || 100;

      if (
        Number.isNaN(parsedScore) ||
        parsedScore == null ||
        parsedScore < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Score must be provided as a valid number",
        });
      }

      const safeMaxScore =
        parsedMaxScore && parsedMaxScore > 0 ? parsedMaxScore : 100;

      const percentage = Math.min(
        100,
        Math.round((parsedScore / safeMaxScore) * 100)
      );

      const gradeScale = [
        { threshold: 97, value: "A+" },
        { threshold: 93, value: "A" },
        { threshold: 90, value: "A-" },
        { threshold: 87, value: "B+" },
        { threshold: 83, value: "B" },
        { threshold: 80, value: "B-" },
        { threshold: 77, value: "C+" },
        { threshold: 73, value: "C" },
        { threshold: 70, value: "C-" },
        { threshold: 67, value: "D+" },
        { threshold: 65, value: "D" },
      ];

      const derivedGrade =
        gradeScale.find((entry) => percentage >= entry.threshold)?.value ||
        "F";

      const normalizedGrade = (() => {
        if (!grade) return derivedGrade;
        const upper = String(grade).toUpperCase();
        const allowed = [
          "A+",
          "A",
          "A-",
          "B+",
          "B",
          "B-",
          "C+",
          "C",
          "C-",
          "D+",
          "D",
          "F",
        ];
        return allowed.includes(upper) ? upper : derivedGrade;
      })();

      const normalizedAssignmentType =
        assignmentType || resolvedCourse?.defaultAssignmentType || "homework";

      const progress = new Progress({
        student,
        teacher: req.user.id,
        subject: resolvedSubject,
        assignment: normalizedAssignment,
        description,
        grade: normalizedGrade,
        score: parsedScore,
        maxScore: safeMaxScore,
        comments: normalizedComments,
        assignmentType: normalizedAssignmentType,
        submissionDate,
        isPublished: isPublished !== false,
        tags: tags || [],
      });

      await progress.save();
      await progress.populate(
        "student",
        "firstName lastName email studentId gradeLevel"
      );
      await progress.populate("teacher", "firstName lastName email subject");

      // Create notification for teachers about student progress
      try {
        await NotificationService.notifyTeachersStudentProgress(
          student,
          subject,
          progress
        );
      } catch (notificationError) {
        console.error(
          "⚠️ Failed to send progress notification:",
          notificationError
        );
        // Don't fail the main operation if notification fails
      }

      console.log("✅ Progress record created successfully");
      res.status(201).json({
        success: true,
        message: "Progress record created successfully",
        progress,
      });
    } catch (error) {
      console.error("❌ Error creating progress record:", error);
      if (error?.name === "ValidationError") {
        const details = Object.entries(error.errors || {}).reduce(
          (acc, [key, err]) => {
            acc[key] = err.message;
            return acc;
          },
          {}
        );
        return res.status(400).json({
          success: false,
          message: "Validation failed while creating progress record",
          error: details,
        });
      }
      res.status(500).json({
        success: false,
        message: "Error creating progress record",
        error: error.message,
      });
    }
  }
);

// PUT update progress record (teachers and admin only)
router.put(
  "/:id",
  authenticate,
  authorizeRoles("teacher", "admin"),
  async (req, res) => {
    try {
      console.log(`✏️ Updating progress record with ID: ${req.params.id}`);
      const progress = await Progress.findById(req.params.id);

      if (!progress) {
        return res.status(404).json({
          success: false,
          message: "Progress record not found",
        });
      }

      // Check authorization (teachers can only update their own records)
      if (
        req.user.role === "teacher" &&
        progress.teacher.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this progress record",
        });
      }

      const {
        subject,
        assignment,
        description,
        grade,
        score,
        maxScore,
        comments,
        assignmentType,
        submissionDate,
        isPublished,
        tags,
      } = req.body;

      // Update fields
      if (subject !== undefined) progress.subject = subject;
      if (assignment !== undefined) progress.assignment = assignment;
      if (description !== undefined) progress.description = description;
      if (grade !== undefined) progress.grade = grade;
      if (score !== undefined) progress.score = score;
      if (maxScore !== undefined) progress.maxScore = maxScore;
      if (comments !== undefined) progress.comments = comments;
      if (assignmentType !== undefined)
        progress.assignmentType = assignmentType;
      if (submissionDate !== undefined)
        progress.submissionDate = submissionDate;
      if (isPublished !== undefined) progress.isPublished = isPublished;
      if (tags !== undefined) progress.tags = tags;

      await progress.save();
      await progress.populate(
        "student",
        "firstName lastName email studentId gradeLevel"
      );
      await progress.populate("teacher", "firstName lastName email subject");

      console.log("✅ Progress record updated successfully");
      res.json({
        success: true,
        message: "Progress record updated successfully",
        progress,
      });
    } catch (error) {
      console.error("❌ Error updating progress record:", error);
      res.status(500).json({
        success: false,
        message: "Error updating progress record",
        error: error.message,
      });
    }
  }
);

// DELETE progress record (teachers and admin only)
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("teacher", "admin"),
  async (req, res) => {
    try {
      console.log(`🗑️ Deleting progress record with ID: ${req.params.id}`);
      const progress = await Progress.findById(req.params.id);

      if (!progress) {
        return res.status(404).json({
          success: false,
          message: "Progress record not found",
        });
      }

      // Check authorization (teachers can only delete their own records)
      if (
        req.user.role === "teacher" &&
        progress.teacher.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this progress record",
        });
      }

      await Progress.findByIdAndDelete(req.params.id);

      console.log("✅ Progress record deleted successfully");
      res.json({
        success: true,
        message: "Progress record deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting progress record:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting progress record",
        error: error.message,
      });
    }
  }
);

// GET student's overall progress summary
router.get("/student/:studentId/summary", authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`📈 Fetching progress summary for student: ${studentId}`);

    // Check authorization
    const canView =
      req.user.role === "admin" ||
      req.user.role === "teacher" ||
      req.user.id === studentId;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this student's progress",
      });
    }

    const progressRecords = await Progress.find({
      student: studentId,
      isPublished: true,
    }).populate("teacher", "firstName lastName subject");

    // Calculate summary statistics
    const totalRecords = progressRecords.length;
    const averageScore =
      totalRecords > 0
        ? progressRecords.reduce((sum, record) => sum + record.percentage, 0) /
          totalRecords
        : 0;

    const subjectSummary = {};
    const assignmentTypeSummary = {};

    progressRecords.forEach((record) => {
      // Subject summary
      if (!subjectSummary[record.subject]) {
        subjectSummary[record.subject] = {
          count: 0,
          totalScore: 0,
          averageScore: 0,
        };
      }
      subjectSummary[record.subject].count++;
      subjectSummary[record.subject].totalScore += record.percentage;
      subjectSummary[record.subject].averageScore =
        subjectSummary[record.subject].totalScore /
        subjectSummary[record.subject].count;

      // Assignment type summary
      if (!assignmentTypeSummary[record.assignmentType]) {
        assignmentTypeSummary[record.assignmentType] = {
          count: 0,
          totalScore: 0,
          averageScore: 0,
        };
      }
      assignmentTypeSummary[record.assignmentType].count++;
      assignmentTypeSummary[record.assignmentType].totalScore +=
        record.percentage;
      assignmentTypeSummary[record.assignmentType].averageScore =
        assignmentTypeSummary[record.assignmentType].totalScore /
        assignmentTypeSummary[record.assignmentType].count;
    });

    console.log("✅ Progress summary calculated successfully");
    res.json({
      success: true,
      summary: {
        totalRecords,
        averageScore: Math.round(averageScore * 100) / 100,
        subjectSummary,
        assignmentTypeSummary,
        recentRecords: progressRecords.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching progress summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress summary",
      error: error.message,
    });
  }
});

module.exports = router;
