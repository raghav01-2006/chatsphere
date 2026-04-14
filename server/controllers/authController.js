const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { updateLoginStreak, awardXP } = require('../utils/gamification');

// @desc    Register new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken',
      });
    }

    const user = await User.create({ username, email, password });

    // Award first login XP
    await awardXP(user._id, 'daily_login');

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        badges: user.badges,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update streak and award XP
    await updateLoginStreak(user._id);
    await awardXP(user._id, 'daily_login');

    // Reset daily quiz if new day
    const today = new Date().toDateString();
    const quizDate = user.dailyQuizDate ? new Date(user.dailyQuizDate).toDateString() : null;
    if (quizDate !== today) {
      await User.findByIdAndUpdate(user._id, { dailyQuizCompleted: false, dailyQuizDate: new Date() });
    }

    const token = generateToken(user._id);

    const freshUser = await User.findById(user._id).populate('badges', 'name icon color rarity');

    res.json({
      success: true,
      token,
      user: {
        _id: freshUser._id,
        username: freshUser.username,
        email: freshUser.email,
        avatar: freshUser.avatar,
        xp: freshUser.xp,
        level: freshUser.level,
        badges: freshUser.badges,
        isAdmin: freshUser.isAdmin,
        loginStreak: freshUser.loginStreak,
        bio: freshUser.bio,
        status: freshUser.status,
        theme: freshUser.theme,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('badges', 'name icon color rarity description')
      .populate('friends', 'username avatar isOnline lastSeen status');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { username, bio, avatar, status, theme } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, bio, avatar, status, theme },
      { new: true, runValidators: true }
    ).populate('badges', 'name icon color rarity');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
