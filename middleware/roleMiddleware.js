// middleware/roleMiddleware.js
console.log('🔧 Loading roleMiddleware.js...');

exports.recruiterOnly = (req, res, next) => {
  if (req.user?.role !== 'recruiter') {
    return res.status(403).json({ message: 'Access denied. Recruiters only.' });
  }
  next();
};

exports.clientOnly = (req, res, next) => {
  if (req.user?.role !== 'client') {
    return res.status(403).json({ message: 'Access denied. Clients only.' });
  }
  next();
};

// Generic role middleware that accepts an array of allowed roles
exports.roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    next();
  };
};

console.log('✅ roleMiddleware.js loaded successfully');
