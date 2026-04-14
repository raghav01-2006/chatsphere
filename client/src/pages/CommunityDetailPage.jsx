import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Plus, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { formatRelativeTime, getAvatarFallback, generateColor } from '../utils/helpers';

const CommunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showPost, setShowPost] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', body: '', tags: '' });
  const [posting, setPosting] = useState(false);
  const [sort, setSort] = useState('new');

  const isMember = community?.members?.some(m => (m._id || m) === user?._id);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [comRes, postsRes] = await Promise.all([
        api.get(`/communities/${id}`),
        api.get(`/posts?community=${id}&sort=${sort}`),
      ]);
      setCommunity(comRes.data.community);
      setPosts(postsRes.data.posts);
    } catch {
      toast.error('Failed to load community');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, sort]);

  const handleJoin = async () => {
    try {
      if (isMember) {
        await api.post(`/communities/${id}/leave`);
        toast.success('Left community');
      } else {
        await api.post(`/communities/${id}/join`);
        toast.success('Joined! Welcome 🎉');
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      const tags = postForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      await api.post('/posts', { ...postForm, tags, community: id });
      toast.success('Post created!');
      setShowPost(false);
      setPostForm({ title: '', body: '', tags: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (postId, vote) => {
    try {
      const res = await api.post(`/posts/${postId}/vote`, { vote });
      setPosts(ps => ps.map(p => p._id === postId ? { ...p, upvotes: Array(res.data.upvotes).fill(0), downvotes: Array(res.data.downvotes).fill(0) } : p));
    } catch {}
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!community) return (
    <div className="h-full flex items-center justify-center text-text-muted">Community not found</div>
  );

  return (
    <div className="h-full overflow-y-auto scrollbar-none">
      {/* Banner */}
      <div className="h-28 bg-gradient-to-r from-bg-tertiary to-bg-elevated border-b border-border-subtle relative">
        <button onClick={() => navigate('/communities')}
          className="absolute top-4 left-4 btn-ghost flex items-center gap-1 text-xs">
          <ArrowLeft size={13} /> Back
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-6">
        {/* Community Header */}
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-bg-card border-2 border-border-default flex items-center justify-center text-2xl shadow-card">
              {community.avatar || '🌐'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{community.name}</h2>
                {community.isVerified && <span className="text-info text-sm">✓ Verified</span>}
              </div>
              <p className="text-text-muted text-sm">{community.members?.length || 0} members · {community.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {community.room && (
              <button onClick={() => navigate(`/chat/${community.room._id || community.room}`)}
                className="btn-secondary flex items-center gap-1.5 text-sm">
                <MessageSquare size={13} /> Chat Room
              </button>
            )}
            <button onClick={handleJoin} className={isMember ? 'btn-secondary text-sm' : 'btn-primary text-sm'}>
              {isMember ? 'Leave' : 'Join'}
            </button>
          </div>
        </div>

        <p className="text-text-secondary text-sm mb-4 leading-relaxed">{community.description}</p>

        {community.tags?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {community.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 bg-bg-tertiary rounded-full text-xs text-text-muted border border-border-subtle">#{tag}</span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border-subtle mb-4">
          {['posts', 'members', 'about'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-white border-white'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}>
              {tab}
            </button>
          ))}
          {activeTab === 'posts' && (
            <div className="ml-auto flex items-center gap-1">
              {['new', 'top', 'hot'].map(s => (
                <button key={s} onClick={() => setSort(s)}
                  className={`px-3 py-1 text-xs rounded-lg capitalize ${sort === s ? 'bg-white text-black' : 'text-text-muted hover:text-text-primary'}`}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Posts tab */}
        {activeTab === 'posts' && (
          <div>
            {isMember && (
              <button onClick={() => setShowPost(p => !p)}
                className="btn-primary flex items-center gap-2 mb-4 text-sm">
                <Plus size={14} /> New Post
              </button>
            )}

            {showPost && (
              <form onSubmit={handleCreatePost} className="card-elevated mb-4 space-y-3">
                <input className="input" placeholder="Post title" value={postForm.title}
                  onChange={e => setPostForm(p => ({ ...p, title: e.target.value }))} required maxLength={200} />
                <textarea className="input resize-none" rows={4} placeholder="Write your post..."
                  value={postForm.body} onChange={e => setPostForm(p => ({ ...p, body: e.target.value }))} required />
                <input className="input" placeholder="Tags (comma separated)" value={postForm.tags}
                  onChange={e => setPostForm(p => ({ ...p, tags: e.target.value }))} />
                <div className="flex gap-2">
                  <button type="submit" disabled={posting} className="btn-primary disabled:opacity-50">
                    {posting ? 'Posting...' : 'Post'}
                  </button>
                  <button type="button" onClick={() => setShowPost(false)} className="btn-secondary">Cancel</button>
                </div>
              </form>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <p className="mb-2">No posts yet</p>
                {isMember && <p className="text-sm">Be the first to post!</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <div key={post._id}
                    onClick={() => navigate(`/communities/post/${post._id}`)}
                    className="card hover:border-border-default transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      {/* Vote column */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleVote(post._id, 'up')}
                          className="hover:text-white transition-colors text-text-muted">
                          <ChevronUp size={18} />
                        </button>
                        <span className="text-sm font-bold text-text-secondary">
                          {post.upvotes?.length - post.downvotes?.length || 0}
                        </span>
                        <button onClick={() => handleVote(post._id, 'down')}
                          className="hover:text-white transition-colors text-text-muted">
                          <ChevronDown size={18} />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[10px]"
                            style={{ background: generateColor(post.author?.username || 'U') }}>
                            {getAvatarFallback(post.author?.username)}
                          </div>
                          <span className="text-xs text-text-muted">{post.author?.username}</span>
                          <span className="text-xs text-text-disabled">· {formatRelativeTime(post.createdAt)}</span>
                          {post.flair && <span className="text-xs bg-bg-tertiary px-2 py-0.5 rounded-full">{post.flair}</span>}
                        </div>
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{post.title}</h3>
                        <p className="text-xs text-text-muted line-clamp-2">{post.body}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                          <span className="flex items-center gap-1"><MessageSquare size={11} /> {post.comments?.length || 0}</span>
                          <span>{post.views || 0} views</span>
                          {post.tags?.slice(0, 2).map(t => <span key={t} className="text-[10px]">#{t}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members tab */}
        {activeTab === 'members' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-6">
            {community.members?.map(member => (
              <button key={member._id || member}
                onClick={() => navigate(`/profile/${member._id || member}`)}
                className="card flex items-center gap-2 hover:border-border-default transition-all text-left">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold"
                  style={{ background: generateColor(member.username || 'U') }}>
                  {getAvatarFallback(member.username)}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.username}</p>
                  <p className="text-xs text-text-muted">Lv.{member.level}</p>
                </div>
                {community.moderators?.some(m => (m._id || m) === (member._id || member)) && (
                  <span className="ml-auto text-[10px] text-info">MOD</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* About tab */}
        {activeTab === 'about' && (
          <div className="card mb-6">
            <h3 className="font-semibold mb-3">About</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">{community.description}</p>
            {community.rules?.length > 0 && (
              <>
                <h4 className="font-semibold text-sm mb-2">Rules</h4>
                <div className="space-y-2">
                  {community.rules.map((rule, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-text-muted text-xs">{i + 1}.</span>
                      <div>
                        <p className="text-sm font-medium">{rule.title}</p>
                        {rule.description && <p className="text-xs text-text-muted">{rule.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDetailPage;
