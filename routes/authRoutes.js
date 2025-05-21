const express = require('express');
const { register, login } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);  // Optional: for creating test users
router.post('/login', login);        // Required: used by LoginModal

module.exports = router;
