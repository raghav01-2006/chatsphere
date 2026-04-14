import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';
import { useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import useChatStore from '../../store/chatStore';

const AppLayout = () => {
  const { refreshUser } = useAuthStore();
  const { fetchNotifications } = useNotificationStore();
  const { fetchMyRooms } = useChatStore();

  useEffect(() => {
    refreshUser();
    fetchNotifications();
    fetchMyRooms();
  }, []);

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
