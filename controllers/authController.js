const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register Controller
exports.register = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    console.log('=== REGISTRATION START ===');
    console.log('Registration data:', { firstName, lastName, email, role });

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // ✅ CRITICAL: ALL NEW USERS REQUIRE ADMIN APPROVAL (NO AUTO-APPROVAL)
    const userRole = role || 'student';
    
    console.log('Creating user with role:', userRole);
    console.log('🚫 AUTO-APPROVAL: DISABLED - All users require manual approval');

    // Create user WITHOUT setting isApproved (defaults to false)
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: userRole
      // isApproved will default to false from User model
    });

    await user.save();
    
    console.log('✅ User created with ID:', user._id);
    console.log('📊 User approval status:', user.isApproved);
    console.log('=== REGISTRATION END ===');

    // ✅ NEVER RETURN TOKEN OR AUTO-LOGIN
    res.status(201).json({ 
      message: 'Registration successful. Your account is pending admin approval.',
      needsApproval: true,
      userEmail: user.email
    });

  } catch (err) {
    console.error('❌ Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login Controller
exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    console.log('=== LOGIN START ===');
    console.log('Login attempt for:', email, 'with role:', role);
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const query = { email };
    if (role) {
      query.role = role;
    }
    
    const user = await User.findOne(query);
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ User found:', user.email);
    console.log('📊 User approval status:', user.isApproved);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Password correct');

    // ✅ CRITICAL: BLOCK LOGIN IF NOT APPROVED
    if (!user.isApproved) {
      console.log('🚫 LOGIN BLOCKED - User not approved');
      console.log('=== LOGIN DENIED - REQUIRES APPROVAL ===');
      return res.status(403).json({ 
        message: 'Your account is pending admin approval. Please wait for approval before logging in.',
        needsApproval: true,
        userEmail: user.email
      });
    }

    console.log('✅ User approved - generating token');

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('✅ Token generated - LOGIN SUCCESS');
    console.log('=== LOGIN SUCCESSFUL ===');

    res.status(200).json({
      message: 'Login successful',
      token,
      role: user.role,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};