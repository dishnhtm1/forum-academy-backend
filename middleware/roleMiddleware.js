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

console.log('✅ roleMiddleware.js loaded successfully');
