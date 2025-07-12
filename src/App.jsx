import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { auth, provider } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

import Login from './pages/Login_temp';
import Sidebar from './components/sidebar';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Nutrition from './pages/Nutrition';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function App() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <>
      {/* Toggle Button for Mobile */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="sidebar-toggle"
      >
        ☰
      </button>

      {/* Layout */}
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        <div
          className="main-app-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            height: '100%',
            marginLeft: window.innerWidth > 768 ? '240px' : '0px',
            transition: 'margin-left 0.3s ease',
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
