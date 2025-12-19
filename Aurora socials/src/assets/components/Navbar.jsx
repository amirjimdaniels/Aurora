import React, { useState } from 'react'
import './Navbar.css'

const Navbar = () => {
  const [open, setOpen] = useState(false) // mobile menu
  const [searchOpen, setSearchOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

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
        <li><a href="#home">Home</a></li>
        <li><a href="#profile">Profile</a></li>
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

      <img src="" alt="User avatar" className='usericon' />
    </nav>
  )
}

export default Navbar
