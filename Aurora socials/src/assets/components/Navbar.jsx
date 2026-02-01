import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaSignOutAlt, FaCog, FaDesktop, FaUser, FaBookmark } from 'react-icons/fa'
import { IoChatbubbleEllipses } from 'react-icons/io5'
import axios from '../../api/axios.js'
import './Navbar.css'

const Navbar = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false) // mobile menu
  const [searchOpen, setSearchOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)

  const username = localStorage.getItem('username') || 'User'
  const userId = localStorage.getItem('userId')

  // Fetch user profile picture
  useEffect(() => {
    const fetchProfilePic = async () => {
      if (userId) {
        try {
          const response = await axios.get(`/api/users/${userId}`)
          setProfilePicture(response.data.profilePicture)
        } catch (err) {
          console.error('Failed to fetch profile picture')
        }
      }
    }
    fetchProfilePic()
    
    // Listen for profile updates
    const handleProfileUpdate = () => fetchProfilePic()
    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate)
  }, [userId])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    navigate('/')
  }

  return (
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
        <li><a href="#support">Support</a></li>
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

      <div className='searchbox'>
        <input
          id="explore-input"
          className={`search-input ${searchOpen ? '' : 'hidden'}`}
          type="text"
          placeholder='Explore'
          aria-label="Explore"
        />
      </div>

      {/* Profile Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
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
              minWidth: '180px', overflow: 'hidden', zIndex: 1001
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
            <button
              onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left' }}
            >
              <FaUser style={{ color: '#38bdf8' }} /> Profile
            </button>
            <button
              onClick={() => { setShowProfileMenu(false); navigate('/saved'); }}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left' }}
            >
              <FaBookmark style={{ color: '#fbbf24' }} /> Saved
            </button>
            <button
              onClick={() => { setShowProfileMenu(false); /* TODO: navigate to settings */ }}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left' }}
            >
              <FaCog style={{ color: '#a3a3a3' }} /> Settings
            </button>
            <button
              onClick={() => { setShowProfileMenu(false); /* TODO: display settings */ }}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left' }}
            >
              <FaDesktop style={{ color: '#4ade80' }} /> Display
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
  )
}

export default Navbar
