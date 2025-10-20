// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// exports.authenticate = async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(401).json({ message: "Access denied" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Find user in database to check approval status
//     const user = await User.findById(decoded.id);
    
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
    
//     // Check if user is approved
//     if (!user.isApproved) {
//       console.log('User auth check - rejected due to approval status:', user.isApproved);
//       return res.status(403).json({ message: "Account not approved yet" });
//     }
    
//     // Include full user info in the request
//     req.user = {
//       id: user._id,
//       email: user.email,
//       role: user.role,
//       isApproved: user.isApproved
//     };
    
//     next();
//   } catch (err) {
//     console.error('Auth error:', err.message);
//     res.status(401).json({ message: "Invalid token" });
//   }
// };

// exports.authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: "Forbidden" });
//     }
//     next();
//   };
// };

// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// // Authentication middleware
// const authenticate = async (req, res, next) => {
//     try {
//         const token = req.header('Authorization')?.replace('Bearer ', '');
        
//         if (!token) {
//             return res.status(401).json({ message: 'No token, authorization denied' });
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = await User.findById(decoded.id).select('-password');
        
//         if (!req.user) {
//             return res.status(401).json({ message: 'Token is not valid' });
//         }
        
//         next();
//     } catch (error) {
//         console.error('Auth middleware error:', error);
//         res.status(401).json({ message: 'Token is not valid' });
//     }
// };

// // Authorization middleware
// const authorizeRoles = (...roles) => {
//     return (req, res, next) => {
//         if (!req.user) {
//             return res.status(401).json({ message: 'User not authenticated' });
//         }
        
//         if (!roles.includes(req.user.role)) {
//             return res.status(403).json({ 
//                 message: `Access denied. Required role: ${roles.join(' or ')}, but user has role: ${req.user.role}` 
//             });
//         }
        
//         next();
//     };
// };

// module.exports = { authenticate, authorizeRoles };

const jwt = require('jsonwebtoken');
const User = require('../models/User');

console.log('🔧 Loading authMiddleware.js...');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        console.log('🔍 Auth header received:', authHeader ? 'Present' : 'Missing');
        
        const token = authHeader?.replace('Bearer ', '');
        console.log('🔍 Token extracted:', token ? `${token.substring(0, 20)}...` : 'No token');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        // Check if user is approved (bypass for admin and superadmin roles)
        // Admins and superadmins don't need approval to access the system
        const adminRoles = ['admin', 'superadmin'];
        if (!adminRoles.includes(user.role) && !user.isApproved) {
            console.log(`🚫 User ${user.email} (${user.role}) blocked - not approved`);
            return res.status(403).json({ message: 'Account not approved yet' });
        }
        
        // Log successful authentication
        if (adminRoles.includes(user.role)) {
            console.log(`✅ Admin/Superadmin ${user.email} authenticated (approval bypassed)`);
        } else if (user.isApproved) {
            console.log(`✅ User ${user.email} (${user.role}) authenticated (approved)`);
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        
        console.log('🔍 Authorization Check:');
        console.log('  - User ID:', req.user._id);
        console.log('  - User Role:', req.user.role);
        console.log('  - Required Roles:', roles);
        console.log('  - Role Match:', roles.includes(req.user.role));
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Role ${req.user.role} is not authorized to access this resource. Required: ${roles.join(',')}` 
            });
        }
        next();
    };
};

console.log('✅ authMiddleware.js loaded successfully');

// Export both naming conventions for compatibility
module.exports = { 
    authenticate, 
    authorizeRoles,
    protect: authenticate,  // Alternative name
    authorize: authorizeRoles  // Alternative name
};