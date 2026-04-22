import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { connectSocket, getSocket, disconnectSocket } from './utils/socket';

import useAuthStore from './store/authStore';
import useChatStore from './store/chatStore';
import useNotificationStore from './store/notificationStore';

import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import PostDetailPage from './pages/PostDetailPage';
import QuizPage from './pages/QuizPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import DiscoverPage from './pages/DiscoverPage';
import AdminRoute from './components/auth/AdminRoute';

// ─── Protected route ─────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
};

// ─── Public route (redirect if logged in) ────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { token } = useAuthStore();
  return !token ? children : <Navigate to="/dashboard" replace />;
};

// ─── Socket Manager ──────────────────────────────────────────────────────────
const SocketManager = () => {
  const { token, user } = useAuthStore();
  const { addMessage, updateMessage, deleteMessage, setTyping, clearTyping,
          setOnlineUsers, addOnlineUser, removeOnlineUser, fetchMyRooms } = useChatStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!token || !user) return;

    const socket = connectSocket(token);

    // Online presence
    socket.on('online_users', (userIds) => {
      setOnlineUsers(userIds);
    });
    socket.on('user_online', ({ userId }) => {
      addOnlineUser(userId);
    });
    socket.on('user_offline', ({ userId }) => {
      removeOnlineUser(userId);
    });

    // Messages
    socket.on('new_message', ({ roomId, message }) => {
      addMessage(roomId, message);
    });
    socket.on('message_edited', ({ roomId, messageId, content, isEdited }) => {
      updateMessage(roomId, messageId, { content, isEdited });
    });
    socket.on('message_deleted', ({ roomId, messageId }) => {
      deleteMessage(roomId, messageId);
    });
    socket.on('reaction_added', ({ roomId, messageId, reactions }) => {
      updateMessage(roomId, messageId, { reactions });
    });

    // Typing
    socket.on('typing', ({ roomId, userId, username }) => {
      setTyping(roomId, userId, username);
    });
    socket.on('stop_typing', ({ roomId, userId }) => {
      clearTyping(roomId, userId);
    });

    // New room created / invited
    socket.on('room_created', () => {
      fetchMyRooms();
    });
    socket.on('invited_to_room', () => {
      fetchMyRooms();
    });

    // Notifications
    socket.on('notification', (notification) => {
      addNotification(notification);
    });

    // XP / level up
    socket.on('level_up', ({ level, xpReward }) => {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success(`🎉 Level Up! You're now Level ${level}!`, { duration: 5000 });
      });
    });
    socket.on('badge_earned', ({ badge }) => {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success(`${badge.icon} Badge Unlocked: ${badge.name}!`, { duration: 5000 });
      });
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      socket.emit('get_online_users');
    });
    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });
    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    return () => {
      disconnectSocket();
    };
  }, [token, user?._id]);

  return null;
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a1a',
            color: '#f5f5f5',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />
      <SocketManager />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected with layout */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:roomId" element={<ChatPage />} />
          <Route path="communities" element={<CommunitiesPage />} />
          <Route path="communities/:id" element={<CommunityDetailPage />} />
          <Route path="communities/post/:id" element={<PostDetailPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="profile/:id" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
