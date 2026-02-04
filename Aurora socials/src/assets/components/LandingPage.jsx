// ...existing code...
import axios from "../../api/axios.js";
import "./LandingPage.css";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegThumbsUp, FaThumbsUp, FaRegCommentDots, FaBookmark, FaImage, FaTimes, FaTrash, FaShare, FaLink, FaCheck, FaSmile, FaNewspaper, FaFire, FaUserFriends, FaHashtag, FaCog, FaRegBookmark, FaHome, FaUser, FaBell } from "react-icons/fa";
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
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState(null); // { emoji, label, category }
  const [feelingSearchQuery, setFeelingSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("feelings");
  const [showPostReactionPicker, setShowPostReactionPicker] = useState(null); // postId or null
  const [postReactionSearch, setPostReactionSearch] = useState("");
  const [postReactionCategory, setPostReactionCategory] = useState("feelings");
  const [activeTab, setActiveTab] = useState("foryou"); // foryou, following, trending
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [selectedHashtag, setSelectedHashtag] = useState(null); // null or tag name
  const [hashtagPosts, setHashtagPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  // Get userId and username from localStorage (needed early for quickLinks)
  const userId = Number(localStorage.getItem('userId'));
  const username = localStorage.getItem('username') || 'User';

  // News/updates data
  const newsItems = [
    { title: "New reaction features are here! 🎉", time: "2h ago", type: "update" },
    { title: "Weekend photo challenge starts now", time: "5h ago", type: "event" },
    { title: "Community guidelines updated", time: "1d ago", type: "announcement" },
  ];

  // Quick links for left sidebar
  const quickLinks = [
    { icon: <FaHome />, label: "Home", path: "/feed", active: true },
    { icon: <FaUser />, label: "Profile", path: `/profile/${userId}` },
    { icon: <FaUserFriends />, label: "Friends", path: "/friends" },
    { icon: <FaRegBookmark />, label: "Saved", path: "/saved" },
    { icon: <FaCog />, label: "Settings", path: "/settings" },
  ];

  // Feelings and Activities data with emojis
  const feelingsData = {
    feelings: [
      { emoji: "😊", label: "happy" },
      { emoji: "😍", label: "loved" },
      { emoji: "🥰", label: "grateful" },
      { emoji: "😎", label: "cool" },
      { emoji: "🤩", label: "excited" },
      { emoji: "😌", label: "relaxed" },
      { emoji: "🥳", label: "celebratory" },
      { emoji: "😤", label: "determined" },
      { emoji: "😢", label: "sad" },
      { emoji: "😔", label: "disappointed" },
      { emoji: "😫", label: "tired" },
      { emoji: "😴", label: "sleepy" },
      { emoji: "🤒", label: "sick" },
      { emoji: "😡", label: "angry" },
      { emoji: "🤔", label: "thoughtful" },
      { emoji: "😅", label: "awkward" },
      { emoji: "🙃", label: "silly" },
      { emoji: "😇", label: "blessed" },
      { emoji: "🥺", label: "emotional" },
      { emoji: "😤", label: "frustrated" },
      { emoji: "🤗", label: "thankful" },
      { emoji: "😏", label: "confident" },
      { emoji: "🥱", label: "bored" },
      { emoji: "😬", label: "nervous" },
      { emoji: "🫠", label: "overwhelmed" },
      { emoji: "💪", label: "strong" },
      { emoji: "❤️‍🔥", label: "passionate" },
      { emoji: "🫶", label: "supportive" },
      { emoji: "✨", label: "magical" },
      { emoji: "💫", label: "dizzy" }
    ],
    activities: [
      { emoji: "🎮", label: "playing games" },
      { emoji: "📺", label: "watching TV" },
      { emoji: "🎬", label: "watching a movie" },
      { emoji: "🎵", label: "listening to music" },
      { emoji: "📚", label: "reading" },
      { emoji: "✍️", label: "writing" },
      { emoji: "💻", label: "coding" },
      { emoji: "🎨", label: "creating art" },
      { emoji: "📷", label: "taking photos" },
      { emoji: "🏃", label: "exercising" },
      { emoji: "🧘", label: "meditating" },
      { emoji: "🍳", label: "cooking" },
      { emoji: "🍽️", label: "eating" },
      { emoji: "☕", label: "drinking coffee" },
      { emoji: "🍵", label: "drinking tea" },
      { emoji: "🎉", label: "celebrating" },
      { emoji: "✈️", label: "traveling" },
      { emoji: "🚗", label: "driving" },
      { emoji: "🛒", label: "shopping" },
      { emoji: "💼", label: "working" },
      { emoji: "📱", label: "scrolling" },
      { emoji: "🎤", label: "singing" },
      { emoji: "💃", label: "dancing" },
      { emoji: "🎸", label: "playing music" },
      { emoji: "🏊", label: "swimming" },
      { emoji: "⚽", label: "playing sports" },
      { emoji: "🎯", label: "focusing" },
      { emoji: "🧹", label: "cleaning" },
      { emoji: "🛋️", label: "relaxing" },
      { emoji: "😴", label: "sleeping" }
    ],
    eating: [
      { emoji: "🍕", label: "pizza" },
      { emoji: "🍔", label: "burger" },
      { emoji: "🍟", label: "fries" },
      { emoji: "🌮", label: "tacos" },
      { emoji: "🍜", label: "noodles" },
      { emoji: "🍣", label: "sushi" },
      { emoji: "🥗", label: "salad" },
      { emoji: "🍝", label: "pasta" },
      { emoji: "🥪", label: "sandwich" },
      { emoji: "🍦", label: "ice cream" },
      { emoji: "🎂", label: "cake" },
      { emoji: "🍩", label: "donuts" },
      { emoji: "🍪", label: "cookies" },
      { emoji: "🍫", label: "chocolate" },
      { emoji: "🥤", label: "drinks" }
    ],
    celebrating: [
      { emoji: "🎂", label: "birthday" },
      { emoji: "🎄", label: "Christmas" },
      { emoji: "🎃", label: "Halloween" },
      { emoji: "💝", label: "Valentine's Day" },
      { emoji: "🎊", label: "New Year" },
      { emoji: "🎓", label: "graduation" },
      { emoji: "💍", label: "engagement" },
      { emoji: "👶", label: "new baby" },
      { emoji: "🏠", label: "new home" },
      { emoji: "💼", label: "new job" },
      { emoji: "🏆", label: "achievement" },
      { emoji: "❤️", label: "anniversary" },
      { emoji: "🎉", label: "party" },
      { emoji: "🥂", label: "success" },
      { emoji: "🌟", label: "milestone" }
    ]
  };

  // Filter feelings based on search query
  const getFilteredFeelings = () => {
    const currentData = feelingsData[activeCategory] || [];
    if (!feelingSearchQuery.trim()) return currentData;
    return currentData.filter(item =>
      item.label.toLowerCase().includes(feelingSearchQuery.toLowerCase())
    );
  };

  // Handle feeling selection
  const handleFeelingSelect = (item) => {
    setSelectedFeeling({ ...item, category: activeCategory });
    setShowFeelingPicker(false);
    setFeelingSearchQuery("");
  };

  // Clear selected feeling
  const clearFeeling = () => {
    setSelectedFeeling(null);
  };

  // Handle post reaction
  const handlePostReaction = async (postId, reaction) => {
    if (!userId) return;
    try {
      await axios.post(`/api/posts/${postId}/react`, {
        userId,
        emoji: reaction.emoji,
        label: reaction.label,
        category: postReactionCategory
      });
      setShowPostReactionPicker(null);
      setPostReactionSearch("");
      // Refresh posts to show updated reactions
      const updated = await axios.get("/api/posts");
      setPosts(updated.data);
    } catch (err) {
      console.error('Failed to add reaction:', err);
    }
  };

  // Get filtered reactions for post picker
  const getFilteredPostReactions = () => {
    const currentData = feelingsData[postReactionCategory] || [];
    if (!postReactionSearch.trim()) return currentData;
    return currentData.filter(item =>
      item.label.toLowerCase().includes(postReactionSearch.toLowerCase())
    );
  };

  // Get reaction summary for a post
  const getReactionSummary = (reactions) => {
    if (!reactions || reactions.length === 0) return [];
    
    const reactionCounts = reactions.reduce((acc, reaction) => {
      const key = reaction.emoji;
      if (!acc[key]) {
        acc[key] = {
          emoji: reaction.emoji,
          label: reaction.label,
          count: 0,
          users: []
        };
      }
      acc[key].count++;
      acc[key].users.push(reaction.user.username);
      return acc;
    }, {});
    
    return Object.values(reactionCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Show top 3 reactions
  };

  // Extract feeling/activity from post content and return content without it
  const extractFeeling = (content) => {
    if (!content) return { mainContent: '', feeling: null };
    
    // Match patterns like "— feeling 😍 loved" or "— eating 🍕 pizza" etc.
    const feelingPattern = /\n\n— (feeling|eating|celebrating|watching|playing|listening to|doing) ([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|❤️‍🔥|🫠|🫶|✨|💫|💪|❤️) (.+)$/u;
    const match = content.match(feelingPattern);
    
    if (match) {
      const [fullMatch, type, emoji, label] = match;
      return {
        mainContent: content.replace(fullMatch, ''),
        feeling: { type, emoji, label }
      };
    }
    return { mainContent: content, feeling: null };
  };

  // Check if user has reacted with specific emoji
  const hasUserReacted = (reactions, emoji) => {
    if (!reactions || !userId) return false;
    return reactions.some(reaction => 
      reaction.userId === userId && reaction.emoji === emoji
    );
  };

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
    // Append feeling to content if selected
    let finalContent = newPostContent;
    if (selectedFeeling) {
      const feelingText = activeCategory === 'feelings' 
        ? `feeling ${selectedFeeling.emoji} ${selectedFeeling.label}`
        : activeCategory === 'eating'
        ? `eating ${selectedFeeling.emoji} ${selectedFeeling.label}`
        : activeCategory === 'celebrating'
        ? `celebrating ${selectedFeeling.emoji} ${selectedFeeling.label}`
        : `${selectedFeeling.emoji} ${selectedFeeling.label}`;
      finalContent = `${newPostContent}\n\n— ${feelingText}`;
    }
    try {
      await axios.post('/api/posts', {
        userId,
        content: finalContent,
        mediaUrl: newPostMediaUrl.trim() || null
      });
      setNewPostContent("");
      setNewPostMediaUrl("");
      setMediaPreview(null);
      setSelectedFeeling(null);
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

  // Fetch trending hashtags
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await axios.get("/api/posts/trending/hashtags");
        setTrendingHashtags(response.data);
      } catch (err) {
        console.error("Failed to load trending hashtags:", err);
      }
    };
    fetchTrending();
  }, []);

  // Fetch suggested users (real users from database)
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!userId) return;
      try {
        const response = await axios.get(`/api/users/suggestions/${userId}`);
        setSuggestedUsers(response.data);
      } catch (err) {
        console.error("Failed to load suggested users:", err);
      }
    };
    fetchSuggestedUsers();
  }, [userId]);

  // Fetch posts by hashtag when selected
  useEffect(() => {
    const fetchHashtagPosts = async () => {
      if (!selectedHashtag) {
        setHashtagPosts([]);
        return;
      }
      try {
        const response = await axios.get(`/api/posts/hashtag/${selectedHashtag}`);
        setHashtagPosts(response.data.posts || []);
      } catch (err) {
        console.error("Failed to load hashtag posts:", err);
      }
    };
    fetchHashtagPosts();
  }, [selectedHashtag]);

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

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#18181b', color: '#fff', paddingTop: '80px' }}>Loading posts...</div>;
  if (error) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#18181b', color: '#ef4444', paddingTop: '80px' }}>{error}</div>;

  return (
    <div className="centered-bg" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', padding: '1.5rem', paddingTop: '0', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Left Sidebar */}
      <div style={{
        width: '280px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'sticky',
        top: '90px',
        height: 'fit-content',
        maxHeight: 'calc(100vh - 110px)'
      }}>
        {/* Profile Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '50%',
              background: userProfilePicture ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', border: '2px solid #38bdf8'
            }}>
              {userProfilePicture ? (
                <img src={userProfilePicture} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#fff', fontWeight: '600', fontSize: '1.2rem' }}>{username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: '600', fontSize: '1rem' }}>{username}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>@{username.toLowerCase()}</div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/profile/${userId}`)}
            style={{
              width: '100%', padding: '0.6rem', borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
          >
            View Profile
          </button>
        </div>

        {/* Quick Links */}
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '0.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          {quickLinks.map((link, idx) => (
            <button
              key={idx}
              onClick={() => navigate(link.path)}
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
                background: link.active ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                border: 'none', color: link.active ? '#38bdf8' : '#e2e8f0',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500',
                transition: 'all 0.2s', textAlign: 'left'
              }}
              onMouseEnter={e => { if (!link.active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (!link.active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '1.1rem', width: '24px' }}>{link.icon}</span>
              {link.label}
            </button>
          ))}
        </div>

        {/* News & Updates */}
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#e2e8f0', fontWeight: '600', fontSize: '0.95rem' }}>
            <FaNewspaper style={{ color: '#38bdf8' }} /> News & Updates
          </div>
          {newsItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '0.6rem 0',
                borderBottom: idx < newsItems.length - 1 ? '1px solid #334155' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{ color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{item.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px',
                  background: item.type === 'update' ? 'rgba(34, 197, 94, 0.2)' : item.type === 'event' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: item.type === 'update' ? '#22c55e' : item.type === 'event' ? '#fbbf24' : '#3b82f6'
                }}>
                  {item.type}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Feed */}
      <div className="feed-container" style={{ flex: 1, maxWidth: '600px' }}>
        {/* Feed Tabs */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
          background: '#1e293b', borderRadius: '12px', padding: '0.4rem'
        }}>
          {[
            { key: 'foryou', label: 'For You', icon: '✨' },
            { key: 'following', label: 'Following', icon: '👥' },
            { key: 'trending', label: 'Trending', icon: '🔥' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '0.7rem 1rem', borderRadius: '8px',
                background: activeTab === tab.key ? '#38bdf8' : 'transparent',
                border: 'none', color: activeTab === tab.key ? '#0f172a' : '#94a3b8',
                fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.4rem'
              }}
              onMouseEnter={e => { if (activeTab !== tab.key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (activeTab !== tab.key) e.currentTarget.style.background = 'transparent' }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
        {/* Post Composer */}
        <div className="post-composer" style={{ position: 'relative', width: '100%', background: '#292933', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
              <img src={userProfilePicture} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
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
              onClick={() => setShowFeelingPicker(!showFeelingPicker)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: selectedFeeling ? '#22c55e' : '#fbbf24', fontWeight: '600', fontSize: '0.95rem' }}
            >
              {selectedFeeling ? (
                <><span style={{ fontSize: '1.2rem' }}>{selectedFeeling.emoji}</span> {selectedFeeling.label}</>
              ) : (
                <><FaSmile style={{ fontSize: '1.2rem' }} /> Feeling/Activity</>
              )}
            </button>
            {selectedFeeling && (
              <button
                onClick={clearFeeling}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}
                title="Clear feeling"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Selected Feeling Preview */}
          {selectedFeeling && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.75rem', marginTop: '0.5rem',
              background: '#1e293b', borderRadius: '8px', color: '#94a3b8', fontSize: '0.9rem'
            }}>
              <span style={{ fontSize: '1.3rem' }}>{selectedFeeling.emoji}</span>
              <span>
                {selectedFeeling.category === 'feelings' && 'feeling '}
                {selectedFeeling.category === 'eating' && 'eating '}
                {selectedFeeling.category === 'celebrating' && 'celebrating '}
                {selectedFeeling.category === 'activities' && ''}
                <strong style={{ color: '#e2e8f0' }}>{selectedFeeling.label}</strong>
              </span>
            </div>
          )}

          {/* Feeling/Activity Picker Modal */}
          {showFeelingPicker && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#1e293b', borderRadius: '12px', marginTop: '0.5rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 1000,
              maxHeight: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', borderBottom: '1px solid #334155'
              }}>
                <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem', fontWeight: '600' }}>
                  How are you feeling?
                </h3>
                <button
                  onClick={() => { setShowFeelingPicker(false); setFeelingSearchQuery(""); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}
                >
                  <FaTimes />
                </button>
              </div>

              {/* Search */}
              <div style={{ padding: '0.75rem 1rem' }}>
                <input
                  type="text"
                  placeholder="Search feelings & activities..."
                  value={feelingSearchQuery}
                  onChange={(e) => setFeelingSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '0.6rem 1rem', borderRadius: '8px',
                    border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0',
                    fontSize: '0.9rem', outline: 'none'
                  }}
                />
              </div>

              {/* Category Tabs */}
              <div style={{
                display: 'flex', gap: '0.5rem', padding: '0 1rem 0.75rem',
                borderBottom: '1px solid #334155', overflowX: 'auto'
              }}>
                {[
                  { key: 'feelings', label: '😊 Feelings' },
                  { key: 'activities', label: '🎮 Activities' },
                  { key: 'eating', label: '🍕 Eating' },
                  { key: 'celebrating', label: '🎉 Celebrating' }
                ].map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    style={{
                      padding: '0.4rem 0.8rem', borderRadius: '20px', border: 'none',
                      background: activeCategory === cat.key ? '#3b82f6' : '#334155',
                      color: activeCategory === cat.key ? '#fff' : '#94a3b8',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                      whiteSpace: 'nowrap', transition: 'all 0.2s'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Feelings Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '0.5rem', padding: '1rem', overflowY: 'auto', maxHeight: '250px'
              }}>
                {getFilteredFeelings().map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleFeelingSelect(item)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none',
                      background: '#334155', color: '#e2e8f0', cursor: 'pointer',
                      fontSize: '0.85rem', transition: 'all 0.2s', textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#475569'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#334155'}
                  >
                    <span style={{ fontSize: '1.3rem' }}>{item.emoji}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  </button>
                ))}
                {getFilteredFeelings().length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No results found
                  </div>
                )}
              </div>
            </div>
          )}

          {newPostContent.trim() && (
            <button
              onClick={handleCreatePost}
              style={{ marginTop: '0.75rem', width: '100%', background: 'linear-gradient(90deg,#38bdf8,#2563eb)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
            >Post</button>
          )}
        </div>

        {/* Show hashtag header when viewing a hashtag */}
        {selectedHashtag && (
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '48px', height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FaHashtag style={{ color: '#fff', fontSize: '1.5rem' }} />
              </div>
              <div>
                <h3 style={{ color: '#e2e8f0', fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                  #{selectedHashtag}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                  {hashtagPosts.length} {hashtagPosts.length === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedHashtag(null)}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              }}
            >
              Back to Feed
            </button>
          </div>
        )}

        <div className="posts-wrapper">
          {(selectedHashtag ? hashtagPosts : posts).map(post => {
            const likedByUser = post.likes?.some(like => like.userId === userId);
            const savedByUser = post.savedBy?.some(saved => saved.userId === userId);
            const { mainContent, feeling } = extractFeeling(post.content);
            return (
              <div key={post.id} className="post-card" style={{ position: 'relative', background: '#1e293b', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                {/* Post Header - Avatar, Name, Time, and Reactions */}
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
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                      <span
                        onClick={() => navigate(`/profile/${post.author?.id}`)}
                        style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer' }}
                        onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.target.style.textDecoration = 'none'}
                      >
                        {post.author?.username || "Unknown"}
                      </span>
                      {/* Feeling displayed next to username */}
                      {feeling && (
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                          is {feeling.type} {feeling.emoji} {feeling.label}
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(post.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {/* Compact Reactions Display - Top Right of Header */}
                  {getReactionSummary(post.reactions).length > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(51, 65, 85, 0.5)',
                      borderRadius: '16px',
                      padding: '4px 8px',
                      flexShrink: 0
                    }}>
                      {getReactionSummary(post.reactions).slice(0, 4).map((reaction, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                          }}
                          title={`${reaction.count} ${reaction.label}\n${reaction.users.slice(0, 3).join(', ')}${reaction.users.length > 3 ? ` +${reaction.users.length - 3}` : ''}`}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <span style={{ fontSize: '0.85rem' }}>{reaction.emoji}</span>
                          <span style={{
                            fontSize: '0.65rem',
                            color: '#94a3b8',
                            fontWeight: '600',
                            marginLeft: '1px'
                          }}>
                            {reaction.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div style={{ color: '#f1f5f9', fontSize: '1rem', lineHeight: '1.5', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>
                  {mainContent}
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
                  <span 
                    style={{ marginLeft: 'auto', cursor: 'pointer' }}
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
                      onClick={() => setShowPostReactionPicker(showPostReactionPicker === post.id ? null : post.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        color: '#f59e0b', padding: '0.5rem 0.75rem',
                        borderRadius: '6px', transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <FaSmile />
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>React</span>
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

                {/* Post Reaction Picker Modal */}
                {showPostReactionPicker === post.id && (
                  <div style={{
                    position: 'relative', marginTop: '0.75rem', background: '#1e293b', borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden',
                    maxHeight: '300px', display: 'flex', flexDirection: 'column'
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem 1rem', borderBottom: '1px solid #334155'
                    }}>
                      <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '600' }}>
                        Add your reaction
                      </h4>
                      <button
                        onClick={() => { setShowPostReactionPicker(null); setPostReactionSearch(""); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.2rem' }}
                      >
                        <FaTimes />
                      </button>
                    </div>

                    {/* Search */}
                    <div style={{ padding: '0.5rem 1rem' }}>
                      <input
                        type="text"
                        placeholder="Search reactions..."
                        value={postReactionSearch}
                        onChange={(e) => setPostReactionSearch(e.target.value)}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px',
                          border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0',
                          fontSize: '0.8rem', outline: 'none'
                        }}
                      />
                    </div>

                    {/* Category Tabs */}
                    <div style={{
                      display: 'flex', gap: '0.3rem', padding: '0 1rem 0.5rem',
                      borderBottom: '1px solid #334155', overflowX: 'auto'
                    }}>
                      {[
                        { key: 'feelings', label: '😊' },
                        { key: 'activities', label: '🎮' },
                        { key: 'eating', label: '🍕' },
                        { key: 'celebrating', label: '🎉' }
                      ].map(cat => (
                        <button
                          key={cat.key}
                          onClick={() => setPostReactionCategory(cat.key)}
                          style={{
                            padding: '0.3rem 0.6rem', borderRadius: '15px', border: 'none',
                            background: postReactionCategory === cat.key ? '#3b82f6' : '#334155',
                            color: postReactionCategory === cat.key ? '#fff' : '#94a3b8',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500',
                            whiteSpace: 'nowrap', transition: 'all 0.2s'
                          }}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Reactions Grid */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                      gap: '0.4rem', padding: '0.75rem', overflowY: 'auto', maxHeight: '150px'
                    }}>
                      {getFilteredPostReactions().map((item, index) => {
                        const userHasThisReaction = hasUserReacted(post.reactions, item.emoji);
                        return (
                          <button
                            key={index}
                            onClick={() => handlePostReaction(post.id, item)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.4rem',
                              padding: '0.5rem 0.6rem', borderRadius: '6px', border: 'none',
                              background: userHasThisReaction ? '#22c55e' : '#334155',
                              color: userHasThisReaction ? '#fff' : '#e2e8f0',
                              cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                              if (!userHasThisReaction) e.currentTarget.style.background = '#475569'
                            }}
                            onMouseLeave={(e) => {
                              if (!userHasThisReaction) e.currentTarget.style.background = '#334155'
                            }}
                            title={userHasThisReaction ? 'Remove reaction' : 'Add reaction'}
                          >
                            <span style={{ fontSize: '1.1rem' }}>{item.emoji}</span>
                            <span style={{ 
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              fontSize: '0.7rem'
                            }}>
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                      {getFilteredPostReactions().length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b', padding: '1rem', fontSize: '0.8rem' }}>
                          No reactions found
                        </div>
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

      {/* Right Sidebar */}
      <div style={{
        width: '300px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'sticky',
        top: '90px',
        height: 'fit-content',
        maxHeight: 'calc(100vh - 110px)'
      }}>
        {/* Trending Topics */}
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#e2e8f0', fontWeight: '600', fontSize: '1rem' }}>
            <FaFire style={{ color: '#f97316' }} /> Trending Now
          </div>
          {selectedHashtag && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.5rem 0.75rem', marginBottom: '0.75rem',
              background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px'
            }}>
              <span style={{ color: '#38bdf8', fontWeight: '500' }}>
                Viewing #{selectedHashtag}
              </span>
              <button
                onClick={() => setSelectedHashtag(null)}
                style={{
                  background: 'none', border: 'none', color: '#f97316',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500'
                }}
              >
                Clear
              </button>
            </div>
          )}
          {trendingHashtags.length > 0 ? (
            trendingHashtags.map((topic, idx) => (
              <div
                key={topic.id || idx}
                onClick={() => setSelectedHashtag(topic.name)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '0.5rem',
                  background: selectedHashtag === topic.name ? 'rgba(56, 189, 248, 0.15)' : 'transparent'
                }}
                onMouseEnter={e => {
                  if (selectedHashtag !== topic.name) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={e => {
                  if (selectedHashtag !== topic.name) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FaHashtag style={{ fontSize: '0.8rem', color: '#38bdf8' }} /> {topic.name}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  {topic.postCount} {topic.postCount === 1 ? 'post' : 'posts'}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
              No trending hashtags yet. Be the first to start a trend with #YourHashtag!
            </div>
          )}
          <button
            style={{
              width: '100%', padding: '0.6rem', borderRadius: '8px',
              background: 'transparent', border: 'none',
              color: '#38bdf8', fontWeight: '500', cursor: 'pointer', fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Show more
          </button>
        </div>

        {/* Suggested Friends */}
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#e2e8f0', fontWeight: '600', fontSize: '1rem' }}>
            <FaUserFriends style={{ color: '#a78bfa' }} /> People you may know
          </div>
          {suggestedUsers.length > 0 ? (
            suggestedUsers.slice(0, 5).map((person, idx) => (
              <div
                key={person.id}
                onClick={() => navigate(`/profile/${person.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0',
                  borderBottom: idx < Math.min(suggestedUsers.length - 1, 4) ? '1px solid #334155' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {person.profilePicture ? (
                  <img
                    src={person.profilePicture}
                    alt={person.username}
                    style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: `linear-gradient(135deg, hsl(${(person.id * 40) % 360}, 70%, 50%) 0%, hsl(${(person.id * 40 + 30) % 360}, 70%, 60%) 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: '600', fontSize: '1rem'
                  }}>
                    {person.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '0.9rem' }}>{person.username}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                    {person.mutualFriends > 0 && `${person.mutualFriends} mutual friends`}
                    {person.mutualFriends > 0 && person.sharedHashtags > 0 && ' · '}
                    {person.sharedHashtags > 0 && `${person.sharedHashtags} shared interests`}
                    {person.mutualFriends === 0 && person.sharedHashtags === 0 && 'Suggested for you'}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Follow user logic here
                    axios.post(`/api/follow/${person.id}`, { followerId: userId })
                      .then(() => {
                        // Remove from suggestions after following
                        setSuggestedUsers(prev => prev.filter(u => u.id !== person.id));
                      })
                      .catch(err => console.error('Failed to follow:', err));
                  }}
                  style={{
                    padding: '0.4rem 0.75rem', borderRadius: '6px',
                    background: '#38bdf8', border: 'none',
                    color: '#0f172a', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0ea5e9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#38bdf8'}
                >
                  Follow
                </button>
              </div>
            ))
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
              No suggestions available yet. Start posting to discover people with similar interests!
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div style={{ padding: '0.5rem 1rem', color: '#64748b', fontSize: '0.7rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {['About', 'Help', 'Privacy', 'Terms', 'Careers'].map((link, idx) => (
              <span key={idx} style={{ cursor: 'pointer' }} onMouseEnter={e => e.target.style.color = '#94a3b8'} onMouseLeave={e => e.target.style.color = '#64748b'}>
                {link} {idx < 4 && '·'}
              </span>
            ))}
          </div>
          <div>© 2026 Aurora Social</div>
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
