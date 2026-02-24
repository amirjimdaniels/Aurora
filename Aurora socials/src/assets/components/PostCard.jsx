import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios.js";
import {
  FaRegThumbsUp, FaThumbsUp, FaRegCommentDots, FaBookmark,
  FaShare, FaTrash, FaTimes, FaLink, FaCheck, FaReply, FaSmile,
  FaHashtag, FaFlag, FaExclamationTriangle
} from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { sanitizeText } from "../../utils/sanitize.js";

/**
 * Reusable PostCard component
 * 
 * Props:
 * - post: The post object with author, likes, comments, etc.
 * - currentUserId: The logged-in user's ID
 * - currentUserProfile: The logged-in user's profile picture URL
 * - currentUsername: The logged-in user's username
 * - onPostUpdate: Callback to refresh posts after an action
 * - showDeleteButton: Whether to show delete button (for own posts)
 * - compact: If true, shows a smaller version for profile grids
 * - onHashtagClick: Callback when a hashtag is clicked
 */
const isVideo = (url) => {
  if (!url) return false;
  if (url.startsWith('data:video/')) return true;
  return /\.(mp4|webm|mov|quicktime)(\?.*)?$/i.test(url);
};

const PostCard = ({ post, currentUserId, currentUserProfile, currentUsername, onPostUpdate, showDeleteButton = true, compact = false, onHashtagClick }) => {
  const navigate = useNavigate();
  const [showPostModal, setShowPostModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [localPost, setLocalPost] = useState(post);
  const [votingOption, setVotingOption] = useState(null);

  // Sync with prop changes
  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  const likedByUser = localPost.likes?.some(like => like.userId === currentUserId);
  const savedByUser = localPost.savedBy?.some(save => save.userId === currentUserId);
  const isOwnPost = localPost.authorId === currentUserId || localPost.author?.id === currentUserId;

  // Poll voting
  const poll = localPost.poll;
  const userVote = poll?.options?.find(opt => opt.votes?.some(v => v.userId === currentUserId));
  const totalVotes = poll?.options?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;

  const handlePollVote = async (optionId) => {
    if (!currentUserId || votingOption) return;
    setVotingOption(optionId);
    try {
      await axios.post(`/api/polls/${poll.id}/vote`, {
        userId: currentUserId,
        optionId
      });
      if (onPostUpdate) onPostUpdate();
    } catch (err) {
      console.error('Vote error:', err);
    } finally {
      setVotingOption(null);
    }
  };

  // Reactions data
  const reactions = [
    { emoji: "😊", label: "happy", category: "emotion" },
    { emoji: "😍", label: "loved", category: "emotion" },
    { emoji: "🔥", label: "fire", category: "expression" },
    { emoji: "👏", label: "clapping", category: "gesture" },
    { emoji: "😢", label: "sad", category: "emotion" },
    { emoji: "😡", label: "angry", category: "emotion" },
    { emoji: "🎉", label: "celebrate", category: "expression" },
    { emoji: "💯", label: "100", category: "expression" }
  ];

  // Extract feeling from content (e.g., "— feeling 😍 loved")
  const extractFeeling = (content) => {
    if (!content) return { mainContent: '', feeling: null };
    const feelingPattern = /\n\n— (feeling|eating|celebrating|watching|playing|listening to|doing) (.+)$/u;
    const match = content.match(feelingPattern);
    if (match) {
      return {
        mainContent: content.replace(match[0], ''),
        feeling: { type: match[1], text: match[2] }
      };
    }
    return { mainContent: content, feeling: null };
  };

  // Extract hashtags from content
  const extractHashtags = (content) => {
    if (!content) return [];
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? [...new Set(matches)] : [];
  };

  // Render content with hashtags removed (they're shown separately)
  const renderContentWithHashtags = (content) => {
    if (!content) return null;
    // Sanitize content to prevent XSS attacks
    const sanitized = sanitizeText(content);
    // Remove hashtags from the content - they'll be displayed separately
    return sanitized.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
  };

  // Get reaction summary for display
  const getReactionSummary = (reactions) => {
    if (!reactions || reactions.length === 0) return [];
    const reactionCounts = reactions.reduce((acc, reaction) => {
      const key = reaction.emoji;
      if (!acc[key]) {
        acc[key] = { emoji: reaction.emoji, label: reaction.label, count: 0, users: [] };
      }
      acc[key].count++;
      acc[key].users.push(reaction.user?.username || 'User');
      return acc;
    }, {});
    return Object.values(reactionCounts).sort((a, b) => b.count - a.count).slice(0, 4);
  };

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
  const handleLike = async (e) => {
    if (e) e.stopPropagation();
    if (!currentUserId) return;
    try {
      await axios.post(`/api/posts/${localPost.id}/like`, { userId: currentUserId });
      refreshPost();
    } catch (err) {}
  };

  // Save handler
  const handleSave = async (e) => {
    if (e) e.stopPropagation();
    if (!currentUserId) return;
    try {
      await axios.post(`/api/savedPosts/${localPost.id}/save`, { userId: currentUserId });
      refreshPost();
    } catch (err) {}
  };

  // React handler
  const handleReact = async (emoji, label, category) => {
    if (!currentUserId) return;
    try {
      await axios.post(`/api/posts/${localPost.id}/react`, { userId: currentUserId, emoji, label, category });
      setShowReactionPicker(false);
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

  // Report handler
  const handleReport = async () => {
    if (!reportCategory || !currentUserId) return;
    setReportSubmitting(true);
    try {
      await axios.post(`/api/reports/post/${localPost.id}`, {
        userId: currentUserId,
        category: reportCategory,
        description: reportDescription
      });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportCategory('');
        setReportDescription('');
        setReportSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setReportSubmitting(false);
    }
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

  // Comment delete handler
  const handleCommentDelete = async (commentId) => {
    if (!currentUserId) return;
    try {
      await axios.delete(`/api/comments/${commentId}`, { data: { userId: currentUserId } });
      refreshPost();
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  // Render a single comment with replies
  const renderComment = (comment, depth = 0) => (
    <div key={comment.id} style={{ marginLeft: depth > 0 ? '2rem' : 0, marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div 
          onClick={() => navigate(`/profile/${comment.author?.id}`)}
          style={{
            width: '32px', height: '32px', borderRadius: '50%', 
            background: comment.author?.profilePicture ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', cursor: 'pointer', flexShrink: 0
          }}
        >
          {comment.author?.profilePicture ? (
            <img src={comment.author.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>{comment.author?.username?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ background: '#3a3b3c', borderRadius: '18px', padding: '0.5rem 0.75rem', display: 'inline-block', maxWidth: '100%' }}>
            <div 
              onClick={() => navigate(`/profile/${comment.author?.id}`)}
              style={{ fontWeight: '600', color: '#e4e6eb', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              {comment.author?.username}
            </div>
            <div style={{ color: '#e4e6eb', fontSize: '0.9rem' }}>{sanitizeText(comment.content)}</div>
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
            {comment.author?.id === currentUserId && (
              <span 
                onClick={() => handleCommentDelete(comment.id)}
                style={{ color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Delete comment"
              >
                <FaTrash size={12} />
              </span>
            )}
          </div>
          {replyingTo === comment.id && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.author?.username}...`}
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
  const { mainContent, feeling } = extractFeeling(localPost.content);
  const hashtags = extractHashtags(mainContent);
  const reactionSummary = getReactionSummary(localPost.reactions);

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
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
              <span
                onClick={() => navigate(`/profile/${author.id}`)}
                style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                onMouseLeave={e => e.target.style.textDecoration = 'none'}
              >
                {author.username || "Unknown"}
              </span>
              {feeling && (
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  is {feeling.type} {feeling.text}
                </span>
              )}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
              {new Date(localPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(localPost.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
          
          {/* Reactions display in header */}
          {reactionSummary.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: 'rgba(51, 65, 85, 0.5)',
              borderRadius: '16px',
              padding: '4px 8px',
              flexShrink: 0
            }}>
              {reactionSummary.map((reaction, idx) => (
                <div
                  key={idx}
                  style={{ display: 'flex', alignItems: 'center' }}
                  title={`${reaction.count} ${reaction.label}`}
                >
                  <span style={{ fontSize: '0.85rem' }}>{reaction.emoji}</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600', marginLeft: '1px' }}>
                    {reaction.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Content with highlighted hashtags */}
        <div 
          onClick={() => setShowPostModal(true)}
          style={{ color: '#f1f5f9', fontSize: '1rem', lineHeight: '1.5', marginBottom: '0.75rem', whiteSpace: 'pre-wrap', cursor: 'pointer' }}
        >
          {renderContentWithHashtags(mainContent)}
        </div>

        {/* Hashtags row */}
        {hashtags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {hashtags.map((tag, idx) => (
              <span
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onHashtagClick) onHashtagClick(tag.slice(1));
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(56, 189, 248, 0.2)'}
                onMouseLeave={e => e.target.style.background = 'rgba(56, 189, 248, 0.1)'}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Poll Display */}
        {poll && (
          <div style={{ 
            marginBottom: '0.75rem', padding: '0.75rem',
            background: '#1e293b', borderRadius: '12px'
          }}>
            <div style={{ fontWeight: '600', color: '#e2e8f0', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              {poll.question || 'Poll'}
            </div>
            {poll.options?.map(option => {
              const votes = option.votes?.length || 0;
              const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const isVoted = userVote?.id === option.id;
              const hasVoted = !!userVote;
              
              return (
                <div
                  key={option.id}
                  onClick={() => !hasVoted && handlePollVote(option.id)}
                  style={{
                    position: 'relative',
                    marginBottom: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: isVoted ? '2px solid #38bdf8' : '1px solid #334155',
                    cursor: hasVoted ? 'default' : 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => !hasVoted && (e.currentTarget.style.borderColor = '#38bdf8')}
                  onMouseLeave={e => !hasVoted && !isVoted && (e.currentTarget.style.borderColor = '#334155')}
                >
                  {hasVoted && (
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${percentage}%`,
                      background: isVoted ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                      transition: 'width 0.3s'
                    }} />
                  )}
                  <div style={{ 
                    position: 'relative', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', color: '#e2e8f0', fontSize: '0.9rem'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {votingOption === option.id && (
                        <span style={{ width: '12px', height: '12px', border: '2px solid #38bdf8', borderTop: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      )}
                      {option.text}
                      {isVoted && <FaCheck style={{ color: '#38bdf8', fontSize: '0.75rem' }} />}
                    </span>
                    {hasVoted && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{percentage}%</span>}
                  </div>
                </div>
              );
            })}
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              {totalVotes} vote{totalVotes !== 1 && 's'}
            </div>
          </div>
        )}

        {/* Media - Clickable to open modal */}
        {localPost.mediaUrl && localPost.mediaUrl.trim() !== "" && (
          <div
            onClick={(e) => { if (e.target.tagName !== 'VIDEO') setShowPostModal(true); }}
            style={{ marginBottom: '0.75rem', marginLeft: '-1rem', marginRight: '-1rem', cursor: 'pointer' }}
          >
            {isVideo(localPost.mediaUrl) ? (
              <video src={localPost.mediaUrl} controls preload="metadata" style={{ width: '100%', maxHeight: '500px' }} />
            ) : (
              <img src={localPost.mediaUrl} alt="Post media" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} />
            )}
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
              {likedByUser ? <FaThumbsUp size={16} /> : <FaRegThumbsUp size={16} />}
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
              <FaRegCommentDots size={16} />
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
              <FaBookmark size={16} />
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Save</span>
            </button>
            {/* React button with picker */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  color: '#f59e0b', padding: '0.5rem 0.75rem',
                  borderRadius: '6px', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <FaSmile size={16} />
                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>React</span>
              </button>
              {showReactionPicker && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#1e293b',
                  borderRadius: '24px',
                  padding: '0.5rem',
                  display: 'flex',
                  gap: '0.25rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  marginBottom: '8px',
                  zIndex: 100
                }}>
                  {reactions.map((r, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleReact(r.emoji, r.label, r.category)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        padding: '0.25rem',
                        transition: 'transform 0.15s'
                      }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.3)'}
                      onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                      title={r.label}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
              <FaShare size={16} />
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
              <FaTrash size={14} />
            </button>
          )}
          {!isOwnPost && (
            <button
              onClick={() => setShowReportModal(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                color: '#6b7280', padding: '0.5rem 0.75rem',
                borderRadius: '6px', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = '#f59e0b'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}
              title="Report this post"
            >
              <FaFlag size={14} />
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
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#242526', borderRadius: '12px', width: '600px', maxWidth: '95vw',
              height: '85vh', maxHeight: '700px', display: 'flex', flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header - STICKY */}
            <div style={{
              padding: '1rem', borderBottom: '1px solid #3a3b3c',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0, background: '#242526'
            }}>
              <h3 style={{ margin: 0, color: '#e4e6eb', fontSize: '1.25rem' }}>{author.username}'s Post</h3>
              <button
                onClick={() => { setShowPostModal(false); setReplyingTo(null); }}
                style={{
                  background: '#3a3b3c', border: 'none', color: '#e4e6eb',
                  width: '36px', height: '36px', borderRadius: '50%', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <FaTimes size={18} color="#e4e6eb" />
              </button>
            </div>

            {/* Scrollable Content Area - Post + Comments */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {/* Post Content */}
              <div style={{ padding: '1rem', borderBottom: '1px solid #3a3b3c' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', 
                  background: author.profilePicture ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {author.profilePicture ? (
                    <img src={author.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{(author.username || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '600', color: '#e4e6eb' }}>{author.username}</span>
                    {feeling && (
                      <span style={{ color: '#b0b3b8', fontSize: '0.9rem' }}>
                        is {feeling.type} {feeling.text}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#b0b3b8' }}>{new Date(localPost.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ color: '#e4e6eb', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>
                {renderContentWithHashtags(mainContent)}
              </div>
              {hashtags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      onClick={() => { setShowPostModal(false); if (onHashtagClick) onHashtagClick(tag.slice(1)); }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {localPost.mediaUrl && localPost.mediaUrl.trim() !== "" && (
                <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  {isVideo(localPost.mediaUrl) ? (
                    <video src={localPost.mediaUrl} controls preload="metadata" style={{ width: '100%', maxHeight: '400px' }} />
                  ) : (
                    <img src={localPost.mediaUrl} alt="" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                  )}
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
                {likedByUser ? <FaThumbsUp size={16} /> : <FaRegThumbsUp size={16} />} Like
              </button>
              <button style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
                color: '#b0b3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
              }}>
                <FaRegCommentDots size={16} /> Comment
              </button>
              <button 
                onClick={() => { setShowShareModal(true); setLinkCopied(false); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
                  color: '#b0b3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
                }}>
                <FaShare size={16} /> Share
              </button>
            </div>

              {/* Comments list - inside scrollable area */}
              <div style={{ padding: '0.75rem 1rem', minHeight: '150px' }}>
                {localPost.comments?.length > 0 ? localPost.comments.map(comment => renderComment(comment)) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#b0b3b8' }}>
                    <p style={{ margin: 0 }}>No comments yet.</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comment input - STICKY at bottom */}
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #3a3b3c', display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, background: '#242526' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', 
                background: currentUserProfile ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0
              }}>
                {currentUserProfile ? (
                  <img src={currentUserProfile} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>{(currentUsername || 'U').charAt(0).toUpperCase()}</span>
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
                    cursor: 'pointer', flexShrink: 0, color: '#fff'
                  }}
                >
                  <IoSend size={16} color="#fff" />
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
                <FaTimes size={16} color="#e4e6eb" />
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
                  {linkCopied ? <FaCheck size={16} color="#fff" /> : <FaLink size={16} color="#fff" />}
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

      {/* Report Modal */}
      {showReportModal && (
        <div
          onClick={() => { setShowReportModal(false); setReportCategory(''); setReportDescription(''); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 1001,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
              padding: '1.75rem', borderRadius: '16px',
              maxWidth: '450px', width: '90%',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            {reportSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <FaCheck style={{ fontSize: '1.5rem', color: '#fff' }} />
                </div>
                <h3 style={{ color: '#e2e8f0', margin: '0 0 0.5rem 0' }}>Report Submitted</h3>
                <p style={{ color: '#94a3b8', margin: 0 }}>Thank you for helping keep Aurora safe.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <FaExclamationTriangle style={{ color: '#f59e0b', fontSize: '1.1rem' }} />
                  </div>
                  <div>
                    <h3 style={{ color: '#e2e8f0', margin: 0 }}>Report Post</h3>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>Help us understand the issue</p>
                  </div>
                  <button
                    onClick={() => { setShowReportModal(false); setReportCategory(''); setReportDescription(''); }}
                    style={{
                      marginLeft: 'auto', background: 'none', border: 'none',
                      color: '#64748b', cursor: 'pointer', padding: '0.5rem'
                    }}
                  >
                    <FaTimes size={18} color="#64748b" />
                  </button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>
                    Why are you reporting this?
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { value: 'spam', label: 'Spam or misleading', icon: '📧' },
                      { value: 'harassment', label: 'Harassment or bullying', icon: '😠' },
                      { value: 'hate', label: 'Hate speech or symbols', icon: '🚫' },
                      { value: 'violence', label: 'Violence or threats', icon: '⚠️' },
                      { value: 'nudity', label: 'Nudity or sexual content', icon: '🔞' },
                      { value: 'misinformation', label: 'False information', icon: '❌' },
                      { value: 'other', label: 'Something else', icon: '📝' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setReportCategory(option.value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.875rem 1rem', borderRadius: '10px',
                          background: reportCategory === option.value 
                            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
                            : 'rgba(30, 41, 59, 0.5)',
                          border: reportCategory === option.value 
                            ? '1px solid rgba(139, 92, 246, 0.4)'
                            : '1px solid rgba(51, 65, 85, 0.5)',
                          color: '#e2e8f0', cursor: 'pointer',
                          textAlign: 'left', transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>{option.icon}</span>
                        <span style={{ fontSize: '0.95rem' }}>{option.label}</span>
                        {reportCategory === option.value && (
                          <FaCheck style={{ marginLeft: 'auto', color: '#8b5cf6' }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {reportCategory && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>
                      Additional details (optional)
                    </label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Provide more context about this report..."
                      rows={3}
                      style={{
                        width: '100%', padding: '0.875rem', borderRadius: '10px',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        background: 'rgba(15, 23, 42, 0.8)', color: '#e2e8f0',
                        fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit'
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => { setShowReportModal(false); setReportCategory(''); setReportDescription(''); }}
                    style={{
                      flex: 1, padding: '0.875rem', borderRadius: '10px',
                      background: 'rgba(51, 65, 85, 0.5)', border: '1px solid #475569',
                      color: '#94a3b8', cursor: 'pointer', fontWeight: '600'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={!reportCategory || reportSubmitting}
                    style={{
                      flex: 1, padding: '0.875rem', borderRadius: '10px',
                      background: reportCategory 
                        ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
                        : 'rgba(51, 65, 85, 0.5)',
                      border: 'none', color: '#fff', cursor: reportCategory ? 'pointer' : 'not-allowed',
                      fontWeight: '600', opacity: reportCategory ? 1 : 0.5,
                      transition: 'all 0.2s'
                    }}
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PostCard;
