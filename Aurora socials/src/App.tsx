import { useState } from 'react';
import Navbar from "./assets/components/Navbar.jsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Register from "./assets/components/Register.jsx";
import SignIn from "./assets/components/SignIn.jsx";
import ForgotPassword from "./assets/components/ForgotPassword.jsx";
import LandingPage from "./assets/components/LandingPage.jsx";
import SavedPosts from "./assets/components/SavedPosts.jsx";
import Profile from "./assets/components/Profile.jsx";
import PostView from "./assets/components/PostView.jsx";
import Friends from "./assets/components/Friends.jsx";
import Settings from "./assets/components/Settings.jsx";
import Support from "./assets/components/Support.jsx";
import IconTest from "./assets/components/IconTest.jsx";
import UserGenerator from "./assets/components/UserGenerator.jsx";



function Home() {
  return (
    <div style={{ padding: '6rem 1rem 1rem 1rem', textAlign: 'center' }}>
      <h1>Welcome to Aurora Socials</h1>
      <p>This is the home page. Use the navigation bar to explore.</p>
    </div>
  );
}
  // TODO: Add React Router for navigation between Home, Register, etc.
  // function Home() {
  //   return (
  //     <div style={{ padding: '6rem 1rem 1rem 1rem', textAlign: 'center' }}>
  //       <h1>Welcome to Aurora Socials</h1>
  //       <p>This is the home page. Use the navigation bar to explore.</p>
  //     </div>
  //   );
  // }




const App = () => {
  const [exploreSearchQuery, setExploreSearchQuery] = useState('');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/home" element={
          <>
            <Navbar />
            <div className='container' style={{ paddingTop: '60px' }}>
              <Home />
            </div>
          </>
        } />
        <Route path="/feed" element={
          <>
            <Navbar searchQuery={exploreSearchQuery} onSearchChange={setExploreSearchQuery} />
            <LandingPage searchQuery={exploreSearchQuery} />
          </>
        } />
        <Route path="/saved" element={
          <>
            <Navbar />
            <SavedPosts />
          </>
        } />
        <Route path="/profile" element={
          <>
            <Navbar />
            <Profile />
          </>
        } />
        <Route path="/profile/:userId" element={
          <>
            <Navbar />
            <Profile />
          </>
        } />
        <Route path="/post/:postId" element={
          <>
            <Navbar />
            <PostView />
          </>
        } />
        <Route path="/friends" element={
          <>
            <Navbar />
            <Friends />
          </>
        } />
        <Route path="/settings" element={
          <>
            <Navbar />
            <Settings />
          </>
        } />
        <Route path="/support" element={
          <>
            <Navbar />
            <Support />
          </>
        } />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/icon-test" element={
          <>
            <Navbar />
            <IconTest />
          </>
        } />
        <Route path="/generate-users" element={
          <>
            <Navbar />
            <UserGenerator />
          </>
        } />
        {/* Add more routes as needed */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;