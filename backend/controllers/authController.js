import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, Scan } from '../config/models.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecrettruthshieldkey12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  console.log("===== REGISTER ROUTE HIT =====");
  console.log(req.body);

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  console.log("===== LOGIN ROUTE HIT =====");
  console.log(req.body);

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password' });
  }

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @desc    Get comprehensive user statistics for dashboard
// @route   GET /api/auth/stats
// @access  Private
export const getUserStats = async (req, res) => {
  try {
    const [scans, totalUsers] = await Promise.all([
      Scan.find({ userId: req.user.id }),
      User.countDocuments()
    ]);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    const totalScans = scans.length;
    const fakeScans = scans.filter(s => s.prediction === 'Fake').length;
    const realScans = scans.filter(s => s.prediction === 'Real').length;
    const failedScans = scans.filter(s => s.status === 'failed').length;
    const successfulScans = scans.filter(s => s.status !== 'failed').length;
    const successRate = totalScans > 0 ? Math.round((successfulScans / totalScans) * 100) : 0;

    // Time-windowed counts
    const todayScans = scans.filter(s => new Date(s.createdAt) >= todayStart).length;
    const weeklyScans = scans.filter(s => new Date(s.createdAt) >= weekStart).length;
    const monthlyScans = scans.filter(s => new Date(s.createdAt) >= monthStart).length;

    // Average confidence
    let avgConfidence = 0;
    if (totalScans > 0) {
      avgConfidence = Math.round(scans.reduce((acc, s) => acc + (s.confidenceScore || 0), 0) / totalScans);
    }

    // Average risk score
    let avgRiskScore = 0;
    if (totalScans > 0) {
      const sumRisk = scans.reduce((acc, scan) => {
        let score = scan.prediction === 'Fake' ? scan.confidenceScore : (100 - scan.confidenceScore);
        return acc + score;
      }, 0);
      avgRiskScore = Math.round(sumRisk / totalScans);
    }

    // Average processing time (ms)
    let avgProcessingTime = 0;
    const scansWithTime = scans.filter(s => s.processingTime > 0);
    if (scansWithTime.length > 0) {
      avgProcessingTime = Math.round(scansWithTime.reduce((acc, s) => acc + s.processingTime, 0) / scansWithTime.length);
    }

    // Type breakdown
    const typeBreakdown = {
      text: scans.filter(s => s.type === 'text').length,
      url: scans.filter(s => s.type === 'url').length,
      image: scans.filter(s => s.type === 'image').length,
      video: scans.filter(s => s.type === 'video').length,
    };

    // Provider usage
    const providerUsage = {
      gemini: scans.filter(s => s.provider === 'Gemini' || !s.provider).length,
      openai: scans.filter(s => s.provider === 'OpenAI').length,
    };

    // Currently active provider (from most recent scan)
    const activeProvider = totalScans > 0 ? (scans[0].provider || 'Gemini') : 'None';

    // Confidence distribution buckets
    const confidenceDistribution = {
      '0-20': scans.filter(s => s.confidenceScore >= 0 && s.confidenceScore <= 20).length,
      '21-40': scans.filter(s => s.confidenceScore >= 21 && s.confidenceScore <= 40).length,
      '41-60': scans.filter(s => s.confidenceScore >= 41 && s.confidenceScore <= 60).length,
      '61-80': scans.filter(s => s.confidenceScore >= 61 && s.confidenceScore <= 80).length,
      '81-100': scans.filter(s => s.confidenceScore >= 81 && s.confidenceScore <= 100).length,
    };

    // Daily scan trend (last 7 days)
    const dailyTrend = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const dayScans = scans.filter(s => {
        const sd = new Date(s.createdAt);
        return sd >= d && sd < nextD;
      });
      dailyTrend.push({
        day: dayNames[d.getDay()],
        date: d.toISOString().split('T')[0],
        total: dayScans.length,
        safe: dayScans.filter(s => s.prediction === 'Real').length,
        threats: dayScans.filter(s => s.prediction === 'Fake').length,
      });
    }

    // Weekly activity (last 4 weeks)
    const weeklyActivity = [];
    for (let i = 3; i >= 0; i--) {
      const wStart = new Date(todayStart);
      wStart.setDate(wStart.getDate() - (i + 1) * 7);
      const wEnd = new Date(todayStart);
      wEnd.setDate(wEnd.getDate() - i * 7);
      const wScans = scans.filter(s => {
        const sd = new Date(s.createdAt);
        return sd >= wStart && sd < wEnd;
      });
      weeklyActivity.push({
        week: `W${4 - i}`,
        startDate: wStart.toISOString().split('T')[0],
        total: wScans.length,
        safe: wScans.filter(s => s.prediction === 'Real').length,
        threats: wScans.filter(s => s.prediction === 'Fake').length,
      });
    }

    // Recent 10 scans
    const recentScans = scans.slice(0, 10).map(s => ({
      _id: s._id,
      type: s.type,
      content: s.content,
      prediction: s.prediction,
      confidenceScore: s.confidenceScore,
      riskLevel: s.riskLevel,
      credibilityScore: s.credibilityScore,
      explanation: s.explanation,
      provider: s.provider || 'Gemini',
      processingTime: s.processingTime || 0,
      factCheckReport: s.factCheckReport || null,
      createdAt: s.createdAt,
    }));

    res.json({
      totalScans,
      fakeScans,
      realScans,
      failedScans,
      successRate,
      avgConfidence,
      avgRiskScore,
      avgProcessingTime,
      todayScans,
      weeklyScans,
      monthlyScans,
      typeBreakdown,
      providerUsage,
      activeProvider,
      confidenceDistribution,
      dailyTrend,
      weeklyActivity,
      recentScans,
      totalUsers,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error generating dashboard statistics' });
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ message: 'Please enter all fields.' });
  }

  try {
    // Check if email or username taken by another user
    const emailExists = await User.findOne({ email });
    if (emailExists && String(emailExists._id) !== req.user.id) {
      return res.status(400).json({ message: 'Email is already in use by another user.' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists && String(usernameExists._id) !== req.user.id) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    const updatedUser = await User.updateOne(req.user.id, { username, email });

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      message: 'Profile updated successfully.'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile details.' });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
export const updateUserPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please enter current and new passwords.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.updateOne(req.user.id, { password: hashedPassword });

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Server error updating password.' });
  }
};

// @desc    Request forgot password token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Please enter your email.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email.' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token to store
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    await User.updateOne(user._id, { resetPasswordToken, resetPasswordExpires });

    // Print to console for server verification
    console.log(`🔑 PASSWORD RESET LINK for ${email}: http://localhost:5173/reset-password/${resetToken}`);

    res.json({
      message: 'Password reset link generated and printed to console.',
      resetToken,
      resetLink: `http://localhost:5173/reset-password/${resetToken}`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during forgot password.' });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Please provide a new password.' });
  }

  try {
    // Hash parameter token to match stored hash
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ resetPasswordToken });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    if (new Date(user.resetPasswordExpires) < new Date()) {
      return res.status(400).json({ message: 'Password reset token has expired.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear token/expires
    await User.updateOne(user._id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
};

