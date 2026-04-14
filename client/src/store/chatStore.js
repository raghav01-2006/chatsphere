import { create } from 'zustand';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import toast from 'react-hot-toast';

const useChatStore = create((set, get) => ({
  rooms: [],
  activeRoom: null,
  messages: {}, // { roomId: [messages] }
  typingUsers: {}, // { roomId: { userId: username } }
  onlineUsers: new Set(), // Set of online user IDs
  
  setActiveRoom: (room) => set({ activeRoom: room }),

  // Fetch all rooms for the current user
  fetchMyRooms: async () => {
    try {
      const res = await api.get('/rooms/my');
      set({ rooms: res.data.rooms });
    } catch (err) {
      console.error('Failed to fetch rooms:', err.message);
    }
  },

  // Fetch messages for a room with pagination
  fetchMessages: async (roomId, page = 1) => {
    try {
      const res = await api.get(`/rooms/${roomId}/messages?page=${page}&limit=50`);
      const newMessages = res.data.messages || [];
      set(state => ({
        messages: {
          ...state.messages,
          [roomId]: page === 1
            ? newMessages
            : [...newMessages, ...(state.messages[roomId] || [])], // prepend older msgs
        },
      }));
      return res.data.pagination;
    } catch (err) {
      console.error('Failed to fetch messages:', err.message);
    }
  },

  // Send a message via socket
  sendMessage: (roomId, content, type = 'text', extra = {}) => {
    const socket = getSocket();
    const { user } = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state || {};
    if (!socket || !roomId) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      content,
      type,
      sender: user,
      createdAt: new Date().toISOString(),
      reactions: [],
      isTemp: true,
      ...extra,
    };

    // Optimistic update
    set(state => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), tempMessage],
      },
    }));

    socket.emit('send_message', { roomId, content, type, ...extra }, (response) => {
      if (response?.message) {
        // Replace temp with real
        set(state => ({
          messages: {
            ...state.messages,
            [roomId]: (state.messages[roomId] || []).map(m =>
              m._id === tempId ? response.message : m
            ),
          },
        }));
      }
    });
  },

  // Add a message from socket event (received from others)
  addMessage: (roomId, message) => {
    set(state => {
      const existing = state.messages[roomId] || [];
      // Avoid duplicates
      if (existing.some(m => m._id === message._id)) return {};
      return {
        messages: { ...state.messages, [roomId]: [...existing, message] },
        // Also update room's last message
        rooms: state.rooms.map(r =>
          r._id === roomId ? { ...r, lastMessage: message, lastActivity: message.createdAt } : r
        ),
      };
    });

    // If the message is in the active room, no toast needed
    const { activeRoom } = get();
    if (activeRoom?._id !== roomId) {
      const senderName = message.sender?.username || 'Someone';
      toast(`💬 ${senderName}: ${message.content?.slice(0, 40)}`, { duration: 3000 });
    }
  },

  // Update/edit a message
  updateMessage: (roomId, messageId, updates) => {
    set(state => ({
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] || []).map(m =>
          m._id === messageId ? { ...m, ...updates } : m
        ),
      },
    }));
  },

  // Delete a message
  deleteMessage: (roomId, messageId) => {
    set(state => ({
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] || []).map(m =>
          m._id === messageId ? { ...m, isDeleted: true, content: '' } : m
        ),
      },
    }));
  },

  // Typing indicators
  setTyping: (roomId, userId, username) => {
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [roomId]: {
          ...(state.typingUsers[roomId] || {}),
          [userId]: username,
        },
      },
    }));
  },

  clearTyping: (roomId, userId) => {
    set(state => {
      const roomTyping = { ...(state.typingUsers[roomId] || {}) };
      delete roomTyping[userId];
      return {
        typingUsers: { ...state.typingUsers, [roomId]: roomTyping },
      };
    });
  },

  // Online users tracking
  setOnlineUsers: (userIds) => {
    set({ onlineUsers: new Set(userIds) });
  },

  addOnlineUser: (userId) => {
    set(state => {
      const next = new Set(state.onlineUsers);
      next.add(userId);
      return { onlineUsers: next };
    });
  },

  removeOnlineUser: (userId) => {
    set(state => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    });
  },

  // Create a new room
  createRoom: async (data) => {
    const res = await api.post('/rooms', data);
    const room = res.data.room;
    set(state => ({ rooms: [room, ...state.rooms] }));
    return room;
  },

  // Create or get a DM room with another user
  createDM: async (userId) => {
    const res = await api.post(`/rooms/dm/${userId}`);
    const room = res.data.room;
    set(state => {
      const exists = state.rooms.some(r => r._id === room._id);
      return { rooms: exists ? state.rooms : [room, ...state.rooms] };
    });
    return room;
  },
}));

export default useChatStore;
