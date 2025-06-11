// // server/routes/adminRoutes.js
// const express = require('express');
// const router = express.Router();
// const Application = require('../models/Application'); // adjust path as needed
// const { protect } = require('../middleware/authMiddleware');
// const { authorizeRoles } = require('../middleware/roleMiddleware');

// // ✅ Admin dashboard: Fetch all submitted applications
// router.get('/applications', protect, authorizeRoles('admin'), async (req, res) => {
//   try {
//     const apps = await Application.find().sort({ submittedAt: -1 });
//     res.status(200).json(apps);
//   } catch (err) {
//     console.error('Error fetching applications:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;
// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { recruiterOnly, clientOnly } = require('../middleware/roleMiddleware');

// ✅ Admin dashboard: Fetch all submitted applications
router.get('/applications', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const apps = await Application.find().sort({ submittedAt: -1 });
    res.status(200).json(apps);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;