import React from 'react'
import './Navbar.css'

const Navbar = () => {
  return (
    <div className='navbar'>
      <img src="" alt="" className='logo' />
      <ul>
        <li>Home</li>
        <li>Profile</li>
        <li>Explore</li>
        <li>Support</li>
      </ul>
      
      <div className='searchbox'>
        <input type="text" placeholder='Search' />
        <button>Search</button>
      </div>   
      <img src="" alt="" className='usericon' />
      <h1>Navbar</h1>
    </div>
  )
}

export default Navbar
