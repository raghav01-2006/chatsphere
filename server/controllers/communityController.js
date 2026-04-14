const Community = require('../models/Community');
const Room = require('../models/Room');
const { awardXP } = require('../utils/gamification');

// @desc    Get all communities
// @route   GET /api/communities
const getCommunities = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const communities = await Community.find(query)
      .populate('createdBy', 'username avatar')
      .sort({ 'members': -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Community.countDocuments(query);

    res.json({ success: true, communities, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create community
// @route   POST /api/communities
const createCommunity = async (req, res) => {
  try {
    const { name, description, category, tags, isPrivate, rules } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await Community.findOne({ slug });
    if (existing) return res.status(400).json({ success: false, message: 'Community name already taken' });

    // Create linked chat room
    const room = await Room.create({
      name: `${name} Chat`,
      description: `Official chat room for ${name}`,
      type: 'community',
      members: [req.user._id],
      admins: [req.user._id],
      createdBy: req.user._id,
    });

    const community = await Community.create({
      name,
      slug,
      description,
      category: category || 'General',
      tags: tags || [],
      isPrivate: isPrivate || false,
      rules: rules || [],
      members: [req.user._id],
      moderators: [req.user._id],
      createdBy: req.user._id,
      room: room._id,
    });

    await awardXP(req.user._id, 'community_created');

    res.status(201).json({ success: true, community });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get community by ID or slug
// @route   GET /api/communities/:id
const getCommunity = async (req, res) => {
  try {
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { slug: req.params.id };

    const community = await Community.findOne(query)
      .populate('createdBy', 'username avatar level')
      .populate('moderators', 'username avatar level')
      .populate('members', 'username avatar isOnline level')
      .populate('room');

    if (!community) return res.status(404).json({ success: false, message: 'Community not found' });

    res.json({ success: true, community });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join community
// @route   POST /api/communities/:id/join
const joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, message: 'Community not found' });

    if (community.members.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    community.members.push(req.user._id);
    await community.save();

    // Auto-join the linked room
    if (community.room) {
      await Room.findByIdAndUpdate(community.room, { $addToSet: { members: req.user._id } });
    }

    res.json({ success: true, message: 'Joined community' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Leave community
// @route   POST /api/communities/:id/leave
const leaveCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    community.members = community.members.filter(m => m.toString() !== req.user._id.toString());
    await community.save();

    res.json({ success: true, message: 'Left community' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCommunities, createCommunity, getCommunity, joinCommunity, leaveCommunity };
