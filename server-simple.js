const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Express app
const app = express();

const connectDB = require('./config/db');

// Connect to DB
connectDB();

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        message: 'Server is running',
        status: 'OK',
        timestamp: new Date().toISOString(),
        routes: ['auth', 'users', 'course-materials', 'applications', 'contact', 'admin', 'quizzes', 'courses', 'homework', 'homework-submissions']
    });
});

// Root route
app.get('/', (req, res) => {
    res.send('✅ Backend is running.');
});

// Load auth routes only (most essential for login)
console.log('🔧 Loading auth routes...');
try {
    const authRoutes = require('./routes/authRoutes');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded');
} catch (error) {
    console.error('❌ Failed to load auth routes:', error.message);
}

// Load user routes (needed for admin dashboard)
console.log('🔧 Loading user routes...');
try {
    const userRoutes = require('./routes/userRoutes');
    app.use('/api/users', userRoutes);
    console.log('✅ User routes loaded');
} catch (error) {
    console.error('❌ Failed to load user routes:', error.message);
}

// Load course material routes (needed for dashboard)
console.log('🔧 Loading course material routes...');
try {
    const courseMaterialRoutes = require('./routes/courseMaterialRoutes');
    app.use('/api/course-materials', courseMaterialRoutes);
    console.log('✅ Course material routes loaded');
} catch (error) {
    console.error('❌ Failed to load course material routes:', error.message);
}

// Load application routes (needed for admin)
console.log('🔧 Loading application routes...');
try {
    const applicationRoutes = require('./routes/applicationRoutes');
    app.use('/api/applications', applicationRoutes);
    console.log('✅ Application routes loaded');
} catch (error) {
    console.error('❌ Failed to load application routes:', error.message);
}

// Load contact routes
console.log('🔧 Loading contact routes...');
try {
    const contactRoutes = require('./routes/contactRoutes');
    app.use('/api/contact', contactRoutes);
    console.log('✅ Contact routes loaded');
} catch (error) {
    console.error('❌ Failed to load contact routes:', error.message);
}

// Load admin routes
console.log('🔧 Loading admin routes...');
try {
    const adminRoutes = require('./routes/adminRoutes');
    app.use('/api/admin', adminRoutes);
    console.log('✅ Admin routes loaded');
} catch (error) {
    console.error('❌ Failed to load admin routes:', error.message);
}

// Load quiz routes
console.log('🔧 Loading quiz routes...');
try {
    const quizRoutes = require('./routes/quizRoutes');
    app.use('/api/quizzes', quizRoutes);
    console.log('✅ Quiz routes loaded');
} catch (error) {
    console.error('❌ Failed to load quiz routes:', error.message);
}

// Load course routes (needed for quiz management)
console.log('🔧 Loading course routes...');
try {
    const courseRoutes = require('./routes/courseRoutes');
    app.use('/api/courses', courseRoutes);
    console.log('✅ Course routes loaded');
} catch (error) {
    console.error('❌ Failed to load course routes:', error.message);
}

// Load homework routes (needed for homework management)
console.log('🔧 Loading homework routes...');
try {
    const homeworkRoutes = require('./routes/homeworkRoutes');
    app.use('/api/homework', homeworkRoutes);
    console.log('✅ Homework routes loaded');
} catch (error) {
    console.error('❌ Failed to load homework routes:', error.message);
}

// Load homework submission routes (needed for homework submissions)
console.log('🔧 Loading homework submission routes...');
try {
    const homeworkSubmissionRoutes = require('./routes/homeworkSubmissionRoutes');
    app.use('/api/homework-submissions', homeworkSubmissionRoutes);
    console.log('✅ Homework submission routes loaded');
} catch (error) {
    console.error('❌ Failed to load homework submission routes:', error.message);
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found',
        method: req.method,
        path: req.originalUrl
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Server URL: http://localhost:${PORT}`);
});

module.exports = app;