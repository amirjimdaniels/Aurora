import { useState, useEffect, useRef } from "react";
import axios from "../../api/axios.js";
import { FaBell, FaTimes, FaHeart, FaComment, FaReply, FaSmile, FaUserPlus, FaEnvelope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const NotificationsPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  
  const userId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/notifications/${userId}`);
      setNotifications(response.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`/api/notifications/${userId}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.type === 'message' && notification.fromUser) {
      // Open MessagesPanel to the sender's conversation
      window.dispatchEvent(new CustomEvent('openMessages', {
        detail: { chat: notification.fromUser }
      }));
    } else if (notification.postId) {
      navigate(`/feed#post-${notification.postId}`);
    }
    onClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FaHeart style={{ color: '#f43f5e' }} />;
      case 'reaction':
        return <FaSmile style={{ color: '#fbbf24' }} />;
      case 'comment':
        return <FaComment style={{ color: '#38bdf8' }} />;
      case 'comment_reply':
        return <FaReply style={{ color: '#a78bfa' }} />;
      case 'comment_like':
        return <FaHeart style={{ color: '#ef4444' }} />;
      case 'message':
        return <FaEnvelope style={{ color: '#22c55e' }} />;
      case 'follow':
      case 'friend_request':
        return <FaUserPlus style={{ color: '#34d399' }} />;
      default:
        return <FaBell style={{ color: '#94a3b8' }} />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: '70px',
        right: '80px',
        width: '380px',
        maxHeight: 'calc(100vh - 100px)',
        background: '#1e293b',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #334155'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid #334155',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaBell style={{ color: '#38bdf8', fontSize: '1.1rem' }} />
          <h3 style={{ color: '#e2e8f0', margin: 0, fontWeight: '600' }}>Notifications</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FaTimes style={{ fontSize: '1.1rem' }} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.5rem'
      }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '2rem',
            color: '#64748b'
          }}>
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 1rem',
            color: '#64748b'
          }}>
            <FaBell style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ margin: 0, textAlign: 'center' }}>No notifications yet</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', textAlign: 'center' }}>
              When people interact with your posts, you'll see it here
            </p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '12px',
                cursor: 'pointer',
                background: notification.read ? 'transparent' : 'rgba(56, 189, 248, 0.1)',
                marginBottom: '0.25rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = notification.read 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(56, 189, 248, 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = notification.read 
                  ? 'transparent' 
                  : 'rgba(56, 189, 248, 0.1)';
              }}
            >
              {/* User Avatar or Icon */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative'
              }}>
                {notification.fromUser?.profilePicture ? (
                  <img
                    src={notification.fromUser.profilePicture}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '1.1rem'
                  }}>
                    {notification.fromUser?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                {/* Notification type badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  border: '2px solid #1e293b'
                }}>
                  {getNotificationIcon(notification.type)}
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  color: '#e2e8f0',
                  margin: 0,
                  fontSize: '0.9rem',
                  lineHeight: 1.4
                }}>
                  {notification.message}
                </p>
                <p style={{
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontSize: '0.75rem'
                }}>
                  {formatTimeAgo(notification.createdAt)}
                </p>
              </div>

              {/* Unread indicator */}
              {!notification.read && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#38bdf8',
                  flexShrink: 0,
                  marginTop: '0.5rem'
                }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
