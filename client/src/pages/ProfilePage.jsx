import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, UserPlus, UserMinus, Shield } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { formatRelativeTime, getAvatarFallback, generateColor, getLevelProgress, getLevelName, formatXP, getRarityColor } from '../utils/helpers';

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMe = id === currentUser?._id;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/${id}`);
        setProfile(res.data.user);
      } catch {
        toast.error('User not found');
      } finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleFriendRequest = async () => {
    try {
      await api.post(`/users/${id}/friend-request`);
      toast.success('Friend request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDM = async () => {
    try {
      const res = await api.post(`/rooms/dm/${id}`);
      navigate(`/chat/${res.data.room._id}`);
    } catch {
      toast.error('Failed to open DM');
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!profile) return <div className="h-full flex items-center justify-center text-text-muted">User not found</div>;

  const xpProgress = getLevelProgress(profile.xp, profile.level);

  return (
    <div className="h-full overflow-y-auto scrollbar-none">
      {/* Cover */}
      <div className="h-32 bg-gradient-to-r from-bg-secondary to-bg-tertiary border-b border-border-subtle" />

      <div className="max-w-2xl mx-auto px-6 -mt-10 pb-8">
        {/* Avatar + info */}
        <div className="flex items-end justify-between mb-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-bold border-2 border-bg-primary shadow-card"
            style={{ background: profile.avatar ? 'transparent' : generateColor(profile.username) }}>
            {profile.avatar ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" /> : getAvatarFallback(profile.username)}
          </div>

          {!isMe && (
            <div className="flex items-center gap-2 mb-2">
              <button onClick={handleDM} className="btn-secondary flex items-center gap-2 text-sm">
                <MessageSquare size={13} /> Message
              </button>
              <button onClick={handleFriendRequest} className="btn-primary flex items-center gap-2 text-sm">
                <UserPlus size={13} /> Add Friend
              </button>
            </div>
          )}
          {isMe && (
            <button onClick={() => navigate('/settings')} className="btn-secondary text-sm mb-2">
              Edit Profile
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-0.5">
          <h2 className="text-2xl font-bold">{profile.username}</h2>
          {profile.isAdmin && (
            <span className="px-1.5 py-0.5 bg-white/10 text-white text-[10px] font-black rounded border border-white/20 tracking-wider h-fit mt-1">ADMIN</span>
          )}
        </div>
        <p className="text-text-muted text-sm mb-1">{getLevelName(profile.level)} · Level {profile.level}</p>
        {profile.status && <p className="text-sm text-text-secondary mb-1">{profile.status}</p>}
        {profile.bio && <p className="text-sm text-text-muted mb-4 leading-relaxed">{profile.bio}</p>}

        <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
          {profile.isOnline
            ? <span className="flex items-center gap-1 text-success"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Online</span>
            : <span>Last seen {formatRelativeTime(profile.lastSeen)}</span>
          }
          <span>🔥 {profile.loginStreak || 0} day streak</span>
          <span>💬 {profile.totalMessages || 0} messages</span>
        </div>

        {/* XP Card */}
        <div className="card-elevated mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-text-muted">Total XP</p>
              <p className="text-2xl font-black">{formatXP(profile.xp)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Level</p>
              <p className="text-2xl font-black">{profile.level}</p>
            </div>
          </div>
          <div className="xp-bar mb-1">
            <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
          </div>
          <p className="text-[11px] text-text-muted">{xpProgress.toFixed(0)}% to Level {Math.min(profile.level + 1, 10)}</p>
        </div>

        {/* Badges */}
        {profile.badges?.length > 0 && (
          <div className="card mb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield size={14} /> Badges ({profile.badges.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {profile.badges.map(badge => (
                <div key={badge._id}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-bg-tertiary border border-border-subtle">
                  <span className="text-xl">{badge.icon}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: getRarityColor(badge.rarity) }}>{badge.name}</p>
                    <p className="text-[10px] text-text-muted capitalize">{badge.rarity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends */}
        {profile.friends?.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Friends ({profile.friends.length})</h3>
            <div className="flex flex-wrap gap-2">
              {profile.friends.map(friend => (
                <button key={friend._id}
                  onClick={() => navigate(`/profile/${friend._id}`)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-tertiary border border-border-subtle hover:border-border-default transition-all">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10px]"
                      style={{ background: generateColor(friend.username) }}>
                      {getAvatarFallback(friend.username)}
                    </div>
                    {friend.isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-success rounded-full" />}
                  </div>
                  <span className="text-xs">{friend.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
