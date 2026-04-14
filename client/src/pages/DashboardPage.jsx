import { useNavigate } from 'react-router-dom';
import { MessageSquare, Users, Trophy, Zap, ArrowRight, Hash } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import { getLevelProgress, getLevelName, formatXP, formatRelativeTime, getAvatarFallback, generateColor, truncate } from '../utils/helpers';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { rooms } = useChatStore();

  const xpProgress = getLevelProgress(user?.xp || 0, user?.level || 1);
  const recentRooms = rooms.slice(0, 5);

  const quickActions = [
    { icon: MessageSquare, label: 'New Chat', desc: 'Start chatting', action: () => navigate('/chat'), color: 'text-info' },
    { icon: Users, label: 'Communities', desc: 'Explore spaces', action: () => navigate('/communities'), color: 'text-success' },
    { icon: Zap, label: 'Daily Quiz', desc: 'Earn XP now', action: () => navigate('/quiz'), color: 'text-warning' },
    { icon: Trophy, label: 'Leaderboard', desc: 'See rankings', action: () => navigate('/leaderboard'), color: 'text-rarity-epic' },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-none p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Welcome header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Hey, {user?.username} 👋
            </h2>
            <p className="text-text-muted text-sm mt-1">{getLevelName(user?.level)} · Level {user?.level}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">🔥 {user?.loginStreak || 0} day streak</p>
          </div>
        </div>

        {/* XP Card */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-text-muted mb-0.5">Total XP</p>
              <p className="text-3xl font-black">{formatXP(user?.xp || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Level</p>
              <p className="text-3xl font-black">{user?.level}</p>
            </div>
          </div>
          <div className="xp-bar mb-2">
            <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Lv. {user?.level}</span>
            <span>{xpProgress.toFixed(0)}% to next level</span>
            <span>Lv. {Math.min((user?.level || 1) + 1, 10)}</span>
          </div>
        </div>

        {/* Badges */}
        {user?.badges?.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">My Badges</h3>
            <div className="flex flex-wrap gap-2">
              {user.badges.map(badge => (
                <div key={badge._id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border bg-bg-tertiary badge-${badge.rarity}`}>
                  <span>{badge.icon}</span>
                  <span className="font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(a => (
            <button
              key={a.label}
              onClick={a.action}
              className="card hover:border-border-default transition-all text-left group hover:bg-bg-elevated"
            >
              <a.icon size={18} className={`${a.color} mb-2 group-hover:scale-110 transition-transform`} />
              <p className="text-sm font-semibold">{a.label}</p>
              <p className="text-xs text-text-muted">{a.desc}</p>
            </button>
          ))}
        </div>

        {/* Recent Rooms */}
        {recentRooms.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Recent Rooms</h3>
              <button onClick={() => navigate('/chat')} className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1">
                View all <ArrowRight size={11} />
              </button>
            </div>
            <div className="space-y-1">
              {recentRooms.map(room => (
                <button
                  key={room._id}
                  onClick={() => navigate(`/chat/${room._id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent-glow transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-bg-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={14} className="text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{room.name}</p>
                    <p className="text-xs text-text-muted truncate">
                      {room.lastMessage ? truncate(room.lastMessage.content, 40) : 'No messages yet'}
                    </p>
                  </div>
                  <div className="text-xs text-text-disabled">
                    {room.lastActivity ? formatRelativeTime(room.lastActivity) : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No rooms hint */}
        {recentRooms.length === 0 && (
          <div className="card text-center py-8">
            <MessageSquare size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">No rooms yet</p>
            <p className="text-xs text-text-muted mb-4">Join a community or create a room to get started</p>
            <button onClick={() => navigate('/communities')} className="btn-primary text-sm">
              Explore Communities
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
