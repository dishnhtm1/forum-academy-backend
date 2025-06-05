const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register Controller
exports.register = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // ✅ AUTO-APPROVE STUDENTS AND TEACHERS - Only admins need manual approval
    const userRole = role || 'student';
    const isApproved = (userRole === 'student' || userRole === 'teacher');
    
    console.log('Creating user with role:', userRole, 'and approval status:', isApproved);

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: userRole,
      isApproved // This will be true for students and teachers
    });

    await user.save();

    // For students and teachers (auto-approved), generate and return a token
    if (isApproved) {
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.status(201).json({ 
        message: 'Registration successful',
        token,
        role: user.role,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isApproved: user.isApproved
        }
      });
    }

    // For admins (require manual approval)
    res.status(201).json({ 
      message: 'Registration successful. Your account is pending approval.' 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login Controller
exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    console.log('Login attempt for:', email, 'with role:', role);
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find the user by email and role (if specified)
    const query = { email };
    if (role) {
      query.role = role;
    }
    
    const user = await User.findOne(query);
    
    // Check if user exists
    if (!user) {
      console.log('User not found:', email, 'with role:', role);
      return res.status(401).json({ message: 'Invalid credentials or role mismatch' });
    }

    console.log('User found, role:', user.role, 'approval status:', user.isApproved);

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is approved
    if (!user.isApproved) {
      console.log('User not approved:', email);
      return res.status(403).json({ message: 'Account not approved yet' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Send successful response with token and user info
    res.status(200).json({
      message: 'Login successful',
      token,
      role: user.role, // This is what the frontend expects
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};