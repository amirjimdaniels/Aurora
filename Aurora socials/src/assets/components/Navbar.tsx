import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaSignOutAlt, FaCog, FaMoon, FaSun, FaSearch, FaBell, FaTimes, FaCode, FaEnvelope } from 'react-icons/fa'
import axios from '../../api/axios.tsx'
import './Navbar.css'
import NotificationsPanel from './NotificationsPanel.tsx'
import MessagesPanel from './MessagesPanel.tsx'

const Navbar = ({ searchQuery: externalSearchQuery = undefined, onSearchChange = undefined }: any) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false) // mobile menu
  const [searchOpen, setSearchOpen] = useState(false)
  // Use external search query if provided, otherwise use local state
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery
  const setSearchQuery = onSearchChange || setLocalSearchQuery
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [messageInitialChat, setMessageInitialChat] = useState(null)
  const [isDeveloper, setIsDeveloper] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Developer mode toggle (only visible if user.isDeveloper is true in DB)
  const [devMode, setDevMode] = useState(() => {
    const saved = localStorage.getItem('devMode');
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  const toggleDevMode = () => {
    const newValue = !devMode;
    setDevMode(newValue);
    localStorage.setItem('devMode', JSON.stringify(newValue));
  };

  const username = localStorage.getItem('username') || 'User'
  const userId = localStorage.getItem('userId')

  // Fetch user profile picture
  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        try {
          const response = await axios.get(`/api/users/${userId}`)
          setProfilePicture(response.data.profilePicture)
          setIsDeveloper(response.data.isDeveloper || false)
        } catch (err) {
          console.error('Failed to fetch user data')
        }
      }
    }
    fetchUserData()
    
    // Listen for profile updates
    const handleProfileUpdate = () => fetchUserData()
    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate)
  }, [userId])

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (userId) {
        try {
          const response = await axios.get(`/api/notifications/${userId}/unread-count`)
          setUnreadCount(response.data.count)
        } catch (err) {
          console.error('Failed to fetch unread count')
        }
      }
    }
    fetchUnreadCount()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [userId])

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (userId) {
        try {
          const response = await axios.get(`/api/messages/unread/${userId}`)
          setUnreadMessageCount(response.data.count)
        } catch (err) {
          console.error('Failed to fetch unread message count')
        }
      }
    }
    fetchUnreadMessages()
    const interval = setInterval(fetchUnreadMessages, 15000)
    return () => clearInterval(interval)
  }, [userId])

  // Listen for openMessages event from NotificationsPanel
  useEffect(() => {
    const handleOpenMessages = (e) => {
      setMessageInitialChat(e.detail?.chat || null)
      setMessagesOpen(true)
      setNotificationsOpen(false)
    }
    window.addEventListener('openMessages', handleOpenMessages)
    return () => window.removeEventListener('openMessages', handleOpenMessages)
  }, [])

  // Search posts as user types
  useEffect(() => {
    const searchPosts = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      try {
        const response = await axios.get(`/api/posts/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Search failed:', err);
      }
    };
    
    const debounce = setTimeout(searchPosts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Apply dark mode changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.body.style.background = '#0f172a';
      document.body.style.color = '#e2e8f0';
    } else {
      document.body.style.background = '#f1f5f9';
      document.body.style.color = '#1e293b';
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    navigate('/')
  }

  return (
  <>
    <nav className='navbar' role="navigation" aria-label="Main navigation">
      <div className="left" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0}}>
        {!imgError ? (
          <img
            src="/Aurorav3.png"
            alt="Aurora v3 logo"
            className='logo'
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="logo-fallback">Aurora</div>
        )}
        <div className="logo-text">Aurora</div>
      </div>

      <button
        className="nav-button mobile-toggle"
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(v => !v)}
      >
        Menu
      </button>

      <ul id="main-nav" className={open ? 'open' : ''}>
        <li><a href="#home" onClick={(e) => { e.preventDefault(); navigate('/feed'); }}>Home</a></li>
        <li><a href="#profile" onClick={(e) => { e.preventDefault(); navigate('/profile'); }}>Profile</a></li>
        <li><a href="#support" onClick={(e) => { e.preventDefault(); navigate('/support'); }}>Support</a></li>
        {devMode && <li><a href="#icon-test" onClick={(e) => { e.preventDefault(); navigate('/icon-test'); }} style={{ color: '#ff6b6b' }}>Icon Test</a></li>}
        {devMode && <li><a href="#generate-users" onClick={(e) => { e.preventDefault(); navigate('/generate-users'); }} style={{ color: '#ff6b6b' }}>User Gen</a></li>}
        {devMode && <li><a href="#analytics" onClick={(e) => { e.preventDefault(); navigate('/analytics'); }} style={{ color: '#ff6b6b' }}>Analytics</a></li>}
        <li>
          <button
            className="nav-button"
            aria-expanded={searchOpen}
            aria-controls="explore-input"
            onClick={() => setSearchOpen(v => !v)}
          >
            Explore
          </button>
        </li>
      </ul>

      <div className='searchbox' style={{ position: 'relative' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FaSearch style={{ 
            position: 'absolute', 
            left: '12px', 
            color: '#64748b', 
            fontSize: '0.9rem',
            pointerEvents: 'none'
          }} />
          <input
            id="explore-input"
            className={`search-input ${searchOpen ? '' : 'hidden'}`}
            type="text"
            placeholder='Search posts, hashtags...'
            aria-label="Explore"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            style={{ paddingLeft: '36px' }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false); }}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <FaTimes size={14} color="#64748b" />
            </button>
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#1e293b',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1002,
            marginTop: '8px'
          }}>
            {searchResults.map(post => (
              <div
                key={post.id}
                onClick={() => {
                  navigate(`/post/${post.id}`);
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #334155',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#334155'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: post.author?.profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {post.author?.profilePicture ? (
                      <img src={post.author.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>
                        {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#e2e8f0', fontWeight: '500', fontSize: '0.9rem' }}>
                      {post.author?.username}
                    </div>
                    <div style={{ 
                      color: '#94a3b8', 
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {post.content?.substring(0, 60)}...
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#1e293b',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            padding: '1rem',
            zIndex: 1002,
            marginTop: '8px',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            No posts found for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Messages Envelope */}
      <button
        onClick={() => {
          setMessagesOpen(!messagesOpen);
          setNotificationsOpen(false);
          setShowProfileMenu(false);
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          position: 'relative',
          marginRight: '0.25rem'
        }}
      >
        <FaEnvelope style={{ color: messagesOpen ? '#38bdf8' : '#e2e8f0', fontSize: '1.2rem' }} />
        {unreadMessageCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '0px',
            background: '#22c55e',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: '600',
            minWidth: '16px',
            height: '16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px'
          }}>
            {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
          </span>
        )}
      </button>

      {/* Notifications Bell */}
      <button
        onClick={() => {
          setNotificationsOpen(!notificationsOpen);
          setMessagesOpen(false);
          setShowProfileMenu(false);
          if (!notificationsOpen) setUnreadCount(0);
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          position: 'relative',
          marginRight: '0.5rem'
        }}
      >
        <FaBell style={{ color: notificationsOpen ? '#38bdf8' : '#e2e8f0', fontSize: '1.3rem' }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: '600',
            minWidth: '16px',
            height: '16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Profile Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setShowProfileMenu(!showProfileMenu); setNotificationsOpen(false); setMessagesOpen(false); }}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: profilePicture ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', color: '#fff', fontSize: '1.1rem',
            border: '2px solid #fff', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)', overflow: 'hidden',
            padding: 0
          }}
        >
          {profilePicture ? (
            <img src={profilePicture} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            username.charAt(0).toUpperCase()
          )}
        </button>
        {showProfileMenu && (
          <div
            style={{
              position: 'absolute', top: '48px', right: 0, background: '#23232a',
              borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              minWidth: '200px', overflow: 'hidden', zIndex: 1001
            }}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid #3a3a44', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: profilePicture ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', overflow: 'hidden' }}>
                {profilePicture ? (
                  <img src={profilePicture} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  username.charAt(0).toUpperCase()
                )}
              </div>
              <span style={{ color: '#fff', fontWeight: '600' }}>{username}</span>
            </div>
            
            {/* Dark/Light Mode Toggle */}
            <button
              onClick={() => toggleDarkMode()}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {darkMode ? <FaMoon style={{ color: '#38bdf8' }} /> : <FaSun style={{ color: '#f59e0b' }} />}
                {darkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>On</span>
            </button>

            {/* Developer Mode Toggle - Only for users with isDeveloper=true in DB */}
            {isDeveloper && (
              <button
                onClick={() => toggleDevMode()}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaCode style={{ color: devMode ? '#22c55e' : '#64748b' }} />
                  Developer Mode
                </span>
                <span style={{ fontSize: '0.75rem', color: devMode ? '#22c55e' : '#64748b' }}>{devMode ? 'On' : 'Off'}</span>
              </button>
            )}

            <button
              onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left' }}
            >
              <FaCog style={{ color: '#a3a3a3' }} /> Settings
            </button>
            <button
              onClick={() => { setShowProfileMenu(false); handleLogout(); }}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', borderTop: '1px solid #3a3a44', textAlign: 'left' }}
            >
              <FaSignOutAlt /> Log Out
            </button>
          </div>
        )}
      </div>
    </nav>

    {/* Panels rendered outside <nav> to avoid backdrop-filter containing block */}
    <NotificationsPanel
      isOpen={notificationsOpen}
      onClose={() => setNotificationsOpen(false)}
    />
    <MessagesPanel
      isOpen={messagesOpen}
      onClose={() => { setMessagesOpen(false); setMessageInitialChat(null); }}
      initialChat={messageInitialChat}
    />
  </>
  )
}

export default Navbar
