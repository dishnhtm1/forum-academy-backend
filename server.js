const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");


// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, ".env") });

// Initialize Express app
const app = express();

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorMiddleware");

// Connect to DB
connectDB();

// Enhanced CORS configuration for both development and production
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173", // Vite default port
        "https://wonderful-meadow-0e35b381e.6.azurestaticapps.net",
        "https://icy-moss-00f282010.1.azurestaticapps.net",
        process.env.CLIENT_URL,
      ].filter(Boolean);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  })
);

// Handle preflight requests explicitly
app.options("*", cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    message: "Server is running",
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    routes: [
      "auth",
      "users",
      "course-materials",
      "applications",
      "contact",
      "admin",
      "quizzes",
      "courses",
      "homework",
      "homework-submissions",
      "listening-exercises",
      "announcements",
      "progress",
      "analytics",
      "notifications",
      "zoom",
    ],
  });
});

// Test database endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbState = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];

    res.json({
      database: {
        state: states[dbState],
        name: mongoose.connection.db?.databaseName || "unknown",
        host: mongoose.connection.host || "unknown",
      },
      server: {
        status: "running",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Database test failed",
      details: error.message,
    });
  }
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "✅ Forum Academy Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

// ROUTES LOADING
console.log("🔧 Loading all routes...");

// Load auth routes (essential for login)
console.log("🔧 Loading auth routes...");
try {
  const authRoutes = require("./routes/authRoutes");
  app.use("/api/auth", authRoutes);
  console.log("✅ Auth routes loaded");
} catch (error) {
  console.error("❌ Failed to load auth routes:", error.message);
}

// Load user routes (needed for admin dashboard)
console.log("🔧 Loading user routes...");
try {
  const userRoutes = require("./routes/userRoutes");
  app.use("/api/users", userRoutes);
  console.log("✅ User routes loaded");
} catch (error) {
  console.error("❌ Failed to load user routes:", error.message);
}

// Load course material routes (needed for dashboard)
console.log("🔧 Loading course material routes...");
try {
  const courseMaterialRoutes = require("./routes/courseMaterialRoutes");
  app.use("/api/course-materials", courseMaterialRoutes);
  console.log("✅ Course material routes loaded");
} catch (error) {
  console.error("❌ Failed to load course material routes:", error.message);
}

// Load application routes (needed for admin)
console.log("🔧 Loading application routes...");
try {
  const applicationRoutes = require("./routes/applicationRoutes");
  app.use("/api/applications", applicationRoutes);
  console.log("✅ Application routes loaded");
} catch (error) {
  console.error("❌ Failed to load application routes:", error.message);
}

// Load contact routes
console.log("🔧 Loading contact routes...");
try {
  const contactRoutes = require("./routes/contactRoutes");
  app.use("/api/contact", contactRoutes);
  console.log("✅ Contact routes loaded");
} catch (error) {
  console.error("❌ Failed to load contact routes:", error.message);
}

// Load admin routes
console.log("🔧 Loading admin routes...");
try {
  const adminRoutes = require("./routes/adminRoutes");
  app.use("/api/admin", adminRoutes);
  console.log("✅ Admin routes loaded");
} catch (error) {
  console.error("❌ Failed to load admin routes:", error.message);
}

// Load quiz routes
console.log("🔧 Loading quiz routes...");
try {
  const quizRoutes = require("./routes/quizRoutes");
  app.use("/api/quizzes", quizRoutes);
  console.log("✅ Quiz routes loaded");
} catch (error) {
  console.error("❌ Failed to load quiz routes:", error.message);
}

// Load course routes (needed for quiz management)
console.log("🔧 Loading course routes...");
try {
  const courseRoutes = require("./routes/courseRoutes");
  app.use("/api/courses", courseRoutes);
  console.log("✅ Course routes loaded");
} catch (error) {
  console.error("❌ Failed to load course routes:", error.message);
}

// Load homework routes (needed for homework management)
console.log("🔧 Loading homework routes...");
try {
  const homeworkRoutes = require("./routes/homeworkRoutes");
  app.use("/api/homework", homeworkRoutes);
  console.log("✅ Homework routes loaded");
} catch (error) {
  console.error("❌ Failed to load homework routes:", error.message);
}

