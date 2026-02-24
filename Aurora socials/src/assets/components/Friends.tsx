import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios.tsx";
import { FaUserFriends, FaUserPlus, FaCheck, FaTimes, FaUserMinus } from "react-icons/fa";

const Friends = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'requests'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        axios.get(`/api/friends/list/${userId}`),
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

  const handleUnfriend = async (friendshipId) => {
    try {
      await axios.delete(`/api/friends/${friendshipId}`, { data: { userId } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#18191a', paddingTop: '80px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ color: '#e4e6eb', margin: 0, fontSize: '1.75rem', fontWeight: '700' }}>
            <FaUserFriends style={{ marginRight: '0.5rem' }} /> Friends
          </h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('friends')}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
              background: activeTab === 'friends' ? '#2078f4' : '#3a3b3c',
              color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
            }}
          >
            All Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
              background: activeTab === 'requests' ? '#2078f4' : '#3a3b3c',
              color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem',
              position: 'relative'
            }}
          >
            Friend Requests
            {requests.length > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: '#f02849', color: '#fff', borderRadius: '50%',
                width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: '700'
              }}>
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#b0b3b8' }}>
            Loading...
          </div>
        ) : (
          <>
            {/* Friends List */}
            {activeTab === 'friends' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {friends.length > 0 ? friends.map(friend => (
                  <div
                    key={friend.id}
                    style={{
                      background: '#242526', borderRadius: '12px', padding: '1rem',
                      display: 'flex', alignItems: 'center', gap: '1rem'
                    }}
                  >
                    <div
                      onClick={() => navigate(`/profile/${friend.id}`)}
                      style={{
                        width: '60px', height: '60px', borderRadius: '8px', flexShrink: 0, cursor: 'pointer',
                        background: friend.profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                      }}
                    >
                      {friend.profilePicture ? (
                        <img src={friend.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '600' }}>
                          {friend.username?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        onClick={() => navigate(`/profile/${friend.id}`)}
                        style={{ margin: 0, color: '#e4e6eb', fontWeight: '600', fontSize: '1rem', cursor: 'pointer' }}
                      >
                        {friend.username}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnfriend(friend.friendshipId)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.5rem 1rem', borderRadius: '6px', border: 'none',
                        background: '#3a3b3c', color: '#e4e6eb', cursor: 'pointer', fontWeight: '600'
                      }}
                    >
                      <FaUserMinus /> Unfriend
                    </button>
                  </div>
                )) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#b0b3b8' }}>
                    <FaUserFriends style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '1.1rem' }}>You haven't added any friends yet.</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Visit someone's profile and send them a friend request!</p>
                  </div>
                )}
              </div>
            )}

            {/* Friend Requests */}
            {activeTab === 'requests' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {requests.length > 0 ? requests.map(request => (
                  <div
                    key={request.id}
                    style={{
                      background: '#242526', borderRadius: '12px', padding: '1rem',
                      display: 'flex', flexDirection: 'column', gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        onClick={() => navigate(`/profile/${request.sender.id}`)}
                        style={{
                          width: '60px', height: '60px', borderRadius: '8px', flexShrink: 0, cursor: 'pointer',
                          background: request.sender.profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                        }}
                      >
                        {request.sender.profilePicture ? (
                          <img src={request.sender.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '600' }}>
                            {request.sender.username?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p
                          onClick={() => navigate(`/profile/${request.sender.id}`)}
                          style={{ margin: 0, color: '#e4e6eb', fontWeight: '600', fontSize: '1rem', cursor: 'pointer' }}
                        >
                          {request.sender.username}
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#b0b3b8', fontSize: '0.85rem' }}>
                          Sent you a friend request
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                          padding: '0.6rem', borderRadius: '6px', border: 'none',
                          background: '#2078f4', color: '#fff', cursor: 'pointer', fontWeight: '600'
                        }}
                      >
                        <FaCheck /> Confirm
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                          padding: '0.6rem', borderRadius: '6px', border: 'none',
                          background: '#3a3b3c', color: '#e4e6eb', cursor: 'pointer', fontWeight: '600'
                        }}
                      >
                        <FaTimes /> Delete
                      </button>
                    </div>
                  </div>
                )) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#b0b3b8' }}>
                    <FaUserPlus style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '1.1rem' }}>No pending friend requests.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Friends;
