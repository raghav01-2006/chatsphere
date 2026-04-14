import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, User, ChevronDown, X, Check, Trash2
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { getAvatarFallback, formatRelativeTime, generateColor } from '../utils/helpers';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotificationStore();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState('');
  const notifsRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/chat')) return 'Messages';
    if (path.startsWith('/communities')) return 'Communities';
    if (path === '/quiz') return 'Daily Quiz';
    if (path === '/leaderboard') return 'Leaderboard';
    if (path.startsWith('/profile')) return 'Profile';
    if (path === '/settings') return 'Settings';
    return 'Chat Sphere';
  };

  return (
    <header className="h-14 border-b border-border-subtle px-4 flex items-center justify-between flex-shrink-0 bg-bg-primary/80 backdrop-blur-sm">
      {/* Title */}
      <h1 className="text-sm font-semibold text-text-primary">{getTitle()}</h1>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button
            id="notif-btn"
            onClick={() => { setShowNotifs(p => !p); setShowProfile(false); }}
            className="relative p-2 rounded-xl hover:bg-accent-glow transition-colors"
          >
            <Bell size={18} className="text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-white text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-11 w-80 bg-bg-card border border-border-default rounded-2xl shadow-modal z-50 animate-slide-up overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                <span className="text-sm font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1">
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-none">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-text-muted text-sm">No notifications yet</div>
                ) : (
                  notifications.slice(0, 15).map(n => (
                    <div
                      key={n._id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-border-subtle/50 hover:bg-accent-hover transition-colors cursor-pointer ${!n.read ? 'bg-white/[0.02]' : ''}`}
                      onClick={() => { markRead(n._id); if (n.link) navigate(n.link); setShowNotifs(false); }}
                    >
                      <span className="text-lg mt-0.5">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${!n.read ? 'text-text-primary' : 'text-text-secondary'}`}>{n.title}</p>
                        <p className="text-xs text-text-muted truncate">{n.content}</p>
                        <p className="text-[10px] text-text-disabled mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 bg-white rounded-full mt-1 flex-shrink-0" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            id="profile-btn"
            onClick={() => { setShowProfile(p => !p); setShowNotifs(false); }}
            className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-accent-glow transition-colors"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold"
              style={{ background: user?.avatar ? 'transparent' : generateColor(user?.username || 'U') }}>
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : getAvatarFallback(user?.username)
              }
            </div>
            <span className="text-xs font-medium text-text-secondary hidden sm:block">{user?.username}</span>
            <ChevronDown size={12} className="text-text-muted" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-11 w-52 bg-bg-card border border-border-default rounded-2xl shadow-modal z-50 animate-slide-up overflow-hidden">
              <div className="px-4 py-3 border-b border-border-subtle">
                <p className="text-sm font-semibold">{user?.username}</p>
                <p className="text-xs text-text-muted">Level {user?.level} · {user?.xp} XP</p>
              </div>
              <div className="py-1">
                {[
                  { icon: User, label: 'My Profile', onClick: () => { navigate(`/profile/${user?._id}`); setShowProfile(false); } },
                  { icon: Settings, label: 'Settings', onClick: () => { navigate('/settings'); setShowProfile(false); } },
                ].map(item => (
                  <button key={item.label} onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-accent-glow transition-colors">
                    <item.icon size={14} />
                    {item.label}
                  </button>
                ))}
                <div className="divider mx-2" />
                <button onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors">
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
