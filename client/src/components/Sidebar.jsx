import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Compass, Trophy, Zap, LayoutDashboard, Search,
  Plus, Hash, Users, ChevronDown, ChevronRight, Settings, LogOut, Shield
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import { getAvatarFallback, generateColor, getLevelProgress, formatXP, getLevelName } from '../utils/helpers';

const NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discover',    icon: Search,          label: 'Discover' },
  { to: '/communities', icon: Compass,         label: 'Communities' },
  { to: '/quiz',        icon: Zap,             label: 'Daily Quiz' },
  { to: '/leaderboard', icon: Trophy,          label: 'Leaderboard' },
];

const UserAvatar = ({ user, size = 8, isOnline = false }) => (
  <div className="relative flex-shrink-0">
    <div
      className={`w-${size} h-${size} rounded-full overflow-hidden flex items-center justify-center text-xs font-bold`}
      style={{ background: user?.avatar ? 'transparent' : generateColor(user?.username || 'U') }}
    >
      {user?.avatar
        ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
        : getAvatarFallback(user?.username)
      }
    </div>
    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-bg-secondary ${isOnline ? 'bg-success' : 'bg-border-default'}`} />
  </div>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { rooms, activeRoom, setActiveRoom, fetchMessages, onlineUsers, createDM } = useChatStore();
  const [showRooms, setShowRooms] = useState(true);
  const [showDMs, setShowDMs] = useState(true);

  const groupRooms = rooms.filter(r => r.type === 'group' || r.type === 'community');
  const dmRooms = rooms.filter(r => r.type === 'direct');

  const openRoom = (room) => {
    setActiveRoom(room);
    fetchMessages(room._id);
    navigate(`/chat/${room._id}`);
  };

  const getDMPartner = (room) => room.members?.find(m => m._id !== user?._id);

  const xpProgress = getLevelProgress(user?.xp || 0, user?.level || 1);
  const isUserOnline = (userId) => onlineUsers.has(userId);

  return (
    <aside className="w-60 flex flex-col bg-[#111111] border-r border-white/[0.06] h-full flex-shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <MessageSquare size={14} className="text-black" />
          </div>
          <span className="font-bold text-sm tracking-tight">Chat Sphere</span>
        </div>
      </div>

      {/* User card + XP */}
      <div className="px-3 py-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-2.5">
          <UserAvatar user={user} size={8} isOnline />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user?.username}</p>
            <p className="text-[10px] text-white/40">{getLevelName(user?.level)} · Lv.{user?.level}</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-yellow-400/80">
            <Zap size={10} />
            <span>{formatXP(user?.xp || 0)}</span>
          </div>
        </div>
        <div className="xp-bar">
          <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-white/25 mt-1">
          <span>Lv.{user?.level}</span>
          <span>{xpProgress.toFixed(0)}% to next</span>
          <span>Lv.{Math.min((user?.level || 1) + 1, 10)}</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="px-2 py-2 flex-shrink-0 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={15} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        {user?.isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active border-l-2 border-white' : 'text-white/80 font-semibold'}`}
          >
            <Shield size={15} />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="divider mx-3" />

      {/* Rooms & DMs */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-2 pb-2">

        {/* Group Rooms */}
        <div className="mb-2">
          <button
            onClick={() => setShowRooms(p => !p)}
            className="section-header w-full flex items-center justify-between py-1.5 hover:text-white/60 transition-colors"
          >
            <span>Rooms</span>
            <div className="flex items-center gap-1 mr-1">
              <button onClick={e => { e.stopPropagation(); navigate('/chat'); }}
                className="hover:bg-white/[0.06] p-0.5 rounded" title="Browse rooms">
                <Plus size={10} />
              </button>
              {showRooms ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </div>
          </button>

          {showRooms && (
            groupRooms.length === 0 ? (
              <p className="text-[11px] text-white/20 px-3 py-1">No rooms yet</p>
            ) : (
              groupRooms.map(room => (
                <button key={room._id} onClick={() => openRoom(room)} id={`room-${room._id}`}
                  className={`sidebar-item w-full ${activeRoom?._id === room._id ? 'active' : ''}`}>
                  <Hash size={13} className="flex-shrink-0 opacity-60" />
                  <span className="truncate flex-1">{room.name}</span>
                  {room.lastMessage && (
                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))
            )
          )}
        </div>

        {/* DMs */}
        <div>
          <button
            onClick={() => setShowDMs(p => !p)}
            className="section-header w-full flex items-center justify-between py-1.5 hover:text-white/60 transition-colors"
          >
            <span>Direct Messages</span>
            {showDMs ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>

          {showDMs && (
            dmRooms.length === 0 ? (
              <p className="text-[11px] text-white/20 px-3 py-1">No DMs yet</p>
            ) : (
              dmRooms.map(room => {
                const other = getDMPartner(room);
                const online = other ? isUserOnline(other._id) : false;
                return (
                  <button key={room._id} onClick={() => openRoom(room)}
                    className={`sidebar-item w-full ${activeRoom?._id === room._id ? 'active' : ''}`}>
                    <div className="relative flex-shrink-0">
                      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold"
                        style={{ background: generateColor(other?.username || 'U') }}>
                        {getAvatarFallback(other?.username)}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-bg-secondary ${online ? 'bg-success' : 'bg-border-default'}`} />
                    </div>
                    <span className="truncate flex-1">{other?.username || 'User'}</span>
                  </button>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="px-2 py-2 border-t border-white/[0.06] flex-shrink-0 space-y-0.5">
        <NavLink to="/settings" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <Settings size={15} />
          <span>Settings</span>
        </NavLink>
        <button onClick={logout} className="sidebar-item w-full text-red-400/60 hover:text-red-400">
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
