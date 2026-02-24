import { useState } from 'react';
import Navbar from "./assets/components/Navbar.tsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import WelcomePage from "./assets/components/WelcomePage.tsx";
import Register from "./assets/components/Register.tsx";
import SignIn from "./assets/components/SignIn.tsx";
import ForgotPassword from "./assets/components/ForgotPassword.tsx";
import LandingPage from "./assets/components/LandingPage.tsx";
import SavedPosts from "./assets/components/SavedPosts.tsx";
import Profile from "./assets/components/Profile.tsx";
import PostView from "./assets/components/PostView.tsx";
import Friends from "./assets/components/Friends.tsx";
import Settings from "./assets/components/Settings.tsx";
import Support from "./assets/components/Support.tsx";
import IconTest from "./assets/components/IconTest.tsx";
import UserGenerator from "./assets/components/UserGenerator.tsx";
import AdminDashboard from "./assets/components/AdminDashboard.tsx";



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
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<Register />} />
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
        <Route path="/analytics" element={
          <>
            <Navbar />
            <AdminDashboard />
          </>
        } />
        {/* Add more routes as needed */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;