// Load homework submission routes (needed for homework submissions)
console.log("🔧 Loading homework submission routes...");
try {
  const homeworkSubmissionRoutes = require("./routes/homeworkSubmissionRoutes");
  app.use("/api/homework-submissions", homeworkSubmissionRoutes);
  console.log("✅ Homework submission routes loaded");
} catch (error) {
  console.error("❌ Failed to load homework submission routes:", error.message);
}

// Load listening exercise routes (for listening comprehension exercises)
console.log("🔧 Loading listening exercise routes...");
try {
  const listeningExerciseRoutes = require("./routes/listeningExerciseRoutes");
  app.use("/api/listening-exercises", listeningExerciseRoutes);
  console.log("✅ Listening exercise routes loaded");
} catch (error) {
  console.error("❌ Failed to load listening exercise routes:", error.message);
}

// Load progress routes (for student progress tracking)
console.log("🔧 Loading progress routes...");
try {
  const progressRoutes = require("./routes/progressRoutes");
  app.use("/api/progress", progressRoutes);
  console.log("✅ Progress routes loaded");
} catch (error) {
  console.error("❌ Failed to load progress routes:", error.message);
}

// Load announcement routes (for announcements and notifications)
console.log("🔧 Loading announcement routes...");
try {
  const announcementRoutes = require("./routes/announcementRoutes");
  app.use("/api/announcements", announcementRoutes);
  console.log("✅ Announcement routes loaded");
} catch (error) {
  console.error("❌ Failed to load announcement routes:", error.message);
}

// Load analytics routes (for admin analytics)
console.log("🔧 Loading analytics routes...");
try {
  const analyticsRoutes = require("./routes/analyticsRoutes");
  app.use("/api/analytics", analyticsRoutes);
  console.log("✅ Analytics routes loaded");
} catch (error) {
  console.error("❌ Failed to load analytics routes:", error.message);
}

// Load notification routes (for real-time notifications)
console.log("🔧 Loading notification routes...");
try {
  const notificationRoutes = require("./routes/notificationRoutes");
  app.use("/api/notifications", notificationRoutes);
  console.log("✅ Notification routes loaded");
} catch (error) {
  console.error("❌ Failed to load notification routes:", error.message);
}

// Load email routes (for sending emails from admin dashboard)
console.log("🔧 Loading email routes...");
try {
  const emailRoutes = require("./routes/emailRoutes");
  app.use("/api", emailRoutes); // Mount directly on /api so it becomes /api/send-email
  console.log("✅ Email routes loaded");
} catch (error) {
  console.error("❌ Failed to load email routes:", error.message);
}

// Load Zoom routes (for live class management)
console.log("🔧 Loading Zoom routes...");
try {
  const zoomRoutes = require("./routes/zoomRoutes");
  app.use("/api/zoom", zoomRoutes);
  console.log("✅ Zoom routes loaded");
} catch (error) {
  console.error("❌ Failed to load Zoom routes:", error.message);
}

console.log("🔧 All routes loaded successfully");

// Error handler middleware (must be before 404 handler)
app.use(errorHandler);

// 404 handler (MUST be last)
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: "Route not found",
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "/api/health",
      "/api/test-db",
      "/api/auth/*",
      "/api/users/*",
      "/api/applications/*",
      "/api/contact/*",
      "/api/admin/*",
      "/api/quizzes/*",
      "/api/courses/*",
      "/api/homework/*",
      "/api/homework-submissions/*",
      "/api/course-materials/*",
      "/api/progress/*",
      "/api/announcements/*",
      "/api/analytics/*",
      "/api/notifications/*",
      "/api/zoom/*",
    ],
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("🚨 Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📍 Server URL: ${
      process.env.NODE_ENV === "production"
        ? "https://forum-backend-cnfrb6eubggucqda.canadacentral-01.azurewebsites.net"
        : `http://localhost:${PORT}`
    }`
  );
  console.log(
    `🌐 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`
  );
  console.log("✅ Forum Academy Server ready!");
  console.log("🔗 Available endpoints:");
  console.log("   - Health: /api/health");
  console.log("   - Database Test: /api/test-db");
  console.log("   - Authentication: /api/auth/*");
  console.log(
    "   - Homework System: /api/homework/* & /api/homework-submissions/*"
  );
  console.log("   - Progress Tracking: /api/progress/*");
  console.log("   - Notifications: /api/notifications/*");
  console.log("   - Zoom Meetings: /api/zoom/*");
});

module.exports = app;
