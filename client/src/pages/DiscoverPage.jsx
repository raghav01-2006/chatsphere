
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, UserCircle, Users, Zap, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { getAvatarFallback, generateColor, getLevelName } from '../utils/helpers';

const DiscoverPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Initial fetch of some users or just empty
    handleSearch();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setSearching(true);
    try {
      const res = await api.get(`/users/search?q=${query}`);
      setResults(res.data.users || []);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleMessage = async (userId) => {
    try {
      const res = await api.post(`/rooms/dm/${userId}`);
      navigate(`/chat/${res.data.room._id}`);
    } catch {
      toast.error('Failed to start chat');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 scrollbar-none bg-bg-primary">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-10 text-center py-8 bg-gradient-to-b from-white/[0.03] to-transparent rounded-3xl border border-white/[0.05]">
          <h1 className="text-3xl font-black mb-2 flex items-center justify-center gap-3">
            <Users size={32} className="text-white" />
            Discover People
          </h1>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Find your friends, search for tech experts, and join the conversation.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-12">
          <div className="relative group">
            <Search 
              size={20} 
              className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-white transition-colors" 
            />
            <input
              type="text"
              placeholder="Search by username or email..."
              className="w-full h-14 bg-bg-secondary border border-border-subtle rounded-2xl pl-14 pr-32 outline-none focus:border-white/20 focus:bg-bg-tertiary transition-all text-sm shadow-inner"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit"
              disabled={searching}
              className="absolute right-2 top-2 bottom-2 px-6 bg-white text-black rounded-xl font-bold text-xs hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {searching ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="card h-28 animate-pulse bg-white/[0.02]" />
            ))
          ) : results.length > 0 ? (
            results.map((u) => (
              <div key={u._id} className="card-elevated flex items-center gap-4 group hover:border-white/20 transition-all border border-transparent">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform"
                  style={{ background: u.avatar ? 'transparent' : generateColor(u.username) }}
                >
                  {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover rounded-2xl" /> : getAvatarFallback(u.username)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-sm truncate">{u.username}</h3>
                    {u.isAdmin && <span className="text-[8px] px-1 bg-white/10 text-white font-black rounded">ADMIN</span>}
                  </div>
                  <p className="text-[10px] text-text-muted mb-1 flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                    <Zap size={10} className="text-yellow-400/80" />
                    {getLevelName(u.level)} · Level {u.level}
                  </p>
                  <p className="text-[11px] text-success flex items-center gap-1.5">
                    {u.isOnline ? (
                      <><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Online</>
                    ) : (
                      <span className="text-text-disabled">Recently active</span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => navigate(`/profile/${u._id}`)}
                    className="p-2 rounded-xl bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    title="View Profile"
                  >
                    <UserCircle size={18} />
                  </button>
                  <button 
                    onClick={() => handleMessage(u._id)}
                    className="p-2 rounded-xl bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    title="Message"
                  >
                    <MessageSquare size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 bg-white/[0.02] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
                <TrendingUp size={24} className="text-text-muted opacity-50" />
              </div>
              <h3 className="font-bold text-text-muted">No users found</h3>
              <p className="text-text-disabled text-xs mt-1">Try a different search term or check for typos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;
