const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Initialize Express app FIRST!
const app = express();

// Connect to DB
connectDB();

// CORS configuration for Azure
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://wonderful-meadow-0e35b381e.6.azurestaticapps.net',
        process.env.CLIENT_URL
    ].filter(Boolean),
    credentials: true
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
        routes: ['auth', 'applications', 'contact', 'admin', 'users']
    });
});

// Root route
app.get('/', (req, res) => {
    res.send('✅ Backend is running with all routes.');
});

// ROUTES - LOAD ONLY ONCE!
console.log('🔧 Loading routes...');

try {
    const authRoutes = require('./routes/authRoutes');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded and mounted');
} catch (error) {
    console.error('❌ Failed to load auth routes:', error.message);
}

try {
    const applicationRoutes = require('./routes/applicationRoutes');
    app.use('/api/applications', applicationRoutes);
    console.log('✅ Application routes loaded and mounted');
} catch (error) {
    console.error('❌ Failed to load application routes:', error.message);
}

try {
    const contactRoutes = require('./routes/contactRoutes');
    app.use('/api/contact', contactRoutes);
    console.log('✅ Contact routes loaded and mounted');
} catch (error) {
    console.error('❌ Failed to load contact routes:', error.message);
}

try {
    const userRoutes = require('./routes/userRoutes');
    app.use('/api/users', userRoutes);
    console.log('✅ User routes loaded and mounted');
} catch (error) {
    console.error('❌ Failed to load user routes:', error.message);
}

try {
    const adminRoutes = require('./routes/adminRoutes');
    app.use('/api/admin', adminRoutes);
    console.log('✅ Admin routes loaded and mounted');
} catch (error) {
    console.error('❌ Failed to load admin routes:', error.message);
}

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
            '/api/admin/*',
            '/api/users/*'
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

module.exports = app;


// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');
// require('dotenv').config();

// console.log('🔧 Starting Forum Academy Server...');
// console.log('🌐 Environment:', process.env.NODE_ENV);

// // Initialize Express app
// const app = express();

// // Enhanced CORS configuration for Azure
// app.use(cors({
//     origin: [
//         'http://localhost:3000',
//         'https://wonderful-meadow-0e35b381e.6.azurestaticapps.net',
//         process.env.CLIENT_URL
//     ].filter(Boolean), // Remove any undefined values
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Request logging middleware
// app.use((req, res, next) => {
//     console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
//     next();
// });

// // Azure Cosmos DB MongoDB Connection
// const mongoUri = process.env.MONGODB_URI;
// console.log('🔗 Connecting to MongoDB URI:', mongoUri ? mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'NOT FOUND');

// mongoose.connect(mongoUri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     serverSelectionTimeoutMS: 5000,
//     socketTimeoutMS: 45000,
//     maxPoolSize: 10,
//     heartbeatFrequencyMS: 10000,
// })
// .then(() => {
//     console.log('✅ Connected to Azure Cosmos DB (MongoDB API)');
//     console.log('📊 Database Name:', mongoose.connection.db.databaseName);
// })
// .catch(err => {
//     console.error('❌ MongoDB connection error:', err);
//     console.error('🔍 Check your MONGODB_URI in .env file');
//     process.exit(1);
// });

// // MongoDB connection event handlers
// mongoose.connection.on('connected', () => {
//     console.log('🔗 Mongoose connected to Azure Cosmos DB');
// });

// mongoose.connection.on('error', (err) => {
//     console.error('❌ Mongoose connection error:', err);
// });

// mongoose.connection.on('disconnected', () => {
//     console.log('🔌 Mongoose disconnected from Azure Cosmos DB');
// });

// // Handle process termination
// process.on('SIGINT', async () => {
//     await mongoose.connection.close();
//     console.log('🔌 MongoDB connection closed through app termination');
//     process.exit(0);
// });

