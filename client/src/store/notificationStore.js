import { create } from 'zustand';
import api from '../utils/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      const notifications = res.data.notifications || [];
      set({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      });
    } catch {}
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications.slice(0, 49)],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set(state => ({
        notifications: state.notifications.map(n => n._id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {}
  },

  markAllRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {}
  },

  deleteNotification: async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      set(state => ({
        notifications: state.notifications.filter(n => n._id !== id),
        unreadCount: state.notifications.find(n => n._id === id && !n.read)
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      }));
    } catch {}
  },
}));

export default useNotificationStore;
