import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Users, Lock, Globe, Tag, Sparkles } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Technology', 'Education', 'Gaming', 'Science', 'Art', 'Music', 'Sports', 'General', 'Other'];

const CommunitiesPage = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'General', tags: '' });

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'All') params.set('category', category);
      const res = await api.get(`/communities?${params}`);
      setCommunities(res.data.communities);
    } catch {
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCommunities();
  };

  const handleJoin = async (communityId, e) => {
    e.stopPropagation();
    try {
      await api.post(`/communities/${communityId}/join`);
      toast.success('Joined community!');
      fetchCommunities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      await api.post('/communities', { ...form, tags });
      toast.success('Community created! 🎉');
      setShowCreate(false);
      setForm({ name: '', description: '', category: 'General', tags: '' });
      fetchCommunities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-none p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Communities</h2>
            <p className="text-text-muted text-sm">Find your people</p>
          </div>
          <button onClick={() => setShowCreate(true)} id="create-community-btn"
            className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Community
          </button>
        </div>

        {/* Search + Filter */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search communities..."
              className="input pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary px-4">Search</button>
        </form>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === cat
                  ? 'bg-white text-black'
                  : 'bg-bg-tertiary text-text-muted border border-border-subtle hover:border-border-default'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <div className="bg-bg-card border border-border-default rounded-2xl p-6 w-full max-w-md animate-slide-up shadow-modal" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Sparkles size={18} /> Create Community</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Name *</label>
                  <input className="input" placeholder="e.g. React Developers" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required maxLength={50} />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Description *</label>
                  <textarea className="input resize-none" rows={3} placeholder="What's this community about?"
                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required maxLength={300} />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Tags (comma separated)</label>
                  <input className="input" placeholder="react, web, javascript" value={form.tags}
                    onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={creating} className="btn-primary flex-1 disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create Community'}
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Community Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse h-32">
                <div className="h-4 bg-border-subtle rounded w-1/2 mb-2" />
                <div className="h-3 bg-border-subtle rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="text-text-muted mx-auto mb-4" />
            <p className="font-medium mb-1">No communities found</p>
            <p className="text-text-muted text-sm">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communities.map(community => (
              <div key={community._id}
                onClick={() => navigate(`/communities/${community._id}`)}
                className="card hover:border-border-default transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-lg flex-shrink-0">
                      {community.avatar || '🌐'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-sm group-hover:text-white transition-colors">{community.name}</h3>
                        {community.isVerified && <span className="text-info text-xs">✓</span>}
                        {community.isPrivate ? <Lock size={10} className="text-text-muted" /> : <Globe size={10} className="text-text-muted" />}
                      </div>
                      <p className="text-xs text-text-muted">{community.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={e => handleJoin(community._id, e)}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Join
                  </button>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-3 line-clamp-2">{community.description}</p>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-1">
                    <Users size={11} />
                    <span>{community.members?.length || 0} members</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {community.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-bg-tertiary rounded-full text-[10px]">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunitiesPage;
