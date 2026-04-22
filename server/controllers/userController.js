const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get user by ID
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -blockedUsers -friendRequests')
      .populate('badges', 'name icon color rarity description')
      .populate('friends', 'username avatar isOnline lastSeen status level');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search users
// @route   GET /api/users/search?q=
const searchUsers = async (req, res) => {
  try {
    const { q, query } = req.query;
    const searchTerm = q || query || '';

    const users = await User.find({
      $or: [
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
    }).select('username avatar level xp isOnline status').limit(20);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard?period=weekly|monthly|all
const getLeaderboard = async (req, res) => {
  try {
    const { period = 'all' } = req.query;

    let sortField = 'xp';
    if (period === 'weekly') sortField = 'weeklyXP';
    if (period === 'monthly') sortField = 'monthlyXP';

    const users = await User.find({})
      .select('username avatar level xp weeklyXP monthlyXP badges totalMessages')
      .populate('badges', 'icon name')
      .sort({ [sortField]: -1 })
      .limit(50);

    res.json({ success: true, users, period });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send friend request
// @route   POST /api/users/:id/friend-request
const sendFriendRequest = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    if (target.friends.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already friends' });
    }

    if (target.friendRequests.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Request already sent' });
    }

    target.friendRequests.push(req.user._id);
    await target.save();

    await Notification.create({
      recipient: target._id,
      sender: req.user._id,
      type: 'friend_request',
      title: 'Friend Request',
      content: `${req.user.username} sent you a friend request`,
      icon: '👋',
      link: `/profile/${req.user._id}`,
    });

    res.json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept friend request
// @route   POST /api/users/:id/accept-friend
const acceptFriendRequest = async (req, res) => {
  try {
    const sender = await User.findById(req.params.id);
    const receiver = await User.findById(req.user._id);

    if (!receiver.friendRequests.includes(req.params.id)) {
      return res.status(400).json({ success: false, message: 'No friend request from this user' });
    }

    receiver.friendRequests = receiver.friendRequests.filter(
      id => id.toString() !== req.params.id
    );
    receiver.friends.push(req.params.id);
    sender.friends.push(req.user._id);

    await receiver.save();
    await sender.save();

    await Notification.create({
      recipient: sender._id,
      sender: req.user._id,
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      content: `${req.user.username} accepted your friend request!`,
      icon: '🤝',
      link: `/profile/${req.user._id}`,
    });

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Block user
// @route   POST /api/users/:id/block
const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.blockedUsers.includes(req.params.id)) {
      user.blockedUsers.push(req.params.id);
      // Remove from friends if they are friends
      user.friends = user.friends.filter(id => id.toString() !== req.params.id);
      await user.save();
    }
    res.json({ success: true, message: 'User blocked' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUserById, searchUsers, getLeaderboard, sendFriendRequest, acceptFriendRequest, blockUser };
