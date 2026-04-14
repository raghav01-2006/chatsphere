const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { awardXP } = require('../utils/gamification');

// Track online users: userId → Set of socketIds (multi-tab support)
const onlineUsers = new Map();

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const setupSocket = (io) => {
  // ─── Auth middleware ──────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 ${userId} connected (${socket.id})`);

    // ─── Online presence ─────────────────────────────────────────────────────
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    socket.join(userId); // personal room

    // Broadcast online status
    io.emit('user_online', { userId });

    // Send full online list to the newly connected user
    socket.emit('online_users', getOnlineUserIds());

    // Re-join all their rooms
    try {
      const userRooms = await Room.find({ members: userId }).select('_id');
      userRooms.forEach(r => socket.join(r._id.toString()));
    } catch {}

    // ─── Get online users on demand ──────────────────────────────────────────
    socket.on('get_online_users', () => {
      socket.emit('online_users', getOnlineUserIds());
    });

    // ─── Join / Leave rooms ───────────────────────────────────────────────────
    socket.on('join_room', ({ roomId }) => {
      socket.join(roomId);
      socket.emit('room_joined', { roomId });
    });

    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);
    });

    // ─── Send message ────────────────────────────────────────────────────────
    socket.on('send_message', async (data, callback) => {
      try {
        const { roomId, content, type = 'text', fileUrl, fileName, replyTo } = data;
        if (!content?.trim() && !fileUrl) return;

        // Auth check — user must be a member
        const room = await Room.findById(roomId);
        if (!room || !room.members.map(m => m.toString()).includes(userId)) {
          return socket.emit('error', { message: 'Not a member of this room' });
        }

        const message = await Message.create({
          sender: userId, room: roomId, content: content?.trim(),
          type, fileUrl, fileName, replyTo: replyTo || null,
        });

        await message.populate('sender', 'username avatar level');
        if (replyTo) {
          await message.populate({ path: 'replyTo', populate: { path: 'sender', select: 'username' } });
        }

        await Room.findByIdAndUpdate(roomId, {
          lastMessage: message._id, lastActivity: new Date(),
        });

        // XP award
        await User.findByIdAndUpdate(userId, { $inc: { totalMessages: 1 } });
        await awardXP(userId, 'message', io);

        // Emit to all in room with correct event name
        io.to(roomId).emit('new_message', { roomId, message });

        // Callback to sender for optimistic update replacement
        if (typeof callback === 'function') callback({ message });

        // Notify offline members
        for (const memberId of room.members) {
          const mId = memberId.toString();
          if (mId === userId) continue;
          if (!onlineUsers.has(mId)) {
            await Notification.create({
              recipient: memberId, sender: userId, type: 'message',
              title: 'New Message', content: `New message in ${room.name}`,
              icon: '💬', link: `/chat/${roomId}`,
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('send_message error:', err.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── Typing ───────────────────────────────────────────────────────────────
    socket.on('typing', ({ roomId, username }) => {
      socket.to(roomId).emit('typing', { roomId, userId, username });
    });

    socket.on('stop_typing', ({ roomId }) => {
      socket.to(roomId).emit('stop_typing', { roomId, userId });
    });

    // ─── Reactions ────────────────────────────────────────────────────────────
    socket.on('add_reaction', async ({ messageId, emoji, roomId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingIdx = message.reactions.findIndex(
          r => r.user.toString() === userId && r.emoji === emoji
        );

        if (existingIdx >= 0) {
          message.reactions.splice(existingIdx, 1); // toggle off
        } else {
          message.reactions = message.reactions.filter(r => r.user.toString() !== userId);
          message.reactions.push({ emoji, user: userId });
        }

        await message.save();
        io.to(roomId).emit('reaction_added', { roomId, messageId, reactions: message.reactions });
      } catch (err) {
        console.error('add_reaction error:', err.message);
      }
    });

    // ─── Edit message ─────────────────────────────────────────────────────────
    socket.on('edit_message', async ({ messageId, content, roomId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== userId) return;
        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();
        io.to(roomId).emit('message_edited', { roomId, messageId, content, isEdited: true });
      } catch (err) {
        console.error('edit_message error:', err.message);
      }
    });

    // ─── Delete message ───────────────────────────────────────────────────────
    socket.on('delete_message', async ({ messageId, roomId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== userId) return;
        message.isDeleted = true;
        message.content = '';
        await message.save();
        io.to(roomId).emit('message_deleted', { roomId, messageId });
      } catch (err) {
        console.error('delete_message error:', err.message);
      }
    });

    // ─── Mark read ────────────────────────────────────────────────────────────
    socket.on('mark_read', async ({ messageId, roomId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { $addToSet: { readBy: userId } });
        socket.to(roomId).emit('message_read', { messageId, userId });
      } catch {}
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
          io.emit('user_offline', { userId });
        }
      }
      console.log(`🔌 ${userId} disconnected (${socket.id})`);
    });
  });
};

module.exports = { setupSocket, onlineUsers };
