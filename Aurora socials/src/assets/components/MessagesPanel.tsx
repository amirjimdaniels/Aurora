import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios.tsx";
import { FaTimes, FaChevronLeft, FaUserFriends, FaUsers } from "react-icons/fa";
import { IoChatbubbleEllipses, IoSend } from "react-icons/io5";

const MessagesPanel = ({ isOpen, onClose, initialChat }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'followers'
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chatEmojis = ['😊', '😂', '❤️', '🔥', '👍', '👎', '😢', '😡', '🎉', '💯', '🙏', '😍', '🤔', '👋', '✨', '💀'];

  const userId = Number(localStorage.getItem('userId'));

  // Handle initialChat prop to open a specific chat
  useEffect(() => {
    if (isOpen && initialChat) {
      setSelectedChat(initialChat);
    }
  }, [isOpen, initialChat]);

  // Reset selectedChat when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedChat(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchData();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    // Poll for new messages when in a chat
    if (selectedChat) {
      const interval = setInterval(() => {
        fetchConversation(selectedChat.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  // Poll for typing indicators
  useEffect(() => {
    if (selectedChat) {
      const checkTyping = async () => {
        try {
          const res = await axios.get(`/api/messages/typing/${userId}/${selectedChat.id}`);
          setIsPartnerTyping(res.data.isTyping);
        } catch (err) {
          console.error(err);
        }
      };
      
      checkTyping();
      const interval = setInterval(checkTyping, 1000);
      return () => clearInterval(interval);
    } else {
      setIsPartnerTyping(false);
    }
  }, [selectedChat, userId]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async () => {
    if (!selectedChat) return;
    try {
      await axios.post('/api/messages/typing', {
        senderId: userId,
        receiverId: selectedChat.id
      });
    } catch (err) {
      console.error(err);
    }
  }, [selectedChat, userId]);

  // Stop typing indicator
  const stopTypingIndicator = useCallback(async () => {
    if (!selectedChat) return;
    try {
      await axios.post('/api/messages/stop-typing', {
        senderId: userId,
        receiverId: selectedChat.id
      });
    } catch (err) {
      console.error(err);
    }
  }, [selectedChat, userId]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    sendTypingIndicator();
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTypingIndicator();
    }, 2000);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [friendsRes, followersRes] = await Promise.all([
        axios.get(`/api/messages/friends/${userId}`),
        axios.get(`/api/messages/followers/${userId}`)
      ]);
      setFriends(friendsRes.data);
      setFollowers(followersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (partnerId) => {
    try {
      const res = await axios.get(`/api/messages/conversation/${userId}/${partnerId}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectChat = async (user) => {
    setSelectedChat(user);
    await fetchConversation(user.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      // Stop typing indicator when sending
      stopTypingIndicator();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      await axios.post('/api/messages/send', {
        senderId: userId,
        receiverId: selectedChat.id,
        content: newMessage.trim()
      });
      setNewMessage("");
      fetchConversation(selectedChat.id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to send message');
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000
        }}
      />
      
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '380px', maxWidth: '100vw',
        background: '#242526', zIndex: 1001,
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
        animation: 'slideIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem', borderBottom: '1px solid #3a3b3c',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          {selectedChat ? (
            <>
              <button
                onClick={() => setSelectedChat(null)}
                style={{
                  background: 'none', border: 'none', color: '#e4e6eb',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <FaChevronLeft size={14} color="#e4e6eb" /> Back
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: selectedChat.profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', fontSize: '1rem', fontWeight: '600', color: '#fff'
                }}>
                  {selectedChat.profilePicture ? (
                    <img src={selectedChat.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : selectedChat.username?.charAt(0).toUpperCase()}
                </div>
                <span style={{ color: '#e4e6eb', fontWeight: '600' }}>{selectedChat.username}</span>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ margin: 0, color: '#e4e6eb', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IoChatbubbleEllipses size={20} color="#e4e6eb" /> Messages
              </h2>
            </>
          )}
          <button
            onClick={onClose}
            style={{
              background: '#3a3b3c', border: 'none', color: '#e4e6eb',
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            <FaTimes size={16} color="#e4e6eb" />
          </button>
        </div>

        {!selectedChat ? (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #3a3b3c' }}>
              <button
                onClick={() => setActiveTab('friends')}
                style={{
                  flex: 1, padding: '0.75rem', background: 'none', border: 'none',
                  color: activeTab === 'friends' ? '#2078f4' : '#b0b3b8',
                  borderBottom: activeTab === 'friends' ? '2px solid #2078f4' : '2px solid transparent',
                  fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <FaUserFriends size={14} /> Friends ({friends.length})
              </button>
              <button
                onClick={() => setActiveTab('followers')}
                style={{
                  flex: 1, padding: '0.75rem', background: 'none', border: 'none',
                  color: activeTab === 'followers' ? '#2078f4' : '#b0b3b8',
                  borderBottom: activeTab === 'followers' ? '2px solid #2078f4' : '2px solid transparent',
                  fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <FaUsers size={14} /> Followers ({followers.length})
              </button>
            </div>

            {/* User Grid */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#b0b3b8' }}>Loading...</div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem'
                }}>
                  {(activeTab === 'friends' ? friends : followers).map(user => (
                    <div
                      key={user.id}
                      onClick={() => activeTab === 'friends' ? handleSelectChat(user) : navigate(`/profile/${user.id}`)}
                      style={{
                        background: '#3a3b3c', borderRadius: '12px', padding: '1rem',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: '0.5rem', cursor: 'pointer', transition: 'transform 0.15s, background 0.15s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#4a4b4c'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#3a3b3c'}
                    >
                      <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: user.profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', fontSize: '1.5rem', fontWeight: '600', color: '#fff'
                      }}>
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : user.username?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ color: '#e4e6eb', fontWeight: '500', fontSize: '0.9rem', textAlign: 'center' }}>
                        {user.username}
                      </span>
                      {activeTab === 'friends' && (
                        <span style={{ color: '#65676b', fontSize: '0.75rem' }}>Tap to chat</span>
                      )}
                      {activeTab === 'followers' && !friends.some(f => f.id === user.id) && (
                        <span style={{ color: '#65676b', fontSize: '0.75rem' }}>Follow back to chat</span>
                      )}
                    </div>
                  ))}
                  {(activeTab === 'friends' ? friends : followers).length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#b0b3b8' }}>
                      {activeTab === 'friends' ? (
                        <>
                          <FaUserFriends style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.5 }} />
                          <p style={{ margin: 0 }}>No friends yet</p>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Follow people who follow you back to become friends!</p>
                        </>
                      ) : (
                        <>
                          <FaUsers style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.5 }} />
                          <p style={{ margin: 0 }}>No followers yet</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Chat Messages */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#b0b3b8' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: selectedChat.profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', fontSize: '2rem', fontWeight: '600', color: '#fff', marginBottom: '1rem'
                  }}>
                    {selectedChat.profilePicture ? (
                      <img src={selectedChat.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : selectedChat.username?.charAt(0).toUpperCase()}
                  </div>
                  <p style={{ margin: 0, fontWeight: '600', color: '#e4e6eb' }}>{selectedChat.username}</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>Start the conversation</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.senderId === userId ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '75%',
                      background: msg.senderId === userId ? '#2078f4' : '#3a3b3c',
                      color: '#fff',
                      padding: '0.6rem 1rem',
                      borderRadius: msg.senderId === userId ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    }}>
                      <p style={{ margin: 0, fontSize: '0.95rem', wordBreak: 'break-word' }}>{msg.content}</p>
                      <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
              {/* Typing indicator */}
              {isPartnerTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                  <div style={{
                    background: '#3a3b3c',
                    padding: '0.5rem 1rem',
                    borderRadius: '18px',
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    <div className="typing-dot" style={{ animationDelay: '0ms' }} />
                    <div className="typing-dot" style={{ animationDelay: '150ms' }} />
                    <div className="typing-dot" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div style={{
                padding: '0.5rem', borderTop: '1px solid #3a3b3c',
                background: '#2d2d2d', display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center'
              }}>
                {chatEmojis.map((emoji, i) => (
                  <button key={i} onClick={() => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); }}
                    style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
                    onMouseOver={e => (e.target as HTMLElement).style.background = '#3a3b3c'}
                    onMouseOut={e => (e.target as HTMLElement).style.background = 'none'}
                  >{emoji}</button>
                ))}
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} style={{
              padding: '1rem', borderTop: '1px solid #3a3b3c',
              display: 'flex', gap: '0.5rem', alignItems: 'center'
            }}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: showEmojiPicker ? '#2078f4' : 'none',
                  border: 'none', cursor: 'pointer', fontSize: '1.2rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}
              >😊</button>
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '20px',
                  border: 'none', background: '#3a3b3c', color: '#e4e6eb',
                  fontSize: '0.95rem', outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: newMessage.trim() ? '#2078f4' : '#3a3b3c',
                  border: 'none', color: '#fff', cursor: newMessage.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem'
                }}
              >
                <IoSend size={18} color="#fff" />
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .typing-dot {
          width: 8px;
          height: 8px;
          background: #b0b3b8;
          border-radius: 50%;
          animation: typingBounce 1.4s infinite ease-in-out;
        }
      `}</style>
    </>
  );
};

export default MessagesPanel;
