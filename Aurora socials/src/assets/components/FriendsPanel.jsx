import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios.js";
import { FaUserFriends, FaUserPlus, FaCheck, FaTimes, FaUserMinus, FaChevronLeft, FaCommentDots } from "react-icons/fa";

const FriendsPanel = ({ isOpen, onClose, onOpenChat }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    if (isOpen && userId) {
      fetchData();
    }
  }, [isOpen, userId]);

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Get mutual followers (people who follow each other) - these are "friends"
      const [friendsRes, requestsRes] = await Promise.all([
        axios.get(`/api/messages/friends/${userId}`),
        axios.get(`/api/friends/requests/${userId}`)
      ]);
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await axios.post('/api/friends/accept', { friendshipId, userId });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    try {
      await axios.delete(`/api/friends/${friendshipId}`, { data: { userId } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnfriend = async (friendId) => {
    try {
      // Unfollow the friend (this breaks the mutual follow, removing them as a friend)
      await axios.delete('/api/follow/unfollow', { 
        data: { followerId: userId, followingId: friendId } 
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
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
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        zIndex: 1001,
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 30px rgba(139, 92, 246, 0.15)',
        border: 'none',
        borderRight: '1px solid rgba(139, 92, 246, 0.2)',
        animation: 'slideInLeft 0.25s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem', 
          borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8b5cf6'
            }}>
              <FaUserFriends style={{ fontSize: '1.1rem' }} />
            </div>
            <h2 style={{ 
              margin: 0, color: '#f1f5f9', fontSize: '1.25rem', fontWeight: '700',
              background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Friends
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171', cursor: 'pointer', padding: '0.5rem',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
          >
            <FaTimes size={16} color="#f87171" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', gap: '0.5rem', padding: '1rem',
          background: 'rgba(15, 23, 42, 0.5)'
        }}>
          <button
            onClick={() => setActiveTab('friends')}
            style={{
              flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', border: 'none',
              background: activeTab === 'friends' 
                ? 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)' 
                : 'rgba(30, 41, 59, 0.8)',
              color: activeTab === 'friends' ? '#fff' : '#94a3b8',
              fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'friends' ? '0 4px 15px rgba(139, 92, 246, 0.3)' : 'none'
            }}
          >
            All Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            style={{
              flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', border: 'none',
              background: activeTab === 'requests' 
                ? 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)' 
                : 'rgba(30, 41, 59, 0.8)',
              color: activeTab === 'requests' ? '#fff' : '#94a3b8',
              fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem',
              position: 'relative', transition: 'all 0.2s',
              boxShadow: activeTab === 'requests' ? '0 4px 15px rgba(139, 92, 246, 0.3)' : 'none'
            }}
          >
            Requests
            {requests.length > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
                color: '#fff', borderRadius: '50%',
                width: '20px', height: '20px', display: 'flex', 
                alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: '700',
                boxShadow: '0 2px 8px rgba(244, 63, 94, 0.4)'
              }}>
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <div style={{
                width: '40px', height: '40px', margin: '0 auto 1rem',
                border: '3px solid rgba(139, 92, 246, 0.2)',
                borderTopColor: '#8b5cf6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Loading...
            </div>
          ) : (
            <>
              {/* Friends List */}
              {activeTab === 'friends' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {friends.length > 0 ? friends.map(friend => (
                    <div
                      key={friend.id}
                      style={{
                        background: 'rgba(30, 41, 59, 0.6)',
                        borderRadius: '12px', padding: '0.875rem',
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        border: '1px solid rgba(139, 92, 246, 0.1)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { 
                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                      }}
                      onMouseLeave={e => { 
                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.1)';
                      }}
                    >
                      <div
                        onClick={() => { navigate(`/profile/${friend.id}`); onClose(); }}
                        style={{
                          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, cursor: 'pointer',
                          background: friend.profilePicture ? 'none' : 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                          border: '2px solid rgba(139, 92, 246, 0.2)'
                        }}
                      >
                        {friend.profilePicture ? (
                          <img src={friend.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>
                            {friend.username?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          onClick={() => { navigate(`/profile/${friend.id}`); onClose(); }}
                          style={{ 
                            margin: 0, color: '#f1f5f9', fontWeight: '600', 
                            fontSize: '0.9rem', cursor: 'pointer',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}
                        >
                          {friend.username}
                        </p>
                      </div>
                      <button
                        onClick={() => { if (onOpenChat) onOpenChat(friend); onClose(); }}
                        title="Message"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0.5rem 0.7rem', borderRadius: '8px', 
                          border: '1px solid rgba(6, 182, 212, 0.2)',
                          background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', 
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)'; }}
                      >
                        <FaCommentDots style={{ fontSize: '1rem' }} />
                      </button>
                      <button
                        onClick={() => handleUnfriend(friend.id)}
                        title="Unfriend"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0.5rem 0.7rem', borderRadius: '8px', 
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', 
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                      >
                        <FaUserMinus style={{ fontSize: '1rem' }} />
                      </button>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                      <div style={{
                        width: '60px', height: '60px', margin: '0 auto 1rem',
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <FaUserFriends style={{ fontSize: '1.5rem', color: '#8b5cf6' }} />
                      </div>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8' }}>No friends yet</p>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem' }}>
                        Visit profiles to add friends!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Friend Requests */}
              {activeTab === 'requests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {requests.length > 0 ? requests.map(request => (
                    <div
                      key={request.id}
                      style={{
                        background: 'rgba(30, 41, 59, 0.6)',
                        borderRadius: '12px', padding: '0.875rem',
                        display: 'flex', flexDirection: 'column', gap: '0.75rem',
                        border: '1px solid rgba(139, 92, 246, 0.15)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          onClick={() => { navigate(`/profile/${request.sender.id}`); onClose(); }}
                          style={{
                            width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, cursor: 'pointer',
                            background: request.sender.profilePicture ? 'none' : 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                            border: '2px solid rgba(139, 92, 246, 0.2)'
                          }}
                        >
                          {request.sender.profilePicture ? (
                            <img src={request.sender.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>
                              {request.sender.username?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p
                            onClick={() => { navigate(`/profile/${request.sender.id}`); onClose(); }}
                            style={{ margin: 0, color: '#f1f5f9', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}
                          >
                            {request.sender.username}
                          </p>
                          <p style={{ margin: '0.15rem 0 0 0', color: '#64748b', fontSize: '0.75rem' }}>
                            Wants to be friends
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                            padding: '0.5rem', borderRadius: '8px', border: 'none',
                            background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)', 
                            color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                            boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <FaCheck size={12} color="#fff" /> Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                            padding: '0.5rem', borderRadius: '8px', 
                            border: '1px solid rgba(100, 116, 139, 0.3)',
                            background: 'rgba(30, 41, 59, 0.8)', color: '#94a3b8', 
                            cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          <FaTimes size={12} color="#94a3b8" /> Decline
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                      <div style={{
                        width: '60px', height: '60px', margin: '0 auto 1rem',
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <FaUserPlus style={{ fontSize: '1.5rem', color: '#8b5cf6' }} />
                      </div>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8' }}>No pending requests</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default FriendsPanel;
