import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios.tsx';
import { 
  FaMoon, FaSun, FaBell, FaLock, FaGlobe, FaUserShield, 
  FaEye, FaEyeSlash, FaVolumeUp, FaVolumeMute, FaArrowLeft,
  FaToggleOn, FaToggleOff, FaUser, FaEnvelope, FaShieldAlt,
  FaTrash, FaDownload, FaQuestion, FaChevronRight
} from 'react-icons/fa';

const Settings = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [user, setUser] = useState(null);
  
  // Settings state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [mentionNotifications, setMentionNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [followNotifications, setFollowNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  
  // Active section
  const [activeSection, setActiveSection] = useState('appearance');

  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        try {
          const response = await axios.get(`/api/users/${userId}`);
          setUser(response.data);
        } catch (err) {
          console.error('Failed to fetch user');
        }
      }
    };
    fetchUser();
  }, [userId]);

  // Apply dark/light mode
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    
    // Apply CSS variables for theme
    if (darkMode) {
      document.body.style.background = '#0f172a';
      document.body.style.color = '#e2e8f0';
    } else {
      document.body.style.background = '#f1f5f9';
      document.body.style.color = '#1e293b';
    }
  }, [darkMode]);

  // Save notification setting
  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notifications));
  }, [notifications]);

  // Save sound setting
  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const Toggle = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.5rem',
        color: enabled ? '#38bdf8' : '#64748b',
        padding: 0,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {enabled ? <FaToggleOn /> : <FaToggleOff />}
    </button>
  );

  const SettingItem = ({ icon, label, description, children }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 0',
      borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: darkMode ? '#334155' : '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#38bdf8',
          fontSize: '1.1rem'
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: '500', color: darkMode ? '#e2e8f0' : '#1e293b' }}>{label}</div>
          {description && (
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{description}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );

  const SectionButton = ({ id, icon, label, active }) => (
    <button
      onClick={() => setActiveSection(id)}
      style={{
        width: '100%',
        padding: '0.875rem 1rem',
        background: active ? (darkMode ? '#334155' : '#e2e8f0') : 'transparent',
        border: 'none',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: 'pointer',
        color: active ? '#38bdf8' : (darkMode ? '#94a3b8' : '#64748b'),
        fontWeight: active ? '600' : '400',
        fontSize: '0.95rem',
        textAlign: 'left',
        transition: 'all 0.15s'
      }}
    >
      {icon}
      {label}
    </button>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', color: darkMode ? '#e2e8f0' : '#1e293b' }}>Appearance</h2>
            
            <SettingItem 
              icon={darkMode ? <FaMoon /> : <FaSun />}
              label="Dark Mode"
              description="Switch between light and dark themes"
            >
              <Toggle enabled={darkMode} onChange={() => setDarkMode(!darkMode)} />
            </SettingItem>

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                Theme Preview
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <button
                  onClick={() => setDarkMode(true)}
                  style={{
                    padding: '1.5rem',
                    background: '#1e293b',
                    border: darkMode ? '2px solid #38bdf8' : '2px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <FaMoon style={{ fontSize: '2rem', color: '#38bdf8', marginBottom: '0.5rem' }} />
                  <div style={{ color: '#e2e8f0', fontWeight: '500' }}>Dark</div>
                </button>
                <button
                  onClick={() => setDarkMode(false)}
                  style={{
                    padding: '1.5rem',
                    background: '#f1f5f9',
                    border: !darkMode ? '2px solid #38bdf8' : '2px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <FaSun style={{ fontSize: '2rem', color: '#f59e0b', marginBottom: '0.5rem' }} />
                  <div style={{ color: '#1e293b', fontWeight: '500' }}>Light</div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', color: darkMode ? '#e2e8f0' : '#1e293b' }}>Notifications</h2>
            
            <SettingItem 
              icon={<FaBell />}
              label="Enable Notifications"
              description="Receive in-app notifications"
            >
              <Toggle enabled={notifications} onChange={() => setNotifications(!notifications)} />
            </SettingItem>

            <SettingItem 
              icon={soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
              label="Sound"
              description="Play sounds for notifications"
            >
              <Toggle enabled={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} />
            </SettingItem>

            <SettingItem 
              icon={<FaEnvelope />}
              label="Email Notifications"
              description="Receive notifications via email"
            >
              <Toggle enabled={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
            </SettingItem>

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '500' }}>
                Notification Types
              </div>
              
              <SettingItem 
                icon={<FaBell />}
                label="Comments"
                description="When someone comments on your post"
              >
                <Toggle enabled={commentNotifications} onChange={() => setCommentNotifications(!commentNotifications)} />
              </SettingItem>

              <SettingItem 
                icon={<FaBell />}
                label="Mentions"
                description="When someone mentions you"
              >
                <Toggle enabled={mentionNotifications} onChange={() => setMentionNotifications(!mentionNotifications)} />
              </SettingItem>

              <SettingItem 
                icon={<FaBell />}
                label="New Followers"
                description="When someone follows you"
              >
                <Toggle enabled={followNotifications} onChange={() => setFollowNotifications(!followNotifications)} />
              </SettingItem>

              <SettingItem 
                icon={<FaBell />}
                label="Messages"
                description="When you receive a new message"
              >
                <Toggle enabled={messageNotifications} onChange={() => setMessageNotifications(!messageNotifications)} />
              </SettingItem>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', color: darkMode ? '#e2e8f0' : '#1e293b' }}>Privacy & Security</h2>
            
            <SettingItem 
              icon={<FaLock />}
              label="Private Account"
              description="Only approved followers can see your posts"
            >
              <Toggle enabled={privateAccount} onChange={() => setPrivateAccount(!privateAccount)} />
            </SettingItem>

            <SettingItem 
              icon={<FaEye />}
              label="Show Online Status"
              description="Let others see when you're active"
            >
              <Toggle enabled={showOnlineStatus} onChange={() => setShowOnlineStatus(!showOnlineStatus)} />
            </SettingItem>

            <SettingItem 
              icon={showReadReceipts ? <FaEye /> : <FaEyeSlash />}
              label="Read Receipts"
              description="Let others know when you've read their messages"
            >
              <Toggle enabled={showReadReceipts} onChange={() => setShowReadReceipts(!showReadReceipts)} />
            </SettingItem>

            <SettingItem 
              icon={<FaShieldAlt />}
              label="Two-Factor Authentication"
              description="Add an extra layer of security"
            >
              <Toggle enabled={twoFactorAuth} onChange={() => setTwoFactorAuth(!twoFactorAuth)} />
            </SettingItem>

            <div style={{ marginTop: '2rem' }}>
              <button
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: darkMode ? '#334155' : '#e2e8f0',
                  border: 'none',
                  borderRadius: '8px',
                  color: darkMode ? '#e2e8f0' : '#1e293b',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Blocked Users</span>
                <FaChevronRight style={{ color: '#64748b' }} />
              </button>
            </div>
          </div>
        );

      case 'account':
        return (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', color: darkMode ? '#e2e8f0' : '#1e293b' }}>Account</h2>
            
            {user && (
              <div style={{
                background: darkMode ? '#334155' : '#e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: user.profilePicture ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#fff', fontWeight: '600', fontSize: '1.5rem' }}>
                      {user.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem', color: darkMode ? '#e2e8f0' : '#1e293b' }}>
                    {user.username}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>@{user.username?.toLowerCase()}</div>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate(`/profile/${userId}`)}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: darkMode ? '#334155' : '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                color: darkMode ? '#e2e8f0' : '#1e293b',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaUser style={{ color: '#38bdf8' }} /> Edit Profile
              </span>
              <FaChevronRight style={{ color: '#64748b' }} />
            </button>

            <button
              style={{
                width: '100%',
                padding: '0.875rem',
                background: darkMode ? '#334155' : '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                color: darkMode ? '#e2e8f0' : '#1e293b',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaLock style={{ color: '#a855f7' }} /> Change Password
              </span>
              <FaChevronRight style={{ color: '#64748b' }} />
            </button>

            <button
              style={{
                width: '100%',
                padding: '0.875rem',
                background: darkMode ? '#334155' : '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                color: darkMode ? '#e2e8f0' : '#1e293b',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaDownload style={{ color: '#22c55e' }} /> Download Your Data
              </span>
              <FaChevronRight style={{ color: '#64748b' }} />
            </button>

            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
              <button
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaTrash /> Delete Account
              </button>
            </div>
          </div>
        );

      case 'language':
        return (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', color: darkMode ? '#e2e8f0' : '#1e293b' }}>Language & Region</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.85rem' }}>
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: darkMode ? '#334155' : '#e2e8f0',
                  border: 'none',
                  borderRadius: '8px',
                  color: darkMode ? '#e2e8f0' : '#1e293b',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="pt">Português</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        );

      case 'help':
        return (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', color: darkMode ? '#e2e8f0' : '#1e293b' }}>Help & Support</h2>
            
            <button
              style={{
                width: '100%',
                padding: '0.875rem',
                background: darkMode ? '#334155' : '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                color: darkMode ? '#e2e8f0' : '#1e293b',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}
            >
              <span>Help Center</span>
              <FaChevronRight style={{ color: '#64748b' }} />
            </button>

            <button
              style={{
                width: '100%',
                padding: '0.875rem',
                background: darkMode ? '#334155' : '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                color: darkMode ? '#e2e8f0' : '#1e293b',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}
            >
              <span>Report a Problem</span>
              <FaChevronRight style={{ color: '#64748b' }} />
            </button>

            <button
              style={{
                width: '100%',
                padding: '0.875rem',
                background: darkMode ? '#334155' : '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                color: darkMode ? '#e2e8f0' : '#1e293b',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}
            >
              <span>Privacy Policy</span>
              <FaChevronRight style={{ color: '#64748b' }} />
            </button>

            <button
              style={{
                width: '100%',
                padding: '0.875rem',
                background: darkMode ? '#334155' : '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                color: darkMode ? '#e2e8f0' : '#1e293b',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}
            >
              <span>Terms of Service</span>
              <FaChevronRight style={{ color: '#64748b' }} />
            </button>

            <div style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              Aurora Social v1.0.0
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: darkMode ? '#0f172a' : '#f1f5f9',
      padding: '6rem 1rem 2rem 1rem',
      overflow: 'visible'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: darkMode ? '#334155' : '#e2e8f0',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: darkMode ? '#e2e8f0' : '#1e293b'
            }}
          >
            <FaArrowLeft />
          </button>
          <h1 style={{ margin: 0, color: darkMode ? '#e2e8f0' : '#1e293b', fontSize: '1.5rem' }}>Settings</h1>
        </div>

        {/* Settings Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: '2rem',
          background: darkMode ? '#1e293b' : '#fff',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          {/* Sidebar */}
          <div style={{
            borderRight: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            paddingRight: '1.5rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <SectionButton id="appearance" icon={<FaSun />} label="Appearance" active={activeSection === 'appearance'} />
              <SectionButton id="notifications" icon={<FaBell />} label="Notifications" active={activeSection === 'notifications'} />
              <SectionButton id="privacy" icon={<FaUserShield />} label="Privacy & Security" active={activeSection === 'privacy'} />
              <SectionButton id="account" icon={<FaUser />} label="Account" active={activeSection === 'account'} />
              <SectionButton id="language" icon={<FaGlobe />} label="Language" active={activeSection === 'language'} />
              <SectionButton id="help" icon={<FaQuestion />} label="Help & Support" active={activeSection === 'help'} />
            </div>
          </div>

          {/* Content */}
          <div style={{ minHeight: '500px', overflowY: 'auto' }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
