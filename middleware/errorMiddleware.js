// const errorHandler = (err, req, res, next) => {
//   // Log to console for dev
//   console.error('Error:', err.message);
  
//   // Mongoose validation error
//   if (err.name === 'ValidationError') {
//     const messages = Object.values(err.errors).map(val => val.message);
//     return res.status(400).json({
//       message: messages.join(', ')
//     });
//   }
  
//   // Mongoose duplicate key
//   if (err.code === 11000) {
//     return res.status(400).json({
//       message: 'A user with that email already exists'
//     });
//   }
  
//   // JWT errors
//   if (err.name === 'JsonWebTokenError') {
//     return res.status(401).json({
//       message: 'Invalid token'
//     });
//   }
  
//   if (err.name === 'TokenExpiredError') {
//     return res.status(401).json({
//       message: 'Token expired'
//     });
//   }
  
//   // Server error
//   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
//   res.status(statusCode);
//   res.json({
//     message: err.message,
//     stack: process.env.NODE_ENV === 'production' ? null : err.stack
//   });
// };

// module.exports = errorHandler;

const errorHandler = (err, req, res, next) => {
    console.error('Error middleware triggered:', err);
    
    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { message, statusCode: 404 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = { message, statusCode: 400 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
};

module.exports = errorHandler;