// // Health check endpoint (place before auth routes)
// app.get('/api/health', (req, res) => {
//     res.status(200).json({ 
//         success: true, 
//         message: 'Server is running',
//         timestamp: new Date().toISOString(),
//         database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
//         environment: process.env.NODE_ENV
//     });
// });

// // Test database endpoint
// app.get('/api/test-db', async (req, res) => {
//     try {
//         const dbState = mongoose.connection.readyState;
//         const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        
//         res.json({
//             database: {
//                 state: states[dbState],
//                 name: mongoose.connection.db?.databaseName || 'unknown',
//                 host: mongoose.connection.host || 'unknown'
//             },
//             server: {
//                 status: 'running',
//                 timestamp: new Date().toISOString()
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             error: 'Database test failed',
//             details: error.message
//         });
//     }
// });

// // Root route
// app.get('/', (req, res) => {
//     res.json({
//         message: '✅ Forum Academy Backend is running',
//         timestamp: new Date().toISOString(),
//         environment: process.env.NODE_ENV,
//         database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
//     });
// });

// // Import and mount routes (ONLY ONCE!)
// console.log('🔧 Loading all routes...');

// // Auth routes
// try {
//     const authRoutes = require('./routes/authRoutes');
//     app.use('/api/auth', authRoutes);
//     console.log('✅ Auth routes loaded and mounted at /api/auth');
// } catch (error) {
//     console.error('❌ Error loading auth routes:', error.message);
//     // Don't exit, continue with other routes
// }

// // User routes
// try {
//     const userRoutes = require('./routes/userRoutes');
//     app.use('/api/users', userRoutes);
//     console.log('✅ User routes loaded and mounted at /api/users');
// } catch (error) {
//     console.error('❌ Error loading user routes:', error.message);
// }

// // Application routes
// try {
//     const applicationRoutes = require('./routes/applicationRoutes');
//     app.use('/api/applications', applicationRoutes);
//     // app.use('/api/application', applicationRoutes); // Backward compatibility
//     console.log('✅ Application routes loaded and mounted at /api/applications');
// } catch (error) {
//     console.error('❌ Error loading application routes:', error.message);
// }

// // Contact routes
// try {
//     const contactRoutes = require('./routes/contactRoutes');
//     app.use('/api/contact', contactRoutes);
//     console.log('✅ Contact routes loaded and mounted at /api/contact');
// } catch (error) {
//     console.error('❌ Error loading contact routes:', error.message);
// }

// // Admin routes
// try {
//     const adminRoutes = require('./routes/adminRoutes');
//     app.use('/api/admin', adminRoutes);
//     console.log('✅ Admin routes loaded and mounted at /api/admin');
// } catch (error) {
//     console.error('❌ Error loading admin routes:', error.message);
// }

// console.log('✅ All available routes loaded');

// // Debug routes endpoint REMOVED

// // Handle 404 errors
// app.use('*', (req, res) => {
//     console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
//     res.status(404).json({
//         success: false,
//         message: 'Route not found',
//         method: req.method,
//         path: req.originalUrl,
//         timestamp: new Date().toISOString(),
//         availableRoutes: [
//             '/api/health',
//             '/api/test-db',
//             '/api/auth/*',
//             '/api/users/*',
//             '/api/applications/*',
//             '/api/contact/*',
//             '/api/admin/*'
//         ]
//     });
// });

// // Global error handling middleware
// app.use((err, req, res, next) => {
//     console.error('🚨 Server Error:', err);
//     res.status(500).json({
//         success: false,
//         message: 'Internal server error',
//         error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
//         timestamp: new Date().toISOString()
//     });
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//     console.log(`📍 Server URL: ${process.env.NODE_ENV === 'production' 
//         ? 'https://forum-backend-api-a7hgg9g7hmgegrh3.eastasia-01.azurewebsites.net' 
//         : `http://localhost:${PORT}`}`);
//     console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
//     console.log('✅ Forum Academy Server ready!');
//     console.log('🔗 Available endpoints:');
//     console.log('   - Health: /api/health');
//     console.log('   - Database: /api/test-db');
// });

// module.exports = app;