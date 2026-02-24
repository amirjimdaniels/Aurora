import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api/axios.js";
import { FaRegThumbsUp, FaThumbsUp, FaRegCommentDots, FaBookmark, FaRegBookmark, FaShare, FaTrash, FaTimes, FaArrowLeft } from "react-icons/fa";
import { IoSend } from "react-icons/io5";

const PostView = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [deleteCommentConfirm, setDeleteCommentConfirm] = useState(null);
  const [userProfilePicture, setUserProfilePicture] = useState(null);

  const userId = Number(localStorage.getItem('userId'));
  const username = localStorage.getItem('username') || 'User';

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`/api/posts/${postId}`);
        setPost(response.data);
      } catch (err) {
        setError("Post not found");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (userId) {
        try {
          const response = await axios.get(`/api/users/${userId}`);
          setUserProfilePicture(response.data.profilePicture);
        } catch (err) {}
      }
    };
    fetchUserProfile();
  }, [userId]);

  const handleLike = async () => {
    if (!userId) return;
    await axios.post(`/api/posts/${post.id}/like`, { userId });
    const updated = await axios.get(`/api/posts/${postId}`);
    setPost(updated.data);
  };

  const handleSave = async () => {
    if (!userId) return;
    await axios.post(`/api/savedPosts/${post.id}/save`, { userId });
    const updated = await axios.get(`/api/posts/${postId}`);
    setPost(updated.data);
  };

  const handleCommentLike = async (commentId) => {
    await axios.post(`/api/comments/${commentId}/like`, { userId });
    const updated = await axios.get(`/api/posts/${postId}`);
    setPost(updated.data);
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
    const updated = await axios.get(`/api/posts/${postId}`);
    setPost(updated.data);
  };

  const handleDeleteComment = async (commentId) => {
    await axios.delete(`/api/comments/${commentId}`, { data: { userId } });
    setDeleteCommentConfirm(null);
    const updated = await axios.get(`/api/posts/${postId}`);
    setPost(updated.data);
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#18191a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#b0b3b8' }}>Loading...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: '100vh', background: '#18191a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: '#e4e6eb', fontSize: '1.5rem' }}>Post not found</p>
        <button
          onClick={() => navigate('/')}
          style={{ background: '#2078f4', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', fontWeight: '600', cursor: 'pointer' }}
        >
          Go Home
        </button>
      </div>
    );
  }

  const renderComment = (comment, isReply = false) => {
    const isLiked = comment.likes?.some(like => like.userId === userId);
    const likeCount = comment.likes?.length || 0;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const repliesExpanded = expandedReplies[comment.id];

    return (
      <div key={comment.id} style={{ marginLeft: isReply ? '2.5rem' : 0, marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div
            onClick={() => navigate(`/profile/${comment.author?.id}`)}
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

          <div style={{ flex: 1 }}>
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
              <div style={{ background: '#3a3b3c', borderRadius: '18px', padding: '0.5rem 0.75rem' }}>
                <span
                  onClick={() => navigate(`/profile/${comment.author?.id}`)}
                  style={{ color: '#e4e6eb', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {comment.author?.username || 'Unknown'}
                </span>
                <p style={{ margin: '0.15rem 0 0 0', color: '#e4e6eb', fontSize: '0.95rem', lineHeight: '1.3', whiteSpace: 'pre-wrap' }}>
                  {comment.content}
                </p>
              </div>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', paddingLeft: '0.75rem' }}>
              <span style={{ color: '#b0b3b8', fontSize: '0.75rem' }}>{formatTimeAgo(comment.createdAt)}</span>
              <span
                onClick={() => handleCommentLike(comment.id)}
                style={{ color: isLiked ? '#2078f4' : '#b0b3b8', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
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
                      <span onClick={() => handleDeleteComment(comment.id)} style={{ color: '#f02849', cursor: 'pointer', fontWeight: '600' }}>Delete</span>
                      {' · '}
                      <span onClick={() => setDeleteCommentConfirm(null)} style={{ cursor: 'pointer' }}>Cancel</span>
                    </span>
                  ) : (
                    <FaTrash onClick={() => setDeleteCommentConfirm(comment.id)} style={{ fontSize: '0.7rem', color: '#b0b3b8', cursor: 'pointer' }} />
                  )}
                </>
              )}
            </div>

            {hasReplies && !isReply && (
              <div onClick={() => toggleReplies(comment.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', paddingLeft: '0.75rem', cursor: 'pointer' }}>
                <div style={{ width: '24px', height: '1px', background: '#b0b3b8' }}></div>
                <span style={{ color: '#b0b3b8', fontSize: '0.85rem', fontWeight: '600' }}>
                  {repliesExpanded ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </span>
              </div>
            )}
          </div>
        </div>

        {hasReplies && repliesExpanded && (
          <div style={{ marginTop: '0.5rem' }}>
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  const isLiked = post.likes?.some(l => l.userId === userId);
  const isSaved = post.savedBy?.some(s => s.userId === userId);

  return (
    <div style={{ minHeight: '100vh', background: '#18191a', padding: '100px 1rem 2rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none',
            color: '#b0b3b8', cursor: 'pointer', marginBottom: '1rem', fontSize: '1rem'
          }}
        >
          <FaArrowLeft /> Back to Feed
        </button>

        {/* Post card */}
        <div style={{ background: '#242526', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Author header */}
          <div style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div
              onClick={() => navigate(`/profile/${post.author?.id}`)}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
                background: post.author?.profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
              }}
            >
              {post.author?.profilePicture ? (
                <img src={post.author.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#fff', fontWeight: '600' }}>{post.author?.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p
                onClick={() => navigate(`/profile/${post.author?.id}`)}
                style={{ margin: 0, color: '#e4e6eb', fontWeight: '600', cursor: 'pointer' }}
              >
                {post.author?.username}
              </p>
              <p style={{ margin: 0, color: '#b0b3b8', fontSize: '0.8rem' }}>{formatTimeAgo(post.createdAt)}</p>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '0 1rem 1rem' }}>
            <p style={{ color: '#e4e6eb', margin: 0, fontSize: '1rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{post.content}</p>
          </div>

          {/* Media */}
          {post.mediaUrl && (
            <div style={{ width: '100%' }}>
              <img src={post.mediaUrl} alt="" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} />
            </div>
          )}

          {/* Stats */}
          <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #3a3b3c' }}>
            <span style={{ color: '#b0b3b8', fontSize: '0.9rem' }}>
              {post.likes?.length > 0 && `👍 ${post.likes.length}`}
            </span>
            <span style={{ color: '#b0b3b8', fontSize: '0.9rem' }}>
              {post.comments?.length > 0 && `${post.comments.length} comments`}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', padding: '0.5rem', borderBottom: '1px solid #3a3b3c' }}>
            <button onClick={handleLike} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
              color: isLiked ? '#2078f4' : '#b0b3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
            }}>
              {isLiked ? <FaThumbsUp /> : <FaRegThumbsUp />} Like
            </button>
            <button style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
              color: '#b0b3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
            }}>
              <FaRegCommentDots /> Comment
            </button>
            <button onClick={handleSave} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
              color: isSaved ? '#2078f4' : '#b0b3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
            }}>
              {isSaved ? <FaBookmark /> : <FaRegBookmark />} Save
            </button>
          </div>

          {/* Comments section */}
          <div style={{ padding: '1rem' }}>
            {post.comments?.length > 0 ? (
              post.comments.map(comment => renderComment(comment))
            ) : (
              <p style={{ color: '#b0b3b8', textAlign: 'center', padding: '1rem' }}>No comments yet. Be the first to comment!</p>
            )}
          </div>

          {/* Comment input */}
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #3a3b3c', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {replyingTo && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#3a3b3c', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.85rem'
              }}>
                <span style={{ color: '#b0b3b8' }}>Replying to <strong style={{ color: '#e4e6eb' }}>{replyingTo.username}</strong></span>
                <FaTimes onClick={() => setReplyingTo(null)} style={{ color: '#b0b3b8', cursor: 'pointer', fontSize: '0.9rem' }} />
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
                  <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>{username.charAt(0).toUpperCase()}</span>
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
    </div>
  );
};

export default PostView;
