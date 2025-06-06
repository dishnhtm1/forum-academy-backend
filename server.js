const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

console.log('🚀 Starting server...');

dotenv.config();
connectDB();

const app = express();

// CORS configuration for Azure
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://your-frontend-domain.azurewebsites.net', // Add your actual frontend domain
        '*' // Temporarily allow all origins for testing
    ],
    credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Test route
app.get('/api/test-server', (req, res) => {
    console.log('🧪 Test server route hit');
    res.json({
        message: 'Server is working!',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

// Routes with enhanced error handling
console.log('🔧 Loading routes...');

// Auth routes
try {
    const authRoutes = require('./routes/authRoutes');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded and mounted');
} catch (error) {
    console.error('❌ Failed to load auth routes:', error.message);
}

// Application routes
try {
    const applicationRoutes = require('./routes/applicationRoutes');
    app.use('/api/applications', applicationRoutes);
    app.use('/api/application', applicationRoutes); // Backward compatibility
    console.log('✅ Application routes loaded and mounted');
} catch (error) {
    console.error('❌ Failed to load application routes:', error.message);
}

// Contact routes
try {
    const contactRoutes = require('./routes/contactRoutes');
    app.use('/api/contact', contactRoutes);
    console.log('✅ Contact routes loaded and mounted');
} catch (error) {
    console.error('❌ Failed to load contact routes:', error.message);
}

// User management routes
try {
    const userRoutes = require('./routes/userRoutes');
    app.use('/api/users', userRoutes);
    console.log('✅ User routes loaded and mounted');
} catch (error) {
    console.error('❌ Failed to load user routes:', error.message);
}

// Admin routes
try {
    const adminRoutes = require('./routes/adminRoutes');
    app.use('/api/admin', adminRoutes);
    console.log('✅ Admin routes loaded and mounted');
} catch (error) {
    console.error('❌ Failed to load admin routes:', error.message);
}

// Health check route
app.get('/api/health', (req, res) => {
    console.log('🏥 Health check hit');
    res.json({ 
        message: 'Server is running', 
        status: 'OK',
        timestamp: new Date().toISOString(),
        routes: ['auth', 'applications', 'contact', 'admin']
    });
});

// Root route
app.get('/', (req, res) => {
    console.log('🏠 Root route hit');
    res.send('✅ Backend is running with all routes.');
});

// Debug routes endpoint
app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            const basePath = middleware.regexp.source.replace('\\', '').replace('(?=\\/|$)', '');
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    routes.push({
                        path: basePath + handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json({ routes });
});

// Error handler middleware
app.use(errorHandler);

// 404 handler (MUST be last)
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        message: 'Route not found',
        method: req.method,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        availableRoutes: [
            '/api/health',
            '/api/auth/*',
            '/api/applications/*',
            '/api/contact/*',
            '/api/admin/*'
        ]
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Server URL: ${process.env.NODE_ENV === 'production' 
        ? 'https://forum-backend-api-a7hgg9g7hmgegrh3.eastasia-01.azurewebsites.net' 
        : `http://localhost:${PORT}`}`);
    console.log('🔧 Routes loaded, server ready!');
});