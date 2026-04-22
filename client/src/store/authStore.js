import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      register: async (data) => {
        set({ loading: true });
        try {
          const res = await api.post('/auth/register', data);
          const { token, user } = res.data;
          set({ token, user, loading: false });
          return { success: true };
        } catch (err) {
          set({ loading: false });
          return { success: false, message: err.response?.data?.message || 'Registration failed' };
        }
      },

      login: async (data) => {
        set({ loading: true });
        try {
          const res = await api.post('/auth/login', data);
          const { token, user } = res.data;
          set({ token, user, loading: false });
          return { success: true };
        } catch (err) {
          set({ loading: false });
          return { success: false, message: err.response?.data?.message || 'Login failed' };
        }
      },

      logout: () => {
        api.defaults.headers.common['Authorization'] = '';
        set({ user: null, token: null });
        window.location.href = '/login';
      },

      // Refresh user data from backend
      refreshUser: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.user });
        } catch (err) {
          if (err.response?.status === 401) {
            set({ user: null, token: null });
          }
        }
      },

      // Merge partial updates into user object
      updateUser: (updates) => {
        set(state => ({ user: state.user ? { ...state.user, ...updates } : state.user }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
