const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Application = require("../models/Application");

// GET enrollment statistics for admin dashboard
router.get("/stats", authenticate, authorizeRoles("admin"), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: { $in: ["teacher", "faculty"] } });
    const totalPendingApplications = await Application.countDocuments({ isApproved: false });

    res.json({
      success: true,
      totalStudents,
      totalTeachers,
      totalPendingApplications,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Enrollment stats error:", error);
    res.status(500).json({ message: "Failed to fetch enrollment stats" });
  }
});

module.exports = router;
