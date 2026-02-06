// ...existing code...
import axios from "../../api/axios.js";
import "./LandingPage.css";
import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaRegThumbsUp, FaThumbsUp, FaRegCommentDots, FaBookmark, FaImage, FaTimes, FaTrash, FaShare, FaLink, FaCheck, FaSmile, FaNewspaper, FaFire, FaUserFriends, FaHashtag, FaCog, FaRegBookmark, FaHome, FaUser, FaBell, FaPoll, FaClock, FaPlus } from "react-icons/fa";
import { IoCloseCircle, IoSend, IoChatbubbleEllipses } from "react-icons/io5";
import MessagesPanel from "./MessagesPanel.jsx";
import FriendsPanel from "./FriendsPanel.jsx";
import PostCard from "./PostCard.jsx";
import Stories from "./Stories.jsx";

const LandingPage = ({ searchQuery = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [messageInitialChat, setMessageInitialChat] = useState(null);
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
  const [followingList, setFollowingList] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollQuestion, setPollQuestion] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [showStoryCreator, setShowStoryCreator] = useState(false);

  // Get userId and username from localStorage (needed early for quickLinks)
  const userId = Number(localStorage.getItem('userId'));
  const username = localStorage.getItem('username') || 'User';

  // Filter posts based on search query and active tab
  const filteredPosts = useMemo(() => {
    let result = posts;
    
    // Apply tab filter first
    if (activeTab === 'following') {
      // Show only posts from users we follow
      const followingIds = new Set(followingList.map(u => u.id));
      result = result.filter(post => followingIds.has(post.author?.id || post.authorId));
    } else if (activeTab === 'trending') {
      // Sort by engagement (likes + comments) for trending
      result = [...result].sort((a, b) => {
        const engagementA = (a.likes?.length || 0) + (a.comments?.length || 0);
        const engagementB = (b.likes?.length || 0) + (b.comments?.length || 0);
        return engagementB - engagementA;
      });
    }
    // For 'foryou' tab, show all posts (default behavior)
    
    // Apply search filter if present
    if (searchQuery && searchQuery.trim().length >= 2) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(post => {
        // Search in post content
        if (post.content?.toLowerCase().includes(query)) return true;
        // Search in username
        if (post.author?.username?.toLowerCase().includes(query)) return true;
        // Search in hashtags
        const hashtags = post.content?.match(/#\w+/g) || [];
        if (hashtags.some(tag => tag.toLowerCase().includes(query))) return true;
        // Search in poll question
        if (post.poll?.question?.toLowerCase().includes(query)) return true;
        return false;
      });
    }
    
    return result;
  }, [posts, searchQuery, activeTab, followingList]);

  // Quick links for left sidebar
  const quickLinks = [
    { icon: <FaHome size={18} />, label: "Home", path: "/feed", active: true },
    { icon: <FaUser size={18} />, label: "Profile", path: `/profile/${userId}` },
    { icon: <FaUserFriends size={18} />, label: "Friends", path: "/friends" },
    { icon: <FaRegBookmark size={18} />, label: "Saved", path: "/saved" },
    { icon: <FaCog size={18} />, label: "Settings", path: "/settings" },
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
      // Prepare poll options (filter empty ones)
      const validPollOptions = showPollCreator 
        ? pollOptions.filter(opt => opt.trim() !== '')
        : [];
      
      await axios.post('/api/posts', {
        userId,
        content: finalContent,
        mediaUrl: newPostMediaUrl.trim() || null,
        pollOptions: validPollOptions.length >= 2 ? validPollOptions : undefined,
        pollQuestion: pollQuestion.trim() || undefined
      });
      setNewPostContent("");
      setNewPostMediaUrl("");
      setMediaPreview(null);
      setSelectedFeeling(null);
      setShowPollCreator(false);
      setPollOptions(['', '']);
      setPollQuestion('');
      setShowScheduler(false);
      setScheduledDate('');
      setScheduledTime('');
      if (fileInputRef.current) fileInputRef.current.value = "";
      const updated = await axios.get("/api/posts");
      setPosts(updated.data);
    } catch (err) {}
  };

  // Schedule post handler
  const handleSchedulePost = async () => {
    if (!userId || !newPostContent.trim() || !scheduledDate || !scheduledTime) return;
    
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
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      
      await axios.post('/api/scheduled-posts', {
        userId,
        content: finalContent,
        mediaUrl: newPostMediaUrl.trim() || null,
        scheduledAt: scheduledAt.toISOString()
      });
      
      // Reset form
      setNewPostContent("");
      setNewPostMediaUrl("");
      setMediaPreview(null);
      setSelectedFeeling(null);
      setShowPollCreator(false);
      setPollOptions(['', '']);
      setPollQuestion('');
      setShowScheduler(false);
      setScheduledDate('');
      setScheduledTime('');
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Fetch updated scheduled posts
      fetchScheduledPosts();
      
      alert('Post scheduled successfully!');
    } catch (err) {
      console.error('Schedule error:', err);
      alert('Failed to schedule post');
    }
  };

  // Fetch scheduled posts
  const fetchScheduledPosts = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`/api/scheduled-posts/user/${userId}`);
      setScheduledPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch scheduled posts:', err);
    }
  };

  // Refreshes posts - used by PostCard when actions are taken
  const refreshPosts = async () => {
    try {
      const response = await axios.get("/api/posts");
      setPosts(response.data);
      // Also refresh hashtag posts if a hashtag is selected
      if (selectedHashtag) {
        const hashtagResponse = await axios.get(`/api/posts/hashtag/${selectedHashtag}`);
        setHashtagPosts(hashtagResponse.data.posts || []);
      }
    } catch (err) {
      console.error("Failed to refresh posts:", err);
    }
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

  // Handle navigation state to open chat from profile
  useEffect(() => {
    if (location.state?.openChat) {
      setMessageInitialChat(location.state.openChat);
      setMessagesOpen(true);
      // Clear the state to prevent re-opening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

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

  // Fetch scheduled posts
  useEffect(() => {
    if (userId) {
      fetchScheduledPosts();
    }
  }, [userId]);

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

  // Fetch who the user follows (for Following tab)
  useEffect(() => {
    const fetchFollowing = async () => {
      if (!userId) return;
      try {
        const response = await axios.get(`/api/follow/following/${userId}`);
        setFollowingList(response.data);
      } catch (err) {
        console.error("Failed to load following list:", err);
      }
    };
    fetchFollowing();
  }, [userId]);

  // Fetch news from external APIs
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        const response = await axios.get("/api/news?category=mixed&limit=8");
        setNewsItems(response.data);
      } catch (err) {
        console.error("Failed to load news:", err);
        // Fallback to placeholder if API fails
        setNewsItems([
          { id: 1, title: "Unable to load news", source: "Error", time: "", type: "error" }
        ]);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
              onClick={() => link.label === 'Friends' ? setFriendsOpen(true) : navigate(link.path)}
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
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#e2e8f0', fontWeight: '600', fontSize: '0.95rem' }}>
            <FaNewspaper style={{ color: '#38bdf8' }} /> News & Updates
          </div>
          {newsLoading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
              Loading news...
            </div>
          ) : newsItems.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
              No news available
            </div>
          ) : (
            newsItems.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => item.url && window.open(item.url, '_blank')}
                style={{
                  padding: '0.6rem 0',
                  borderBottom: idx < newsItems.length - 1 ? '1px solid #334155' : 'none',
                  cursor: item.url ? 'pointer' : 'default',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '0.25rem', lineHeight: '1.3' }}>
                  {item.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px',
                    background: item.type === 'tech' ? 'rgba(34, 197, 94, 0.2)' : item.type === 'world' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: item.type === 'tech' ? '#22c55e' : item.type === 'world' ? '#fbbf24' : '#3b82f6'
                  }}>
                    {item.type || 'news'}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{item.source}</span>
                  <span style={{ color: '#475569', fontSize: '0.7rem' }}>·</span>
                  <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{item.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Feed */}
      <div className="feed-container" style={{ flex: 1, maxWidth: '600px' }}>
        {/* Stories Row */}
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '1rem',
          marginBottom: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <Stories showCreateModal={showStoryCreator} onCloseCreateModal={() => setShowStoryCreator(false)} hideAddButton />
        </div>

        {/* Feed Tabs */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '1.25rem',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', borderRadius: '14px', padding: '0.35rem',
          border: '1px solid #334155'
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
                flex: 1, padding: '0.65rem 1rem', borderRadius: '10px',
                background: activeTab === tab.key ? 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)' : 'transparent',
                border: 'none', color: activeTab === tab.key ? '#fff' : '#94a3b8',
                fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.4rem',
                boxShadow: activeTab === tab.key ? '0 4px 12px rgba(56, 189, 248, 0.25)' : 'none'
              }}
              onMouseEnter={e => { if (activeTab !== tab.key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (activeTab !== tab.key) e.currentTarget.style.background = 'transparent' }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
        {/* Post Composer */}
        <div className="post-composer" style={{ position: 'relative', width: '100%', background: 'linear-gradient(145deg, #1e293b 0%, #1a1f2e 100%)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', overflow: 'hidden', border: '2px solid #334155' }}>
              {userProfilePicture ? (
                <img src={userProfilePicture} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '1.1rem' }}>{username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <input
              type="text"
              placeholder={`What's on your mind, ${username}?`}
              value={newPostContent}
              onChange={e => setNewPostContent(e.target.value)}
              style={{ flex: 1, padding: '0.85rem 1.25rem', borderRadius: '24px', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = '#38bdf8'}
              onBlur={e => e.currentTarget.style.borderColor = '#334155'}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: '0.25rem' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ background: 'rgba(74, 222, 128, 0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4ade80', fontWeight: '500', fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)'}
            >
              <FaImage style={{ fontSize: '1rem' }} /> Photo
            </button>
            <button
              onClick={() => setShowFeelingPicker(!showFeelingPicker)}
              style={{ background: selectedFeeling ? 'rgba(34, 197, 94, 0.15)' : 'rgba(251, 191, 36, 0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: selectedFeeling ? '#22c55e' : '#fbbf24', fontWeight: '500', fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = selectedFeeling ? 'rgba(34, 197, 94, 0.25)' : 'rgba(251, 191, 36, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = selectedFeeling ? 'rgba(34, 197, 94, 0.15)' : 'rgba(251, 191, 36, 0.1)'}
            >
              {selectedFeeling ? (
                <><span style={{ fontSize: '1rem' }}>{selectedFeeling.emoji}</span> {selectedFeeling.label}</>
              ) : (
                <><FaSmile style={{ fontSize: '1rem' }} /> Feeling</>
              )}
            </button>
            <button
              onClick={() => setShowPollCreator(!showPollCreator)}
              style={{ background: showPollCreator ? 'rgba(34, 197, 94, 0.15)' : 'rgba(167, 139, 250, 0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: showPollCreator ? '#22c55e' : '#a78bfa', fontWeight: '500', fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = showPollCreator ? 'rgba(34, 197, 94, 0.25)' : 'rgba(167, 139, 250, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = showPollCreator ? 'rgba(34, 197, 94, 0.15)' : 'rgba(167, 139, 250, 0.1)'}
            >
              <FaPoll style={{ fontSize: '1rem' }} /> Poll
            </button>
            <button
              onClick={() => setShowScheduler(!showScheduler)}
              style={{ background: showScheduler ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 114, 182, 0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: showScheduler ? '#22c55e' : '#f472b6', fontWeight: '500', fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = showScheduler ? 'rgba(34, 197, 94, 0.25)' : 'rgba(244, 114, 182, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = showScheduler ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 114, 182, 0.1)'}
            >
              <FaClock style={{ fontSize: '1rem' }} /> Schedule
            </button>
            <button
              onClick={() => setShowStoryCreator(true)}
              style={{ background: 'rgba(56, 189, 248, 0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontWeight: '500', fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
            >
              <FaPlus style={{ fontSize: '0.85rem' }} /> Story
            </button>
            {selectedFeeling && (
              <button
                onClick={clearFeeling}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}
                title="Clear feeling"
              >
                <FaTimes size={14} color="#ef4444" />
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

          {/* Poll Creator */}
          {showPollCreator && (
            <div style={{
              marginTop: '0.75rem', padding: '1rem',
              background: '#1e293b', borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem' }}>Create a Poll</h4>
                <button
                  onClick={() => { setShowPollCreator(false); setPollOptions(['', '']); setPollQuestion(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <FaTimes size={16} color="#94a3b8" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Ask a question..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                style={{
                  width: '100%', padding: '0.6rem 0.75rem', marginBottom: '0.75rem',
                  borderRadius: '8px', border: '1px solid #334155', background: '#0f172a',
                  color: '#e2e8f0', fontSize: '0.9rem', outline: 'none'
                }}
              />
              {pollOptions.map((option, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...pollOptions];
                      newOptions[index] = e.target.value;
                      setPollOptions(newOptions);
                    }}
                    style={{
                      flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px',
                      border: '1px solid #334155', background: '#0f172a',
                      color: '#e2e8f0', fontSize: '0.85rem', outline: 'none'
                    }}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <FaTimes size={14} color="#ef4444" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 5 && (
                <button
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  style={{
                    background: 'none', border: '1px dashed #334155', borderRadius: '8px',
                    padding: '0.5rem', width: '100%', color: '#94a3b8', cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  + Add Option
                </button>
              )}
            </div>
          )}

          {/* Schedule Post */}
          {showScheduler && (
            <div style={{
              marginTop: '0.75rem', padding: '1rem',
              background: '#1e293b', borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem' }}>Schedule Post</h4>
                <button
                  onClick={() => { setShowScheduler(false); setScheduledDate(''); setScheduledTime(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <FaTimes size={16} color="#94a3b8" />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                      border: '1px solid #334155', background: '#0f172a',
                      color: '#e2e8f0', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                      border: '1px solid #334155', background: '#0f172a',
                      color: '#e2e8f0', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>
              </div>
              <button
                onClick={handleSchedulePost}
                disabled={!scheduledDate || !scheduledTime || !newPostContent.trim()}
                style={{
                  width: '100%', padding: '0.6rem', borderRadius: '8px',
                  background: (!scheduledDate || !scheduledTime || !newPostContent.trim()) ? '#334155' : '#38bdf8',
                  color: '#fff', border: 'none', fontWeight: '600', cursor: (!scheduledDate || !scheduledTime || !newPostContent.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Schedule Post
              </button>
              
              {/* Scheduled Posts List */}
              {scheduledPosts.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.8rem' }}>Your Scheduled Posts</h5>
                  {scheduledPosts.slice(0, 3).map(post => (
                    <div key={post.id} style={{
                      padding: '0.5rem', background: '#0f172a', borderRadius: '6px',
                      marginBottom: '0.5rem', fontSize: '0.85rem'
                    }}>
                      <div style={{ color: '#e2e8f0', marginBottom: '0.25rem' }}>
                        {post.content.length > 50 ? post.content.slice(0, 50) + '...' : post.content}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {new Date(post.scheduledAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  <FaTimes size={16} color="#94a3b8" />
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

        {/* Search Results Indicator */}
        {searchQuery && searchQuery.trim().length >= 2 && !selectedHashtag && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(129, 140, 248, 0.1))',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(56, 189, 248, 0.2)'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              🔍 Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'result' : 'results'} for "<span style={{ color: '#38bdf8' }}>{searchQuery}</span>"
            </span>
          </div>
        )}

        <div className="posts-wrapper">
          {(selectedHashtag ? hashtagPosts : filteredPosts).length === 0 && searchQuery && searchQuery.trim().length >= 2 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#64748b',
              background: '#1e293b',
              borderRadius: '16px',
              border: '1px solid #334155'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>No posts found</h3>
              <p>No posts match "{searchQuery}". Try a different search term.</p>
            </div>
          ) : (selectedHashtag ? hashtagPosts : filteredPosts).map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              currentUserProfile={userProfilePicture}
              currentUsername={username}
              onPostUpdate={refreshPosts}
              onHashtagClick={(tag) => setSelectedHashtag(tag)}
            />
          ))}
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
                    // Follow user
                    axios.post('/api/follow/follow', { followerId: userId, followingId: person.id })
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
                  <FaTimes size={18} color="#b0b3b8" />
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
                  {post.likes?.some(l => l.userId === userId) ? <FaThumbsUp size={16} color="#2078f4" /> : <FaRegThumbsUp size={16} color="#b0b3b8" />} Like
                </button>
                <button style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
                  color: '#b0b3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
                }}>
                  <FaRegCommentDots size={16} color="#b0b3b8" /> Comment
                </button>
                <button 
                  onClick={() => { setShareModal(post.id); setLinkCopied(false); }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.6rem', background: 'transparent', border: 'none', borderRadius: '4px',
                    color: '#b0b3b8', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600'
                  }}>
                  <FaShare size={16} color="#b0b3b8" /> Share
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
                      <IoSend size={20} color={commentText.trim() ? '#2078f4' : '#65676b'} />
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
                <FaTimes size={16} color="#b0b3b8" />
              </button>
            </div>
            <p style={{ color: '#b0b3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Copy the link below to share this post:
            </p>
            <div style={{
              display: 'flex', gap: '0.5rem', background: '#3a3b3c', borderRadius: '8px', padding: '0.75rem',
              alignItems: 'center'
            }}>
              <FaLink size={14} color="#b0b3b8" />
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
                {linkCopied ? <><FaCheck size={14} color="#fff" /> Copied!</> : 'Copy'}
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
      <MessagesPanel isOpen={messagesOpen} onClose={() => { setMessagesOpen(false); setMessageInitialChat(null); }} initialChat={messageInitialChat} />

      {/* Friends Panel */}
      <FriendsPanel 
        isOpen={friendsOpen} 
        onClose={() => setFriendsOpen(false)} 
        onOpenChat={(friend) => { setMessageInitialChat(friend); setMessagesOpen(true); }} 
      />
    </div>
  );
};

export default LandingPage;
