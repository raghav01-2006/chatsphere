
import { useState, useEffect } from 'react';
import { 
  Users, Zap, Shield, Database, 
  TrendingUp, Activity, CheckCircle, AlertTriangle 
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    totalPosts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // For now, we list users from a custom endpoint or search
      const usersRes = await api.get('/users/search?q=');
      setUsers(usersRes.data.users || []);
      
      // Basic stats calculation from the list for now
      setStats({
        totalUsers: usersRes.data.users?.length || 0,
        totalRooms: 0, // Placeholder
        totalPosts: 0, // Placeholder
      });
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const seedQuizzes = async () => {
    const loadingToast = toast.loading('Seeding quizzes...');
    try {
      await api.post('/game/quiz/seed');
      toast.success('Successfully seeded daily quizzes! 🎯', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to seed quizzes', { id: loadingToast });
    }
  };

  const seedBadges = async () => {
    const loadingToast = toast.loading('Seeding badges...');
    try {
      await api.post('/game/badges/seed');
      toast.success('Successfully seeded achievement badges! 🏆', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to seed badges', { id: loadingToast });
    }
  };

  const promoteUser = async (email) => {
    toast.error('Manual promotion is currently done via CLI for security.');
  };

  if (loading && users.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 scrollbar-none">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Shield className="text-white" size={32} />
              Admin Dashboard
            </h1>
            <p className="text-text-muted mt-1">Platform management and monitoring</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchData}
              className="btn-secondary py-2"
            >
              <Activity size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <StatCard 
            icon={Users} 
            label="Total Users" 
            value={stats.totalUsers} 
            color="text-info" 
          />
          <StatCard 
            icon={TrendingUp} 
            label="Engagement" 
            value="Active" 
            color="text-success" 
          />
          <StatCard 
            icon={Database} 
            label="Database" 
            value="Connected" 
            color="text-white" 
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="section-header mb-4">Maintenance Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={seedQuizzes}
              className="card-elevated flex items-center gap-4 text-left hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning group-hover:scale-110 transition-all">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="font-bold">Seed Daily Quizzes</h3>
                <p className="text-xs text-text-muted">Populate the daily quiz database with default sets</p>
              </div>
            </button>

            <button 
              onClick={seedBadges}
              className="card-elevated flex items-center gap-4 text-left hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-all">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold">Seed Badges</h3>
                <p className="text-xs text-text-muted">Initialize standard achievement and milestone badges</p>
              </div>
            </button>
          </div>
        </div>

        {/* User Management List */}
        <div>
          <h2 className="section-header mb-4">User Directory</h2>
          <div className="card scrollbar-none overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] text-text-muted border-b border-border-subtle uppercase tracking-wider">
                  <th className="pb-4 pt-1 px-4 font-semibold">User</th>
                  <th className="pb-4 pt-1 px-4 font-semibold">Status</th>
                  <th className="pb-4 pt-1 px-4 font-semibold">Level / XP</th>
                  <th className="pb-4 pt-1 px-4 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ background: `linear-gradient(135deg, #333, #111)` }}
                        >
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{u.username}</p>
                          <p className="text-xs text-text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs">
                      {u.isOnline ? (
                        <span className="flex items-center gap-1.5 text-success">
                          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Online
                        </span>
                      ) : (
                        <span className="text-text-disabled">Offline</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs font-medium">Lv. {u.level}</p>
                      <p className="text-[10px] text-text-muted">{u.xp} XP</p>
                    </td>
                    <td className="py-4 px-4">
                      {u.isAdmin ? (
                        <span className="px-2 py-1 bg-white/10 border border-white/20 rounded text-[10px] font-black tracking-tighter text-white">ADMIN</span>
                      ) : (
                        <span className="text-[10px] text-text-disabled">USER</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-10 text-center text-text-muted text-sm">
                 No users found.
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 p-6 border border-error/20 rounded-2xl bg-error/5">
          <h2 className="text-error font-bold flex items-center gap-2 mb-2">
            <AlertTriangle size={18} /> Danger Zone
          </h2>
          <p className="text-text-muted text-sm mb-4">Actions here are irreversible. Be cautious when managing database records.</p>
          <div className="flex gap-3">
             <button disabled className="btn-secondary border-error/20 text-error/60 opacity-50 cursor-not-allowed">Reset All Platform Data</button>
          </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

export default AdminPage;
