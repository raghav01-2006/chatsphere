import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send, Hash, Users, MoreVertical, Plus, MessageSquare,
  Reply, Edit2, Trash2, Smile, X, Pin, ArrowDown, Search,
  Phone, Video, Info, Circle, ChevronRight
} from 'lucide-react';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import { getSocket } from '../utils/socket';
import { formatMessageTime, getAvatarFallback, generateColor, truncate } from '../utils/helpers';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ─── Avatar component ────────────────────────────────────────────────────────
const Avatar = ({ user, size = 8, showOnline = false, onlineUsers = new Set() }) => {
  const sizeClass = `w-${size} h-${size}`;
  const isOnline = onlineUsers.has(user?._id);
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center text-xs font-bold`}
        style={{ background: user?.avatar ? 'transparent' : generateColor(user?.username || 'U') }}
      >
        {user?.avatar
          ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          : getAvatarFallback(user?.username)
        }
      </div>
      {showOnline && (
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-bg-secondary ${isOnline ? 'bg-success' : 'bg-border-default'}`} />
      )}
    </div>
  );
};

// ─── Typing Indicator ────────────────────────────────────────────────────────
const TypingIndicator = ({ users }) => {
  const names = Object.values(users).filter(Boolean);
  if (!names.length) return null;
  return (
    <div className="flex items-center gap-2 px-2 py-1 animate-fade-in h-6">
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce-dot"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <span className="text-xs text-text-muted">
        {names.slice(0, 2).join(', ')} {names.length === 1 ? 'is' : 'are'} typing...
      </span>
    </div>
  );
};

