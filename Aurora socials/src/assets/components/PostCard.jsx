import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios.js";
import { 
  FaRegThumbsUp, FaThumbsUp, FaRegCommentDots, FaBookmark, 
  FaShare, FaTrash, FaTimes, FaLink, FaCheck, FaReply 
} from "react-icons/fa";
import { IoSend } from "react-icons/io5";

/**
 * Reusable PostCard component
 * 
 * Props:
 * - post: The post object with author, likes, comments, etc.
 * - currentUserId: The logged-in user's ID
 * - onPostUpdate: Callback to refresh posts after an action
 * - showDeleteButton: Whether to show delete button (for own posts)
 * - compact: If true, shows a smaller version for profile grids
 */
const PostCard = ({ post, currentUserId, onPostUpdate, showDeleteButton = true, compact = false }) => {
  const navigate = useNavigate();
  const [showPostModal, setShowPostModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [localPost, setLocalPost] = useState(post);

  // Sync with prop changes
  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  const likedByUser = localPost.likes?.some(like => like.userId === currentUserId);
  const savedByUser = localPost.savedBy?.some(save => save.userId === currentUserId);
  const isOwnPost = localPost.authorId === currentUserId || localPost.author?.id === currentUserId;

  // Refresh this specific post
  const refreshPost = async () => {
    try {
      const response = await axios.get(`/api/posts/${localPost.id}`);
      setLocalPost(response.data);
      if (onPostUpdate) onPostUpdate();
    } catch (err) {
      console.error("Failed to refresh post", err);
    }
  };

  // Like handler
  const handleLike = async () => {
    if (!currentUserId) return;
    try {
      await axios.post(`/api/posts/${localPost.id}/like`, { userId: currentUserId });
      refreshPost();
    } catch (err) {}
  };

  // Save handler
  const handleSave = async () => {
    if (!currentUserId) return;
    try {
      await axios.post(`/api/savedPosts/${localPost.id}/save`, { userId: currentUserId });
      refreshPost();
    } catch (err) {}
  };

  // Delete handler
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/posts/${localPost.id}`);
      setShowDeleteConfirm(false);
      if (onPostUpdate) onPostUpdate();
    } catch (err) {}
  };

  // Comment handler
  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !currentUserId) return;
    try {
      await axios.post(`/api/comments/${localPost.id}/comment`, {
        userId: currentUserId,
        content: commentText
      });
      setCommentText('');
      refreshPost();
    } catch (err) {}
  };

  // Reply handler
  const handleReplySubmit = async (parentId) => {
    if (!replyText.trim() || !currentUserId) return;
    try {
      await axios.post(`/api/comments/${localPost.id}/comment`, {
        userId: currentUserId,
        content: replyText,
        parentId
      });
      setReplyText('');
      setReplyingTo(null);
      refreshPost();
    } catch (err) {}
  };

  // Comment like handler
  const handleCommentLike = async (commentId) => {
    if (!currentUserId) return;
    try {
      await axios.post(`/api/comments/${commentId}/like`, { userId: currentUserId });
      refreshPost();
    } catch (err) {}
  };

  // Render a single comment with replies
  const renderComment = (comment, depth = 0) => (
    <div key={comment.id} style={{ marginLeft: depth > 0 ? '2rem' : 0, marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div 
          onClick={() => navigate(`/profile/${comment.user?.id}`)}
          style={{
            width: '32px', height: '32px', borderRadius: '50%', background: '#3a3b3c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', cursor: 'pointer', flexShrink: 0
          }}
        >
          {comment.user?.profilePicture ? (
            <img src={comment.user.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#e4e6eb', fontSize: '0.8rem' }}>{comment.user?.username?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ background: '#3a3b3c', borderRadius: '18px', padding: '0.5rem 0.75rem', display: 'inline-block', maxWidth: '100%' }}>
            <div 
              onClick={() => navigate(`/profile/${comment.user?.id}`)}
              style={{ fontWeight: '600', color: '#e4e6eb', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              {comment.user?.username}
            </div>
            <div style={{ color: '#e4e6eb', fontSize: '0.9rem' }}>{comment.content}</div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
            <span 
              onClick={() => handleCommentLike(comment.id)}
              style={{ color: comment.likes?.some(l => l.userId === currentUserId) ? '#2078f4' : '#b0b3b8', cursor: 'pointer', fontWeight: '600' }}
            >
              Like {comment.likes?.length > 0 && `(${comment.likes.length})`}
            </span>
            <span 
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              style={{ color: '#b0b3b8', cursor: 'pointer', fontWeight: '600' }}
            >
              Reply
            </span>
            <span style={{ color: '#65676b' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>
          {replyingTo === comment.id && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.user?.username}...`}
                style={{
                  flex: 1, background: '#3a3b3c', border: 'none', borderRadius: '18px',
                  padding: '0.5rem 0.75rem', color: '#e4e6eb', fontSize: '0.85rem', outline: 'none'
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(comment.id)}
              />
            </div>
          )}
        </div>
      </div>
      {comment.replies?.map(reply => renderComment(reply, depth + 1))}
    </div>
  );

  const author = localPost.author || {};

  return (
    <>
      {/* Post Card */}
      <div className="post-card" style={{ background: '#1e293b', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
        {/* Post Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div
            onClick={() => navigate(`/profile/${author.id}`)}
            style={{
              width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer',
              background: author.profilePicture ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0
            }}
          >
            {author.profilePicture ? (
              <img src={author.profilePicture} alt={author.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#fff', fontWeight: '600', fontSize: '1.1rem' }}>
                {(author.username || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div
              onClick={() => navigate(`/profile/${author.id}`)}
              style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}
            >
              {author.username || "Unknown"}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
              {new Date(localPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(localPost.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Post Content - Clickable to open modal */}
        <div 
          onClick={() => setShowPostModal(true)}
          style={{ color: '#f1f5f9', fontSize: '1rem', lineHeight: '1.5', marginBottom: '0.75rem', whiteSpace: 'pre-wrap', cursor: 'pointer' }}
        >
          {localPost.content}
        </div>

        {/* Media - Clickable to open modal */}
        {localPost.mediaUrl && localPost.mediaUrl.trim() !== "" && (
          <div 
            onClick={() => setShowPostModal(true)}
            style={{ marginBottom: '0.75rem', marginLeft: '-1rem', marginRight: '-1rem', cursor: 'pointer' }}
          >
            <img src={localPost.mediaUrl} alt="Post media" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} />
          </div>
        )}

        {/* Reaction counts */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #334155', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', gap: '1rem' }}>
          <span>{localPost.likes?.length || 0} likes</span>
          <span 
            style={{ marginLeft: 'auto', cursor: 'pointer' }}
            onClick={() => setShowPostModal(true)}
            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
            onMouseLeave={e => e.target.style.textDecoration = 'none'}
          >
            {localPost.comments?.length || 0} comments
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleLike}
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
              onClick={() => setShowPostModal(true)}
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
              onClick={handleSave}
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
              onClick={() => { setShowShareModal(true); setLinkCopied(false); }}
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
          {showDeleteButton && isOwnPost && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                color: '#6b7280', padding: '0.5rem 0.75rem',
                borderRadius: '6px', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}
            >
              <FaTrash />
            </button>
          )}
        </div>
      </div>

      {/* Post Modal */}
      {showPostModal && (
        <div 
          onClick={() => { setShowPostModal(false); setReplyingTo(null); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#242526', borderRadius: '12px', width: '600px', maxWidth: '95vw',
              maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1rem', borderBottom: '1px solid #3a3b3c',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, color: '#e4e6eb', fontSize: '1.25rem' }}>{author.username}'s Post</h3>
              <button
                onClick={() => { setShowPostModal(false); setReplyingTo(null); }}
                style={{
                  background: '#3a3b3c', border: 'none', color: '#e4e6eb',
                  width: '36px', height: '36px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Post Content */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #3a3b3c' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: '#3a3b3c',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {author.profilePicture ? (
                    <img src={author.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#e4e6eb' }}>{(author.username || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#e4e6eb' }}>{author.username}</div>
                  <div style={{ fontSize: '0.8rem', color: '#b0b3b8' }}>{new Date(localPost.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ color: '#e4e6eb', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>{localPost.content}</div>
              {localPost.mediaUrl && localPost.mediaUrl.trim() !== "" && (
                <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <img src={localPost.mediaUrl} alt="" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', color: '#b0b3b8', fontSize: '0.9rem' }}>
                <span>{localPost.likes?.length || 0} likes</span>
                <span>{localPost.comments?.length || 0} comments</span>
              </div>
            </div>

            {/* Action bar */}
            <div style={{
              display: 'flex', padding: '0.5rem 1rem', borderBottom: '1px solid #3a3b3c', gap: '0.25rem'
            }}>
              <button 
                onClick={handleLike}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
                  color: likedByUser ? '#2078f4' : '#b0b3b8', 
                  cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
                }}
              >
                {likedByUser ? <FaThumbsUp /> : <FaRegThumbsUp />} Like
              </button>
              <button style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
                color: '#b0b3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
              }}>
                <FaRegCommentDots /> Comment
              </button>
              <button 
                onClick={() => { setShowShareModal(true); setLinkCopied(false); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
                  color: '#b0b3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
                }}>
                <FaShare /> Share
              </button>
            </div>

            {/* Comments list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem', maxHeight: '300px' }}>
              {localPost.comments?.length > 0 ? localPost.comments.map(comment => renderComment(comment)) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#b0b3b8' }}>
                  <p style={{ margin: 0 }}>No comments yet.</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Be the first to comment!</p>
                </div>
              )}
            </div>

            {/* Comment input */}
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #3a3b3c', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', background: '#3a3b3c',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0
              }}>
                {author.profilePicture ? (
                  <img src={author.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#e4e6eb', fontSize: '0.8rem' }}>{(author.username || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                style={{
                  flex: 1, background: '#3a3b3c', border: 'none', borderRadius: '20px',
                  padding: '0.6rem 1rem', color: '#e4e6eb', fontSize: '0.95rem', outline: 'none'
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
              />
              {commentText.trim() && (
                <button
                  onClick={handleCommentSubmit}
                  style={{
                    background: '#2563eb', border: 'none', borderRadius: '50%',
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0, color: '#fff', fontSize: '1rem'
                  }}
                >
                  <IoSend />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div 
          onClick={() => setShowShareModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#242526', borderRadius: '12px', width: '400px', maxWidth: '90vw',
              padding: '0', overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '1rem', borderBottom: '1px solid #3a3b3c',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, color: '#e4e6eb', fontSize: '1.25rem' }}>Share Post</h3>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  background: '#3a3b3c', border: 'none', color: '#e4e6eb',
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#b0b3b8', margin: '0 0 1rem 0' }}>
                Copy the link below to share this post:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/post/${localPost.id}`}
                  style={{
                    flex: 1, background: '#3a3b3c', border: 'none', borderRadius: '8px',
                    padding: '0.75rem', color: '#e4e6eb', fontSize: '0.9rem'
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/post/${localPost.id}`);
                    setLinkCopied(true);
                  }}
                  style={{
                    background: linkCopied ? '#22c55e' : '#2563eb', border: 'none', borderRadius: '8px',
                    padding: '0.75rem 1rem', color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600'
                  }}
                >
                  {linkCopied ? <FaCheck /> : <FaLink />}
                  {linkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          onClick={() => setShowDeleteConfirm(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#242526', borderRadius: '12px', width: '400px', maxWidth: '90vw',
              padding: '1.5rem', textAlign: 'center'
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', color: '#e4e6eb' }}>Delete Post?</h3>
            <p style={{ color: '#b0b3b8', margin: '0 0 1.5rem 0' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '0.75rem 1.5rem', background: '#3a3b3c', border: 'none',
                  borderRadius: '8px', color: '#e4e6eb', cursor: 'pointer', fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '0.75rem 1.5rem', background: '#ef4444', border: 'none',
                  borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '600'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostCard;
