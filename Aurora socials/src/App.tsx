import React from 'react';
import Navbar from "./assets/components/Navbar.jsx";
import Register from "./assets/Register.jsx";


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
  return (
    <>
      <Navbar />
      <div className='container' style={{ paddingTop: '60px' }}>
        <Home />
        <Register />
      </div>
    </>
  );
}

export default App;