// ─── Reaction Pill ───────────────────────────────────────────────────────────
const ReactionPills = ({ reactions, onReact, currentUserId }) => {
  const grouped = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasMe: false };
    acc[r.emoji].count++;
    if (r.user === currentUserId || r.user?._id === currentUserId) acc[r.emoji].hasMe = true;
    return acc;
  }, {});

  return Object.entries(grouped).map(([emoji, data]) => (
    <button key={emoji} onClick={() => onReact(emoji)}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
        data.hasMe
          ? 'bg-white/10 border-white/30 text-white'
          : 'bg-bg-elevated border-border-subtle text-text-muted hover:border-border-strong'
      }`}>
      <span>{emoji}</span>
      <span>{data.count}</span>
    </button>
  ));
};

// ─── Message Bubble ──────────────────────────────────────────────────────────
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🔥', '😢'];

const MessageBubble = ({ message, isOwn, currentUser, onReaction, onReply, onEdit, onDelete, onlineUsers }) => {
  const [hover, setHover] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-0.5`}>
        <div className="text-xs text-text-disabled italic border border-border-subtle/50 rounded-xl px-3 py-1.5 max-w-xs">
          🗑 Message deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 mb-1 group`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setShowReactionPicker(false); }}
    >
      {/* Avatar (only for others) */}
      {!isOwn && (
        <div className="mb-1">
          <Avatar user={message.sender} size={7} showOnline onlineUsers={onlineUsers} />
        </div>
      )}

      <div className={`flex flex-col max-w-[68%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name */}
        {!isOwn && (
          <span className="text-[11px] text-text-muted mb-0.5 ml-1 font-medium">{message.sender?.username}</span>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={`flex items-center gap-1.5 text-xs border-l-2 border-border-strong pl-2 mb-1 text-text-muted max-w-full`}>
            <Reply size={10} className="flex-shrink-0" />
            <span className="truncate">
              <span className="font-medium text-text-secondary">{message.replyTo.sender?.username}</span>
              {': '}{message.replyTo.content?.slice(0, 50)}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div className={`relative ${isOwn ? 'msg-bubble-own' : 'msg-bubble-other'}`}>
          {message.type === 'image' && message.fileUrl ? (
            <img src={message.fileUrl} alt="img" className="rounded-xl max-w-full max-h-60 object-cover" />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Time + edited */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isOwn ? 'text-black/40' : 'text-text-disabled'}`}>
              {formatMessageTime(message.createdAt)}
            </span>
            {message.isEdited && (
              <span className={`text-[10px] ${isOwn ? 'text-black/30' : 'text-text-disabled'}`}>(edited)</span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            <ReactionPills
              reactions={message.reactions}
              onReact={(emoji) => onReaction(message._id, emoji)}
              currentUserId={currentUser?._id}
            />
          </div>
        )}
      </div>

      {/* Hover action toolbar */}
      {hover && (
        <div className={`flex items-center gap-0.5 mb-2 opacity-0 group-hover:opacity-100 transition-opacity animate-fade-in ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Quick react */}
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(p => !p)}
              className="p-1.5 rounded-lg bg-bg-elevated border border-border-subtle hover:bg-bg-tertiary transition-colors"
            >
              <Smile size={13} className="text-text-muted" />
            </button>
            {showReactionPicker && (
              <div className={`absolute bottom-8 ${isOwn ? 'right-0' : 'left-0'} z-50 flex gap-1.5 bg-bg-card border border-border-default rounded-2xl p-2 shadow-modal`}>
                {QUICK_REACTIONS.map(e => (
                  <button key={e}
                    onClick={() => { onReaction(message._id, e); setShowReactionPicker(false); }}
                    className="text-lg hover:scale-125 transition-transform leading-none">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => onReply(message)} className="p-1.5 rounded-lg bg-bg-elevated border border-border-subtle hover:bg-bg-tertiary transition-colors">
            <Reply size={13} className="text-text-muted" />
          </button>
          {isOwn && (
            <>
              <button onClick={() => onEdit(message)} className="p-1.5 rounded-lg bg-bg-elevated border border-border-subtle hover:bg-bg-tertiary transition-colors">
                <Edit2 size={13} className="text-text-muted" />
              </button>
              <button onClick={() => onDelete(message._id)} className="p-1.5 rounded-lg bg-bg-elevated border border-border-subtle hover:bg-error/10 transition-colors">
                <Trash2 size={13} className="text-error/60 hover:text-error transition-colors" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Date separator ──────────────────────────────────────────────────────────
const DateSeparator = ({ date }) => {
  const label = (() => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  })();
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border-subtle" />
      <span className="text-[11px] text-text-muted bg-bg-primary px-3">{label}</span>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  );
};

// ─── Online Users Panel ───────────────────────────────────────────────────────
const OnlineUsersPanel = ({ room, onlineUsers, onDM }) => {
  if (!room?.members) return null;
  const online = room.members.filter(m => onlineUsers.has(m._id));
  const offline = room.members.filter(m => !onlineUsers.has(m._id));

  return (
    <div className="w-52 flex-shrink-0 border-l border-border-subtle flex flex-col bg-bg-secondary">
      <div className="px-3 py-3 border-b border-border-subtle">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Members — {room.members.length}</h3>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none py-2">
        {online.length > 0 && (
          <>
            <p className="section-header mb-1">Online — {online.length}</p>
            {online.map(m => (
              <button key={m._id} onClick={() => onDM(m._id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent-glow rounded-lg transition-colors">
                <Avatar user={m} size={6} showOnline onlineUsers={onlineUsers} />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium truncate">{m.username}</p>
                  <p className="text-[10px] text-success">Online</p>
                </div>
              </button>
            ))}
          </>
        )}
        {offline.length > 0 && (
          <>
            <p className="section-header mt-3 mb-1 opacity-60">Offline — {offline.length}</p>
            {offline.map(m => (
              <button key={m._id} onClick={() => onDM(m._id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent-glow rounded-lg transition-colors opacity-50">
                <Avatar user={m} size={6} showOnline onlineUsers={onlineUsers} />
                <p className="text-xs truncate">{m.username}</p>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Chat Page ───────────────────────────────────────────────────────────
const ChatPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { rooms, activeRoom, setActiveRoom, messages, typingUsers, fetchMessages,
    fetchMyRooms, addMessage, sendMessage, createRoom, createDM, onlineUsers } = useChatStore();

  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [showMembers, setShowMembers] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({ name: '', description: '', type: 'group', isPrivate: false });
  const [creating, setCreating] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socket = getSocket();

  const roomMessages = messages[roomId] || [];
  const roomTyping = typingUsers[roomId] || {};
  const filteredTyping = Object.fromEntries(
    Object.entries(roomTyping).filter(([id]) => id !== user?._id)
  );

  // Load room + messages when roomId changes
  useEffect(() => {
    if (!roomId) return;
    setLoadingRoom(true);
    setPage(1);

    const existing = rooms.find(r => r._id === roomId);
    if (existing) setActiveRoom(existing);

    api.get(`/rooms/${roomId}`)
      .then(res => { setRoomInfo(res.data.room); setActiveRoom(res.data.room); })
      .catch(() => {})
      .finally(() => setLoadingRoom(false));

    fetchMessages(roomId, 1).then(pagination => {
      if (pagination) setHasMore(pagination.hasMore);
    });

    socket?.emit('join_room', { roomId });
  }, [roomId]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const nearBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (nearBottom) scrollToBottom();
    }
  }, [roomMessages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
  };

  const loadMoreMessages = async () => {
    const nextPage = page + 1;
    const pagination = await fetchMessages(roomId, nextPage);
    if (pagination) setHasMore(pagination.hasMore);
    setPage(nextPage);
  };

  const handleTyping = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('typing', { roomId, username: user?.username });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit('stop_typing', { roomId }), 2000);
  }, [socket, roomId, user?.username]);

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || !roomId) return;

    if (editingMsg) {
      socket?.emit('edit_message', { messageId: editingMsg._id, content, roomId });
      setEditingMsg(null);
    } else {
      sendMessage(roomId, content, 'text', replyTo ? { replyTo: replyTo._id } : {});
      setReplyTo(null);
    }
    setInput('');
    socket?.emit('stop_typing', { roomId });
    scrollToBottom();
  }, [input, roomId, editingMsg, replyTo, socket, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setReplyTo(null);
      setEditingMsg(null);
      setInput('');
    }
  };

  const handleReaction = (messageId, emoji) => {
    socket?.emit('add_reaction', { messageId, emoji, roomId });
  };

  const handleDelete = (messageId) => {
    if (window.confirm('Delete this message?')) {
      socket?.emit('delete_message', { messageId, roomId });
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomForm.name.trim()) return;
    setCreating(true);
    try {
      const room = await createRoom(newRoomForm);
      toast.success(`#${room.name} created!`);
      setShowCreateModal(false);
      setNewRoomForm({ name: '', description: '', type: 'group', isPrivate: false });
      navigate(`/chat/${room._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleDM = async (userId) => {
    try {
      const room = await createDM(userId);
      navigate(`/chat/${room._id}`);
    } catch {
      toast.error('Failed to open DM');
    }
  };

  // Group messages by date
  const groupedMessages = [];
  let lastDate = null;
  for (const msg of roomMessages) {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: 'date', date: msg.createdAt, key: msgDate });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: 'message', msg, key: msg._id });
  }

  const currentRoom = roomInfo || activeRoom;

  // ── No room selected ────────────────────────────────────────────────────────
  if (!roomId) {
    return (
      <div className="h-full flex">
        {/* Room list */}
        <div className="w-72 border-r border-border-subtle flex flex-col bg-bg-secondary">
          <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
            <h2 className="font-semibold text-sm">Messages</h2>
            <button onClick={() => setShowCreateModal(true)}
              className="p-1.5 rounded-lg hover:bg-accent-glow transition-colors" title="New Room">
              <Plus size={15} className="text-text-muted" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none py-2">
            {rooms.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare size={32} className="text-text-muted mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">No rooms yet</p>
                <p className="text-xs text-text-muted mb-4">Create a room or join a community to get started</p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">
                  <Plus size={13} /> Create Room
                </button>
              </div>
            ) : (
              rooms.map(room => {
                const isDM = room.type === 'direct';
                const other = isDM ? room.members?.find(m => m._id !== user?._id) : null;
                const displayName = isDM ? (other?.username || 'Direct Message') : room.name;
                const isOnline = other ? onlineUsers.has(other._id) : false;

                return (
                  <button key={room._id} onClick={() => navigate(`/chat/${room._id}`)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent-glow transition-colors text-left ${roomId === room._id ? 'bg-white/[0.05]' : ''}`}>
                    <div className="relative flex-shrink-0">
                      {isDM && other ? (
                        <Avatar user={other} size={9} showOnline onlineUsers={onlineUsers} />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center">
                          <Hash size={14} className="text-text-muted" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        {room.lastMessage && (
                          <span className="text-[10px] text-text-disabled ml-1 flex-shrink-0">
                            {formatMessageTime(room.lastActivity || room.updatedAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted truncate">
                        {room.lastMessage
                          ? `${room.lastMessage.sender?.username ? room.lastMessage.sender.username + ': ' : ''}${truncate(room.lastMessage.content, 35)}`
                          : room.description || 'No messages yet'
                        }
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-bg-elevated rounded-2xl flex items-center justify-center mb-4 border border-border-subtle">
            <MessageSquare size={28} className="text-text-muted" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Select a conversation</h3>
          <p className="text-text-muted text-sm mb-6 max-w-xs">Choose from your rooms on the left or create a new one</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={14} /> New Room
          </button>
        </div>

        {/* Create Room Modal */}
        {showCreateModal && <CreateRoomModal
          form={newRoomForm} setForm={setNewRoomForm}
          onSubmit={handleCreateRoom} onClose={() => setShowCreateModal(false)}
          creating={creating}
        />}
      </div>
    );
  }

  // ── Chat Room View ──────────────────────────────────────────────────────────
  return (
    <div className="h-full flex overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 h-14 border-b border-border-subtle flex items-center gap-3 flex-shrink-0">
          {currentRoom?.type === 'direct' ? (
            (() => {
              const other = currentRoom?.members?.find(m => m._id !== user?._id);
              return (
                <>
                  <Avatar user={other} size={8} showOnline onlineUsers={onlineUsers} />
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold">{other?.username}</h2>
                    <p className="text-[11px] text-text-muted">
                      {onlineUsers.has(other?._id) ? '🟢 Online' : '⚫ Offline'}
                    </p>
                  </div>
                </>
              );
            })()
          ) : (
            <>
              <div className="w-8 h-8 bg-bg-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                <Hash size={14} className="text-text-muted" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold">{currentRoom?.name || '...'}</h2>
                <p className="text-[11px] text-text-muted">
                  {currentRoom?.members?.filter(m => onlineUsers.has(m._id))?.length || 0} online
                  · {currentRoom?.members?.length || 0} members
                </p>
              </div>
            </>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowMembers(p => !p)}
              className={`p-2 rounded-xl hover:bg-accent-glow transition-colors ${showMembers ? 'bg-white/[0.06]' : ''}`}
              title="Toggle members"
            >
              <Users size={15} className="text-text-muted" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-none px-4 py-2"
        >
          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pb-4">
              <button onClick={loadMoreMessages} className="btn-ghost text-xs flex items-center gap-1">
                Load older messages
              </button>
            </div>
          )}

          {loadingRoom ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : roomMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 bg-bg-elevated rounded-2xl flex items-center justify-center mb-3 border border-border-subtle">
                <MessageSquare size={20} className="text-text-muted" />
              </div>
              <p className="font-medium text-sm mb-1">No messages yet</p>
              <p className="text-xs text-text-muted">Be the first to say something!</p>
            </div>
          ) : (
            groupedMessages.map(item =>
              item.type === 'date'
                ? <DateSeparator key={item.key} date={item.date} />
                : <MessageBubble
                    key={item.key}
                    message={item.msg}
                    isOwn={item.msg.sender?._id === user?._id}
                    currentUser={user}
                    onReaction={handleReaction}
                    onReply={(m) => { setReplyTo(m); setEditingMsg(null); setInput(''); inputRef.current?.focus(); }}
                    onEdit={(m) => { setEditingMsg(m); setInput(m.content); setReplyTo(null); inputRef.current?.focus(); }}
                    onDelete={handleDelete}
                    onlineUsers={onlineUsers}
                  />
            )
          )}

          <TypingIndicator users={filteredTyping} />
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <div className="absolute bottom-20 right-72 z-10">
            <button onClick={scrollToBottom}
              className="w-8 h-8 bg-bg-card border border-border-default rounded-full flex items-center justify-center shadow-modal hover:bg-bg-elevated transition-colors">
              <ArrowDown size={14} className="text-text-muted" />
            </button>
          </div>
        )}

        {/* Reply/Edit banner */}
        {(replyTo || editingMsg) && (
          <div className="px-4 py-2 border-t border-border-subtle bg-bg-secondary flex items-center gap-3 animate-slide-up flex-shrink-0">
            <div className="w-0.5 h-8 bg-white/40 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-text-muted font-medium">
                {editingMsg ? 'Editing message' : `Replying to ${replyTo?.sender?.username}`}
              </p>
              <p className="text-xs text-text-secondary truncate">
                {(editingMsg || replyTo)?.content?.slice(0, 60)}
              </p>
            </div>
            <button onClick={() => { setReplyTo(null); setEditingMsg(null); setInput(''); }}
              className="text-text-muted hover:text-text-primary transition-colors p-1">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-border-subtle flex-shrink-0">
          <div className="flex items-end gap-2 bg-bg-elevated border border-border-default rounded-2xl px-4 py-2 focus-within:border-border-strong transition-colors">
            <textarea
              ref={inputRef}
              id="chat-message-input"
              rows={1}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none resize-none py-1.5 max-h-32 leading-relaxed"
              placeholder={`Message ${currentRoom?.type === 'direct'
                ? currentRoom?.members?.find(m => m._id !== user?._id)?.username || 'user'
                : `#${currentRoom?.name || '...'}`}`}
              value={input}
              onChange={e => { setInput(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown}
              style={{ minHeight: '24px' }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              id="send-message-btn"
              className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-[10px] text-text-disabled mt-1.5 ml-1">Enter to send · Shift+Enter for newline · Esc to cancel</p>
        </div>
      </div>

      {/* Online Members Panel */}
      {showMembers && currentRoom?.type !== 'direct' && (
        <OnlineUsersPanel room={currentRoom} onlineUsers={onlineUsers} onDM={handleDM} />
      )}

      {/* Create Room Modal */}
      {showCreateModal && <CreateRoomModal
        form={newRoomForm} setForm={setNewRoomForm}
        onSubmit={handleCreateRoom} onClose={() => setShowCreateModal(false)}
        creating={creating}
      />}
    </div>
  );
};

// ─── Create Room Modal ────────────────────────────────────────────────────────
const CreateRoomModal = ({ form, setForm, onSubmit, onClose, creating }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-bg-card border border-border-default rounded-2xl p-6 w-full max-w-md animate-slide-up shadow-modal" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Create Room</h3>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1.5 block">Room Name *</label>
          <input className="input" placeholder="e.g. general, announcements"
            value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required maxLength={50} autoFocus />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1.5 block">Description</label>
          <input className="input" placeholder="What's this room for?"
            value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} maxLength={200} />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1.5 block">Type</label>
          <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            <option value="group">Group Room</option>
            <option value="community">Community Room</option>
          </select>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.isPrivate} onChange={e => setForm(p => ({ ...p, isPrivate: e.target.checked }))}
            className="w-4 h-4 rounded" />
          <div>
            <p className="text-sm font-medium">Private Room</p>
            <p className="text-xs text-text-muted">Only members with invite code can join</p>
          </div>
        </label>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={creating || !form.name.trim()}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
            {creating ? 'Creating...' : 'Create Room'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  </div>
);

export default ChatPage;
