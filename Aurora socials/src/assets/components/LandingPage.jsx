// ...existing code...
import axios from "../../api/axios.js";
import "./LandingPage.css";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegThumbsUp, FaThumbsUp, FaRegCommentDots, FaBookmark, FaImage, FaTimes, FaTrash, FaShare, FaLink, FaCheck, FaSmile } from "react-icons/fa";
import { IoCloseCircle, IoSend, IoChatbubbleEllipses } from "react-icons/io5";
import MessagesPanel from "./MessagesPanel.jsx";

const LandingPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [showCommentBox, setShowCommentBox] = useState(null); // postId or null
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewAllCommentsPostId, setViewAllCommentsPostId] = useState(null); // postId for full comment overlay
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostMediaUrl, setNewPostMediaUrl] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [deletePostConfirm, setDeletePostConfirm] = useState(null); // postId to confirm delete
  const [deleteCommentConfirm, setDeleteCommentConfirm] = useState(null); // commentId to confirm delete
  const [userProfilePicture, setUserProfilePicture] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, username }
  const [expandedReplies, setExpandedReplies] = useState({}); // { commentId: true/false }
  const [shareModal, setShareModal] = useState(null); // postId or null
  const [linkCopied, setLinkCopied] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);

  // Get username from localStorage
  const username = localStorage.getItem('username') || 'User';

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostMediaUrl(reader.result);
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearMedia = () => {
    setNewPostMediaUrl("");
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Create post handler
  const handleCreatePost = async () => {
    if (!userId || !newPostContent.trim()) return;
    try {
      await axios.post('/api/posts', {
        userId,
        content: newPostContent,
        mediaUrl: newPostMediaUrl.trim() || null
      });
      setNewPostContent("");
      setNewPostMediaUrl("");
      setMediaPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const updated = await axios.get("/api/posts");
      setPosts(updated.data);
    } catch (err) {}
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get("/api/posts");
        setPosts(response.data);
      } catch (err) {
        setError("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Fetch current user's profile picture
  useEffect(() => {
    const fetchUserProfile = async () => {
      const uid = localStorage.getItem('userId');
      if (uid) {
        try {
          const response = await axios.get(`/api/users/${uid}`);
          setUserProfilePicture(response.data.profilePicture);
        } catch (err) {}
      }
    };
    fetchUserProfile();
    window.addEventListener('profileUpdated', fetchUserProfile);
    return () => window.removeEventListener('profileUpdated', fetchUserProfile);
  }, []);

  // Get userId from localStorage
  const userId = Number(localStorage.getItem('userId'));

  // Like/unlike handler
  const handleLike = async (postId) => {
    if (!userId) return;
    try {
      await axios.post(`/api/posts/${postId}/like`, { userId });
      const updated = await axios.get("/api/posts");
      setPosts(updated.data);
    } catch (err) {}
  };

  // Save/unsave handler
  const handleSave = async (postId) => {
    if (!userId) return;
    try {
      await axios.post(`/api/savedPosts/${postId}/save`, { userId });
      const updated = await axios.get("/api/posts");
      setPosts(updated.data);
    } catch (err) {}
  };

  // Delete post handler
  const handleDeletePost = async (postId) => {
    if (!userId) return;
    try {
      await axios.delete(`/api/posts/${postId}`, { data: { userId } });
      setDeletePostConfirm(null);
      const updated = await axios.get("/api/posts");
      setPosts(updated.data);
    } catch (err) {
      console.error('Failed to delete post');
    }
  };

  // Delete comment handler
  const handleDeleteComment = async (commentId) => {
    if (!userId) return;
    try {
      await axios.delete(`/api/comments/${commentId}`, { data: { userId } });
      setDeleteCommentConfirm(null);
      const updated = await axios.get("/api/posts");
      setPosts(updated.data);
    } catch (err) {
      console.error('Failed to delete comment');
    }
  };

  if (loading) return <div>Loading posts...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="centered-bg">
      <div className="feed-container">
        <h1 className="feed-title">Let's see what's up!</h1>
        {/* Post Composer */}
        <div className="post-composer" style={{ width: '100%', background: '#292933', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <input
              type="text"
              placeholder={`What's on your mind, ${username}?`}
              value={newPostContent}
              onChange={e => setNewPostContent(e.target.value)}
              style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '20px', border: 'none', background: '#18181b', color: '#fff', fontSize: '1rem', outline: 'none' }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleCreatePost(); }}
            />
          </div>
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {/* Media Preview */}
          {mediaPreview && (
            <div style={{ position: 'relative', marginBottom: '0.75rem', overflow: 'visible' }}>
              <img
                src={mediaPreview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '12px', objectFit: 'contain', display: 'block' }}
              />
              <button
                onClick={clearMedia}
                style={{
                  position: 'absolute', top: '6px', right: '6px',
                  background: 'transparent', border: 'none', padding: 0,
                  cursor: 'pointer', lineHeight: 1
                }}
              >
                <IoCloseCircle style={{ fontSize: '24px', color: '#ef4444', background: '#fff', borderRadius: '50%' }} />
              </button>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #3a3a44', paddingTop: '0.75rem' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80', fontWeight: '600', fontSize: '0.95rem' }}
            >
              <FaImage style={{ fontSize: '1.2rem' }} /> Photo/Video
            </button>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: '600', fontSize: '0.95rem' }}
            >
              <FaSmile style={{ fontSize: '1.2rem' }} /> Feeling/Activity
            </button>
          </div>
          {newPostContent.trim() && (
            <button
              onClick={handleCreatePost}
              style={{ marginTop: '0.75rem', width: '100%', background: 'linear-gradient(90deg,#38bdf8,#2563eb)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
            >Post</button>
          )}
        </div>
        <div className="posts-wrapper">
          {posts.map(post => {
            const likedByUser = post.likes?.some(like => like.userId === userId);
            const savedByUser = post.savedBy?.some(saved => saved.userId === userId);
            return (
              <div key={post.id} className="post-card" style={{ background: '#1e293b', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                {/* Post Header - Avatar, Name, Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div
                    onClick={() => navigate(`/profile/${post.author?.id}`)}
                    style={{
                      width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer',
                      background: post.author?.profilePicture ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0
                    }}
                  >
                    {post.author?.profilePicture ? (
                      <img src={post.author.profilePicture} alt={post.author?.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '1.1rem' }}>
                        {(post.author?.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      onClick={() => navigate(`/profile/${post.author?.id}`)}
                      style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer' }}
                      onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.target.style.textDecoration = 'none'}
                    >
                      {post.author?.username || "Unknown"}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(post.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div style={{ color: '#f1f5f9', fontSize: '1rem', lineHeight: '1.5', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </div>

                {/* Media */}
                {post.mediaUrl && post.mediaUrl.trim() !== "" && (
                  <div style={{ marginBottom: '0.75rem', marginLeft: '-1rem', marginRight: '-1rem' }}>
                    <img src={post.mediaUrl} alt="Post media" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} />
                  </div>
                )}

                {/* Reaction counts */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #334155', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', gap: '1rem' }}>
                  <span>{post.likes?.length || 0} likes</span>
                  <span style={{ marginLeft: 'auto' }}
                    onClick={() => setViewAllCommentsPostId(post.id)}
                    onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.target.style.textDecoration = 'none'}
                  >
                    {post.comments?.length || 0} comments
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleLike(post.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        color: likedByUser ? '#38bdf8' : '#94a3b8', padding: '0.5rem 0.75rem',
                        borderRadius: '6px', transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      {likedByUser ? <FaThumbsUp /> : <FaRegThumbsUp />}
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Like</span>
                    </button>
                    <button
                      onClick={() => setShowCommentBox(showCommentBox === post.id ? null : post.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        color: '#94a3b8', padding: '0.5rem 0.75rem',
                        borderRadius: '6px', transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <FaRegCommentDots />
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Comment</span>
                    </button>
                    <button
                      onClick={() => handleSave(post.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        color: savedByUser ? '#fbbf24' : '#94a3b8', padding: '0.5rem 0.75rem',
                        borderRadius: '6px', transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <FaBookmark />
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Save</span>
                    </button>
                    <button
                      onClick={() => { setShareModal(post.id); setLinkCopied(false); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        color: '#94a3b8', padding: '0.5rem 0.75rem',
                        borderRadius: '6px', transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <FaShare />
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Share</span>
                    </button>
                  </div>
                  {post.authorId === userId && (
                    <button
                      onClick={() => setDeletePostConfirm(post.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        color: '#6b7280', padding: '0.5rem 0.75rem',
                        borderRadius: '6px', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}
                    >
                      <FaTrash style={{ fontSize: '0.85rem' }} />
                    </button>
                  )}
                </div>

                {/* Comment box */}
                {showCommentBox === post.id && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: userProfilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: '600', fontSize: '0.9rem', overflow: 'hidden'
                    }}>
                      {userProfilePicture ? (
                        <img src={userProfilePicture} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <textarea
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        style={{
                          width: '100%', minHeight: '40px', borderRadius: '20px', padding: '0.6rem 1rem',
                          fontSize: '0.95rem', background: '#0f172a', color: '#fff', border: '1px solid #334155',
                          resize: 'none', outline: 'none', boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = '#38bdf8'}
                        onBlur={e => e.target.style.borderColor = '#334155'}
                      />
                      {commentText.trim() && (
                        <button
                          onClick={async () => {
                            if (!commentText.trim()) return;
                            await axios.post(`/api/comments/${post.id}/comment`, { userId, content: commentText });
                            setCommentText("");
                            setShowCommentBox(null);
                            const updated = await axios.get("/api/posts");
                            setPosts(updated.data);
                          }}
                          style={{
                            alignSelf: 'flex-end', background: '#38bdf8', color: '#fff', border: 'none',
                            borderRadius: '6px', padding: '0.4rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
                          }}
                        >Post</button>
                      )}
                    </div>
                  </div>
                )}

                {/* Preview first comment */}
                {post.comments?.length > 0 && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: '#0f172a', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <div
                        onClick={() => navigate(`/profile/${post.comments[0].author?.id}`)}
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                          background: post.comments[0].author?.profilePicture ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                        }}
                      >
                        {post.comments[0].author?.profilePicture ? (
                          <img src={post.comments[0].author.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.7rem' }}>
                            {(post.comments[0].author?.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span
                          onClick={() => navigate(`/profile/${post.comments[0].author?.id}`)}
                          style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          {post.comments[0].author?.username || "Unknown"}
                        </span>
                        <span style={{ color: '#cbd5e1', fontSize: '0.85rem', marginLeft: '0.4rem' }}>
                          {post.comments[0].content}
                        </span>
                      </div>
                    </div>
                    {post.comments.length > 1 && (
                      <div
                        onClick={() => setViewAllCommentsPostId(post.id)}
                        style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.5rem', cursor: 'pointer' }}
                        onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.target.style.textDecoration = 'none'}
                      >
                        View all {post.comments.length} comments
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Full comment overlay modal - Facebook style */}
      {viewAllCommentsPostId && (() => {
        const post = posts.find(p => p.id === viewAllCommentsPostId);
        if (!post) return null;
        
        const formatTimeAgo = (dateString) => {
          const now = new Date();
          const date = new Date(dateString);
          const diffMs = now - date;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);
          if (diffMins < 1) return 'Just now';
          if (diffMins < 60) return `${diffMins}m`;
          if (diffHours < 24) return `${diffHours}h`;
          if (diffDays < 7) return `${diffDays}d`;
          return `${Math.floor(diffDays / 7)}w`;
        };

        const handleCommentLike = async (commentId) => {
          await axios.post(`/api/comments/${commentId}/like`, { userId });
          const updated = await axios.get("/api/posts");
          setPosts(updated.data);
        };

        const handleSendComment = async () => {
          if (!commentText.trim()) return;
          await axios.post(`/api/comments/${post.id}/comment`, { 
            userId, 
            content: commentText,
            parentId: replyingTo?.commentId || null
          });
          setCommentText("");
          setReplyingTo(null);
          const updated = await axios.get("/api/posts");
          setPosts(updated.data);
        };

        const toggleReplies = (commentId) => {
          setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
        };

        const renderComment = (comment, isReply = false) => {
          const isLiked = comment.likes?.some(like => like.userId === userId);
          const likeCount = comment.likes?.length || 0;
          const hasReplies = comment.replies && comment.replies.length > 0;
          const repliesExpanded = expandedReplies[comment.id];

          return (
            <div key={comment.id} style={{ marginLeft: isReply ? '2.5rem' : 0, marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {/* Profile picture */}
                <div
                  onClick={() => { setViewAllCommentsPostId(null); navigate(`/profile/${comment.author?.id}`); }}
                  style={{
                    width: isReply ? '28px' : '32px', height: isReply ? '28px' : '32px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                    background: comment.author?.profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                  }}
                >
                  {comment.author?.profilePicture ? (
                    <img src={comment.author.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#fff', fontSize: isReply ? '0.7rem' : '0.8rem', fontWeight: '600' }}>
                      {comment.author?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                
                {/* Comment content */}
                <div style={{ flex: 1 }}>
                  <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                    <div style={{
                      background: '#3a3b3c', borderRadius: '18px', padding: '0.5rem 0.75rem'
                    }}>
                      <span
                        onClick={() => { setViewAllCommentsPostId(null); navigate(`/profile/${comment.author?.id}`); }}
                        style={{ color: '#e4e6eb', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        {comment.author?.username || 'Unknown'}
                      </span>
                      <p style={{ margin: '0.15rem 0 0 0', color: '#e4e6eb', fontSize: '0.95rem', lineHeight: '1.3', whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                      </p>
                    </div>
                    {/* Like count badge */}
                    {likeCount > 0 && (
                      <div style={{
                        position: 'absolute', bottom: '-4px', right: '-8px',
                        background: '#3a3b3c', borderRadius: '10px', padding: '2px 6px',
                        display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem',
                        border: '2px solid #242526'
                      }}>
                        <span style={{ color: '#2078f4' }}>👍</span>
                        <span style={{ color: '#b0b3b8' }}>{likeCount}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', paddingLeft: '0.75rem' }}>
                    <span style={{ color: '#b0b3b8', fontSize: '0.75rem' }}>
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                    <span 
                      onClick={() => handleCommentLike(comment.id)}
                      style={{ 
                        color: isLiked ? '#2078f4' : '#b0b3b8', 
                        fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' 
                      }}
                    >
                      Like
                    </span>
                    <span 
                      onClick={() => setReplyingTo({ commentId: comment.id, username: comment.author?.username })}
                      style={{ color: '#b0b3b8', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Reply
                    </span>
                    {comment.authorId === userId && (
                      <>
                        {deleteCommentConfirm === comment.id ? (
                          <span style={{ fontSize: '0.75rem', color: '#b0b3b8' }}>
                            <span
                              onClick={async () => {
                                await handleDeleteComment(comment.id);
                                setDeleteCommentConfirm(null);
                              }}
                              style={{ color: '#f02849', cursor: 'pointer', fontWeight: '600' }}
                            >Delete</span>
                            {' · '}
                            <span
                              onClick={() => setDeleteCommentConfirm(null)}
                              style={{ cursor: 'pointer' }}
                            >Cancel</span>
                          </span>
                        ) : (
                          <FaTrash
                            onClick={() => setDeleteCommentConfirm(comment.id)}
                            style={{ fontSize: '0.7rem', color: '#b0b3b8', cursor: 'pointer' }}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Show replies toggle */}
                  {hasReplies && !isReply && (
                    <div 
                      onClick={() => toggleReplies(comment.id)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', 
                        marginTop: '0.5rem', paddingLeft: '0.75rem', cursor: 'pointer' 
                      }}
                    >
                      <div style={{ width: '24px', height: '1px', background: '#b0b3b8' }}></div>
                      <span style={{ color: '#b0b3b8', fontSize: '0.85rem', fontWeight: '600' }}>
                        {repliesExpanded ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Render replies if expanded */}
              {hasReplies && repliesExpanded && (
                <div style={{ marginTop: '0.5rem' }}>
                  {comment.replies.map(reply => renderComment(reply, true))}
                </div>
              )}
            </div>
          );
        };
        
        return (
          <div
            className="comments-overlay"
            onClick={() => { setViewAllCommentsPostId(null); setReplyingTo(null); }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <div
              className="comments-overlay-content"
              onClick={e => e.stopPropagation()}
              style={{
                background: '#242526', borderRadius: '8px', width: '100%', maxWidth: '550px', maxHeight: '85vh',
                display: 'flex', flexDirection: 'column', boxShadow: '0 12px 48px rgba(0,0,0,0.5)'
              }}
            >
              {/* Header */}
              <div style={{
                padding: '1rem', borderBottom: '1px solid #3a3b3c', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <h3 style={{ margin: 0, color: '#e4e6eb', fontSize: '1.25rem', fontWeight: '700' }}>
                  {post.author?.username || 'User'}'s Post
                </h3>
                <button
                  onClick={() => { setViewAllCommentsPostId(null); setReplyingTo(null); }}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                    background: '#3a3b3c', color: '#b0b3b8', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem'
                  }}
                >
                  <FaTimes />
                </button>
              </div>
              
              {/* Action bar */}
              <div style={{
                display: 'flex', padding: '0.5rem 1rem', borderBottom: '1px solid #3a3b3c', gap: '0.25rem'
              }}>
                <button 
                  onClick={() => handleLike(post.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
                    color: post.likes?.some(l => l.userId === userId) ? '#2078f4' : '#b0b3b8', 
                    cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
                  }}
                >
                  {post.likes?.some(l => l.userId === userId) ? <FaThumbsUp /> : <FaRegThumbsUp />} Like
                </button>
                <button style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
                  color: '#b0b3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
                }}>
                  <FaRegCommentDots /> Comment
                </button>
                <button 
                  onClick={() => { setShareModal(post.id); setLinkCopied(false); }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
                    color: '#b0b3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
                  }}>
                  <FaShare /> Share
                </button>
              </div>
              
              {/* Filter dropdown */}
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #3a3b3c' }}>
                <span style={{ color: '#b0b3b8', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                  Most relevant ▾
                </span>
              </div>
              
              {/* Comments list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
                {post.comments?.length > 0 ? post.comments.map(comment => renderComment(comment)) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#b0b3b8' }}>
                    <p style={{ margin: 0 }}>No comments yet.</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Be the first to comment!</p>
                  </div>
                )}
              </div>
              
              {/* Comment input */}
              <div style={{
                padding: '0.75rem 1rem', borderTop: '1px solid #3a3b3c',
                display: 'flex', flexDirection: 'column', gap: '0.5rem'
              }}>
                {/* Replying to indicator */}
                {replyingTo && (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#3a3b3c', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.85rem'
                  }}>
                    <span style={{ color: '#b0b3b8' }}>Replying to <strong style={{ color: '#e4e6eb' }}>{replyingTo.username}</strong></span>
                    <FaTimes 
                      onClick={() => setReplyingTo(null)} 
                      style={{ color: '#b0b3b8', cursor: 'pointer', fontSize: '0.9rem' }} 
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: userProfilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                  }}>
                    {userProfilePicture ? (
                      <img src={userProfilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>
                        {username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Write a comment..."}
                      rows={1}
                      style={{
                        width: '100%', padding: '0.6rem 2.5rem 0.6rem 1rem',
                        borderRadius: '20px', border: 'none', background: '#3a3b3c',
                        color: '#e4e6eb', fontSize: '0.95rem', outline: 'none',
                        resize: 'none', minHeight: '40px', maxHeight: '120px',
                        lineHeight: '1.4', boxSizing: 'border-box'
                      }}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                    />
                    {/* Send button */}
                    <button
                      onClick={handleSendComment}
                      disabled={!commentText.trim()}
                      style={{
                        position: 'absolute', right: '0.5rem', bottom: '0.5rem',
                        background: 'none', border: 'none', cursor: commentText.trim() ? 'pointer' : 'default',
                        color: commentText.trim() ? '#2078f4' : '#65676b', fontSize: '1.25rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0.25rem', transition: 'color 0.2s'
                      }}
                    >
                      <IoSend />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Delete Post Confirmation Modal */}
      {deletePostConfirm && (
        <div
          className="delete-confirm-overlay"
          onClick={() => setDeletePostConfirm(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e293b', borderRadius: '16px', padding: '2rem', minWidth: '300px', maxWidth: '400px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)', textAlign: 'center'
            }}
          >
            <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Delete Post?</h3>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Are you sure you want to delete this post? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setDeletePostConfirm(null)}
                style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', fontWeight: 'bold', cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={() => handleDeletePost(deletePostConfirm)}
                style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', fontWeight: 'bold', cursor: 'pointer' }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Share Modal */}
      {shareModal && (
        <div
          className="share-overlay"
          onClick={() => setShareModal(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 1002, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#242526', borderRadius: '12px', padding: '1.5rem', minWidth: '350px', maxWidth: '450px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#e4e6eb', fontSize: '1.25rem' }}>Share Post</h3>
              <button
                onClick={() => setShareModal(null)}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                  background: '#3a3b3c', color: '#b0b3b8', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <FaTimes />
              </button>
            </div>
            <p style={{ color: '#b0b3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Copy the link below to share this post:
            </p>
            <div style={{
              display: 'flex', gap: '0.5rem', background: '#3a3b3c', borderRadius: '8px', padding: '0.75rem',
              alignItems: 'center'
            }}>
              <FaLink style={{ color: '#b0b3b8', flexShrink: 0 }} />
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/post/${shareModal}`}
                style={{
                  flex: 1, background: 'transparent', border: 'none', color: '#e4e6eb',
                  fontSize: '0.9rem', outline: 'none'
                }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/post/${shareModal}`);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                style={{
                  background: linkCopied ? '#22c55e' : '#2078f4', color: '#fff', border: 'none',
                  borderRadius: '6px', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem',
                  transition: 'background 0.2s'
                }}
              >
                {linkCopied ? <><FaCheck /> Copied!</> : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Messages Button */}
      <button
        onClick={() => setMessagesOpen(true)}
        style={{
          position: 'fixed', bottom: '24px', left: '24px',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #2078f4 0%, #6366f1 100%)',
          border: 'none', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(32, 120, 244, 0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          zIndex: 100
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(32, 120, 244, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(32, 120, 244, 0.4)';
        }}
      >
        <IoChatbubbleEllipses style={{ fontSize: '1.75rem' }} />
      </button>

      {/* Messages Panel */}
      <MessagesPanel isOpen={messagesOpen} onClose={() => setMessagesOpen(false)} />
    </div>
  );
};

export default LandingPage;
