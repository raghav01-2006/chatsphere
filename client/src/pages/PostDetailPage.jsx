import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronUp, MessageSquare, Send } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { formatRelativeTime, getAvatarFallback, generateColor } from '../utils/helpers';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/${id}`);
      setPost(res.data.post);
    } catch {
      toast.error('Post not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPost(); }, [id]);

  const handleVote = async (vote) => {
    try {
      const res = await api.post(`/posts/${id}/vote`, { vote });
      setPost(p => ({ ...p, upvotes: Array(res.data.upvotes).fill({}), downvotes: Array(res.data.downvotes).fill({}) }));
    } catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      const res = await api.post(`/posts/${id}/comment`, { content: comment });
      setPost(p => ({ ...p, comments: [...(p.comments || []), res.data.comment] }));
      setComment('');
      toast.success('Comment added!');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!post) return <div className="h-full flex items-center justify-center text-text-muted">Post not found</div>;

  return (
    <div className="h-full overflow-y-auto scrollbar-none p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-1 text-sm mb-4">
          <ArrowLeft size={14} /> Back
        </button>

        {/* Post */}
        <div className="card-elevated mb-4">
          <div className="flex gap-4">
            {/* Vote */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => handleVote('up')} className="hover:text-white text-text-muted transition-colors">
                <ChevronUp size={20} />
              </button>
              <span className="font-bold text-sm">{post.upvotes.length - post.downvotes.length}</span>
              <button onClick={() => handleVote('down')} className="rotate-180 hover:text-white text-text-muted transition-colors">
                <ChevronUp size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              {/* Author */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10px]"
                  style={{ background: generateColor(post.author?.username || 'U') }}>
                  {getAvatarFallback(post.author?.username)}
                </div>
                <span className="text-xs text-text-muted">Posted by {post.author?.username}</span>
                <span className="text-xs text-text-disabled">· {formatRelativeTime(post.createdAt)}</span>
                {post.community && (
                  <span
                    className="text-xs text-info cursor-pointer hover:underline"
                    onClick={() => navigate(`/communities/${post.community._id}`)}
                  >
                    in {post.community.name}
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold mb-3">{post.title}</h1>
              <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap mb-4">{post.body}</div>

              {post.images?.map((img, i) => (
                <img key={i} src={img} alt="" className="rounded-xl max-w-full mb-3" />
              ))}

              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-bg-tertiary rounded-full text-xs text-text-muted">#{t}</span>
                  ))}
                </div>
              )}

              <div className="text-xs text-text-muted flex gap-4">
                <span className="flex items-center gap-1"><MessageSquare size={11} /> {post.comments?.length || 0} comments</span>
                <span>{post.views || 0} views</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comment form */}
        <form onSubmit={handleComment} className="card-elevated mb-4">
          <p className="text-xs text-text-muted mb-2">Comment as <span className="text-white font-medium">{user?.username}</span></p>
          <textarea
            className="input resize-none mb-3"
            rows={3}
            placeholder="Share your thoughts..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <div className="flex justify-end">
            <button type="submit" disabled={commenting || !comment.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <Send size={13} /> {commenting ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </form>

        {/* Comments */}
        <div className="space-y-3 pb-6">
          {post.comments?.length === 0 && (
            <div className="text-center py-8 text-text-muted text-sm">No comments yet. Be the first!</div>
          )}
          {post.comments?.map((c, i) => (
            <div key={c._id || i} className="card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10px]"
                  style={{ background: generateColor(c.author?.username || 'U') }}>
                  {getAvatarFallback(c.author?.username)}
                </div>
                <span className="text-xs font-medium">{c.author?.username}</span>
                <span className="text-xs text-text-disabled">· {formatRelativeTime(c.createdAt)}</span>
                {c.upvotes?.length > 0 && <span className="text-xs text-text-muted ml-auto">👍 {c.upvotes.length}</span>}
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
