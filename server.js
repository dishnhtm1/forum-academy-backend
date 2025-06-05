// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');
// const errorHandler = require('./middleware/errorMiddleware');

// dotenv.config();
// connectDB();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // // Routes
// // app.use('/api/contact', require('./routes/contactRoutes'));
// // app.use('/api/application', require('./routes/applicationRoutes'));
// // app.use('/api/auth', require('./routes/authRoutes'));

// // CHANGE these lines (around line 13-15):
// app.use('/api/contact', require('./routes/contactRoutes'));
// app.use('/api/applications', require('./routes/applicationRoutes')); // CHANGE from '/api/application' to '/api/applications'
// app.use('/api/auth', require('./routes/authRoutes'));

// // Health check route
// app.get('/api/health', (req, res) => {
//     res.json({ message: 'Server is running', status: 'OK' });
// });

// // Root route
// app.get('/', (req, res) => {
//     res.send('✅ Backend is running.');
// });

// app.use(errorHandler);

// // Port
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');
// const errorHandler = require('./middleware/errorMiddleware');

// dotenv.config();
// connectDB();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Routes (remove duplicates)
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/contact', require('./routes/contactRoutes'));
// app.use('/api/applications', require('./routes/applicationRoutes'));
// app.use('/api/application', require('./routes/applicationRoutes')); // Backward compatibility

// // Health check route
// app.get('/api/health', (req, res) => {
//     res.json({ message: 'Server is running', status: 'OK' });
// });

// // Root route
// app.get('/', (req, res) => {
//     res.send('✅ Backend is running.');
// });

// app.use(errorHandler);

// // Port
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');
// const errorHandler = require('./middleware/errorMiddleware');

// console.log('🚀 Starting server...');

// dotenv.config();
// connectDB();

// const app = express();

// // CORS configuration
// app.use(cors({
//     origin: '*',
//     credentials: true
// }));

// app.use(express.json());

// // Request logging middleware
// app.use((req, res, next) => {
//     console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
//     next();
// });

// // Test route
// app.get('/api/test-server', (req, res) => {
//     console.log('🧪 Test server route hit');
//     res.json({
//         message: 'Server is working!',
//         timestamp: new Date().toISOString(),
//         env: process.env.NODE_ENV || 'development'
//     });
// });

// // Routes with enhanced error handling
// console.log('🔧 Loading routes...');

// try {
//     const authRoutes = require('./routes/authRoutes');
//     app.use('/api/auth', authRoutes);
//     console.log('✅ Auth routes loaded and mounted');
// } catch (error) {
//     console.error('❌ Failed to load auth routes:', error.message);
// }

// // ADD THIS BACK - Application routes were missing!
// try {
//     const applicationRoutes = require('./routes/applicationRoutes');
//     app.use('/api/applications', applicationRoutes);
//     console.log('✅ Application routes loaded and mounted');
// } catch (error) {
//     console.error('❌ Failed to load application routes:', error.message);
// }

// try {
//     const contactRoutes = require('./routes/contactRoutes');
//     app.use('/api/contact', contactRoutes);
//     console.log('✅ Contact routes loaded and mounted');
// } catch (error) {
//     console.error('❌ Failed to load contact routes:', error.message);
// }

// // Health check route
// app.get('/api/health', (req, res) => {
//     console.log('🏥 Health check hit');
//     res.json({ 
//         message: 'Server is running', 
//         status: 'OK',
//         timestamp: new Date().toISOString()
//     });
// });

// // Root route
// app.get('/', (req, res) => {
//     console.log('🏠 Root route hit');
//     res.send('✅ Backend is running.');
// });

// // Error handler (BEFORE 404 handler)
// app.use(errorHandler);

// // 404 handler (MUST be last)
// app.use((req, res) => {
//     console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
//     res.status(404).json({
//         message: 'Route not found',
//         method: req.method,
//         path: req.originalUrl,
//         timestamp: new Date().toISOString()
//     });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//     console.log(`📍 Server URL: http://localhost:5000`);
//     console.log('🔧 Routes loaded, server ready!');
// });

// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');
// const errorHandler = require('./middleware/errorMiddleware');

// console.log('🚀 Starting server...');

// dotenv.config();
// connectDB();

// const app = express();

// // CORS configuration
// app.use(cors({
//     origin: '*',
//     credentials: true
// }));

// app.use(express.json());

// <<<<<<< HEAD
// // Request logging middleware
// app.use((req, res, next) => {
//     console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
//     next();
// });

// // Test route
// app.get('/api/test-server', (req, res) => {
//     console.log('🧪 Test server route hit');
//     res.json({
//         message: 'Server is working!',
//         timestamp: new Date().toISOString(),
//         env: process.env.NODE_ENV || 'development'
//     });
// });

// // Routes with enhanced error handling
// console.log('🔧 Loading routes...');

// try {
//     const authRoutes = require('./routes/authRoutes');
//     app.use('/api/auth', authRoutes);
//     console.log('✅ Auth routes loaded and mounted');
// } catch (error) {
//     console.error('❌ Failed to load auth routes:', error.message);
// }

// // ADD THESE MISSING ROUTES TO AZURE:
// try {
//     const applicationRoutes = require('./routes/applicationRoutes');
//     app.use('/api/applications', applicationRoutes);
//     console.log('✅ Application routes loaded and mounted');
// } catch (error) {
//     console.error('❌ Failed to load application routes:', error.message);
// }

// try {
//     const contactRoutes = require('./routes/contactRoutes');
//     app.use('/api/contact', contactRoutes);
//     console.log('✅ Contact routes loaded and mounted');
// } catch (error) {
//     console.error('❌ Failed to load contact routes:', error.message);
// }

// =======
// // Routes (remove duplicates)
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/contact', require('./routes/contactRoutes'));
// app.use('/api/applications', require('./routes/applicationRoutes'));
// app.use('/api/application', require('./routes/applicationRoutes')); // Backward compatibility
// app.use('/api/admin', require('./routes/adminRoutes'));
// >>>>>>> 3a528a6b30254de37c8952fcce18f2b4bbfa226a
// // Health check route
// app.get('/api/health', (req, res) => {
//     console.log('🏥 Health check hit');
//     res.json({ 
//         message: 'Server is running', 
//         status: 'OK',
//         timestamp: new Date().toISOString()
//     });
// });

// // Root route
// app.get('/', (req, res) => {
//     console.log('🏠 Root route hit');
//     res.send('✅ Backend is running.');
// });

// // Error handler
// app.use(errorHandler);

// // 404 handler (MUST be last)
// app.use((req, res) => {
//     console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
//     res.status(404).json({
//         message: 'Route not found',
//         method: req.method,
//         path: req.originalUrl,
//         timestamp: new Date().toISOString()
//     });
// });

// const PORT = process.env.PORT || 5000;
// <<<<<<< HEAD
// app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//     console.log(`📍 Server URL: ${process.env.NODE_ENV === 'production' ? 'https://forum-backend-api-a7hgg9g7hmgegrh3.eastasia-01.azurewebsites.net' : `http://localhost:${PORT}`}`);
//     console.log('🔧 Routes loaded, server ready!');
// });
// =======
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// >>>>>>> 3a528a6b30254de37c8952fcce18f2b4bbfa226a
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

console.log('🚀 Starting server...');

dotenv.config();
connectDB();

const app = express();

// CORS configuration
app.use(cors({
    origin: '*',
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

// ✅ Load and use routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/application', require('./routes/applicationRoutes')); // For compatibility
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
    console.log('🏥 Health check hit');
    res.json({ 
        message: 'Server is running', 
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    console.log('🏠 Root route hit');
    res.send('✅ Backend is running.');
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        message: 'Route not found',
        method: req.method,
        path: req.originalUrl,
        timestamp: new Date().toISOString()
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
