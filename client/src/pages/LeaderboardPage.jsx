import { useEffect, useState } from 'react';
import { Trophy, Zap, Crown } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { getAvatarFallback, generateColor, formatXP, getLevelName } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const PERIODS = [
  { key: 'all', label: 'All Time' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const RANK_STYLES = [
  'text-rarity-legendary',
  'text-rarity-uncommon',
  'text-rarity-rare',
];

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [period, setPeriod] = useState('all');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/game/leaderboard?period=${period}`);
        setLeaderboard(res.data.leaderboard);
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, [period]);

  const myRank = leaderboard.findIndex(u => u._id === user?._id) + 1;

  return (
    <div className="h-full overflow-y-auto scrollbar-none p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><Trophy size={22} className="text-rarity-legendary" /> Leaderboard</h2>
            <p className="text-text-muted text-sm">Top performers this {period === 'all' ? 'time' : period === 'weekly' ? 'week' : 'month'}</p>
          </div>
          {myRank > 0 && (
            <div className="text-right">
              <p className="text-xs text-text-muted">Your rank</p>
              <p className="text-2xl font-black">#{myRank}</p>
            </div>
          )}
        </div>

        {/* Period selector */}
        <div className="flex gap-2 mb-6">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === p.key ? 'bg-white text-black' : 'bg-bg-tertiary text-text-muted border border-border-subtle hover:border-border-default'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        {!loading && leaderboard.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {[leaderboard[1], leaderboard[0], leaderboard[2]].map((u, podiumIdx) => {
              if (!u) return null;
              const rank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3;
              const heights = ['h-24', 'h-32', 'h-20'];
              const crowns = ['', '👑', ''];
              return (
                <div key={u._id} className="flex flex-col items-center gap-2 cursor-pointer group"
                  onClick={() => navigate(`/profile/${u._id}`)}>
                  <div className="text-lg">{podiumIdx === 1 ? '👑' : podiumIdx === 0 ? '🥈' : '🥉'}</div>
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold border-2"
                    style={{
                      borderColor: rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : '#cd7f32',
                      background: generateColor(u.username),
                    }}>
                    {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : getAvatarFallback(u.username)}
                  </div>
                  <p className="text-xs font-semibold group-hover:text-white transition-colors">{u.username}</p>
                  <div className={`${heights[podiumIdx]} w-20 flex flex-col items-center justify-center rounded-xl border`}
                    style={{
                      background: rank === 1 ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.03)',
                      borderColor: rank === 1 ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.08)',
                    }}>
                    <span className={`text-lg font-black ${RANK_STYLES[rank - 1]}`}>#{rank}</span>
                    <span className="text-xs text-text-muted">{formatXP(u.xp)} XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full list */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="card animate-pulse h-14" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((u, i) => {
              const isMe = u._id === user?._id;
              return (
                <button key={u._id}
                  onClick={() => navigate(`/profile/${u._id}`)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:bg-accent-glow text-left ${
                    isMe ? 'border-white/20 bg-white/[0.03]' : 'border-border-subtle hover:border-border-default'
                  }`}>
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {u.rank <= 3
                      ? <span className="text-lg">{u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : '🥉'}</span>
                      : <span className="text-sm font-bold text-text-muted">#{u.rank}</span>
                    }
                  </div>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: u.avatar ? 'transparent' : generateColor(u.username) }}>
                    {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : getAvatarFallback(u.username)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-semibold ${isMe ? 'text-white' : ''}`}>{u.username}</span>
                      {isMe && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">You</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span>{getLevelName(u.level)} · Lv.{u.level}</span>
                      {u.loginStreak > 0 && <span>🔥 {u.loginStreak}d</span>}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-1 flex-shrink-0">
                    {u.badges?.slice(0, 2).map(b => (
                      <span key={b._id} title={b.name} className="text-sm">{b.icon}</span>
                    ))}
                  </div>

                  {/* XP */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Zap size={11} className="text-warning" />
                      <span className="text-sm font-bold">{formatXP(u.xp)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
