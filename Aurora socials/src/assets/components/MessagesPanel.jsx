import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios.js";
import { FaTimes, FaChevronLeft, FaUserFriends, FaUsers } from "react-icons/fa";
import { IoChatbubbleEllipses, IoSend } from "react-icons/io5";

const MessagesPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'followers'
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const userId = Number(localStorage.getItem('userId'));

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
                <FaChevronLeft /> Back
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
                <IoChatbubbleEllipses /> Messages
              </h2>
            </>
          )}
          <button
            onClick={onClose}
            style={{
              background: '#3a3b3c', border: 'none', color: '#e4e6eb',
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >
            <FaTimes />
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
                <FaUserFriends /> Friends ({friends.length})
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
                <FaUsers /> Followers ({followers.length})
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
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} style={{
              padding: '1rem', borderTop: '1px solid #3a3b3c',
              display: 'flex', gap: '0.5rem'
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
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
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <IoSend />
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
      `}</style>
    </>
  );
};

export default MessagesPanel;
