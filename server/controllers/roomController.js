const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all accessible rooms
// @route   GET /api/rooms
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { members: req.user._id },
        { isPrivate: false },
      ],
      isArchived: false,
    })
      .populate('members', 'username avatar isOnline status')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my rooms
// @route   GET /api/rooms/mine
const getMyRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id, isArchived: false })
      .populate('members', 'username avatar isOnline status level')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username avatar' } })
      .sort({ lastActivity: -1 });

    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create room
// @route   POST /api/rooms
const createRoom = async (req, res) => {
  try {
    const { name, description, type, isPrivate, members } = req.body;

    const room = await Room.create({
      name,
      description,
      type: type || 'group',
      isPrivate: isPrivate || false,
      members: [...new Set([req.user._id.toString(), ...(members || [])])],
      admins: [req.user._id],
      createdBy: req.user._id,
      inviteCode: uuidv4().split('-')[0].toUpperCase(),
    });

    await room.populate('members', 'username avatar isOnline level');

    res.status(201).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:id
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('members', 'username avatar isOnline status level xp')
      .populate('admins', 'username avatar')
      .populate('pinnedMessages')
      .populate('createdBy', 'username avatar');

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.isPrivate && !room.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get room messages
// @route   GET /api/rooms/:id/messages
const getRoomMessages = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ room: req.params.id, isDeleted: false })
      .populate('sender', 'username avatar level')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'username' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Message.countDocuments({ room: req.params.id, isDeleted: false });

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: { page: Number(page), limit: Number(limit), total, hasMore: skip + messages.length < total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join room
// @route   POST /api/rooms/:id/join
const joinRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    if (room.members.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({ success: false, message: 'Room is full' });
    }

    room.members.push(req.user._id);
    await room.save();

    res.json({ success: true, message: 'Joined room successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join room by invite code
// @route   POST /api/rooms/join/:inviteCode
const joinByInviteCode = async (req, res) => {
  try {
    const room = await Room.findOne({ inviteCode: req.params.inviteCode.toUpperCase() });
    if (!room) return res.status(404).json({ success: false, message: 'Invalid invite code' });

    if (!room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }

    res.json({ success: true, room: { _id: room._id, name: room.name } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Leave room
// @route   POST /api/rooms/:id/leave
const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    room.members = room.members.filter(m => m.toString() !== req.user._id.toString());
    room.admins = room.admins.filter(m => m.toString() !== req.user._id.toString());
    await room.save();

    res.json({ success: true, message: 'Left room successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create or get DM room
// @route   POST /api/rooms/dm/:userId
const createOrGetDM = async (req, res) => {
  try {
    const otherUser = await User.findById(req.params.userId);
    if (!otherUser) return res.status(404).json({ success: false, message: 'User not found' });

    // Check if DM already exists
    let room = await Room.findOne({
      type: 'direct',
      members: { $all: [req.user._id, req.params.userId], $size: 2 },
    });

    if (!room) {
      room = await Room.create({
        name: `DM_${req.user._id}_${req.params.userId}`,
        type: 'direct',
        members: [req.user._id, req.params.userId],
        admins: [req.user._id],
        createdBy: req.user._id,
        isPrivate: true,
      });
    }

    await room.populate('members', 'username avatar isOnline status level');

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getRooms, getMyRooms, createRoom, getRoomById, getRoomMessages, joinRoom, joinByInviteCode, leaveRoom, createOrGetDM };
