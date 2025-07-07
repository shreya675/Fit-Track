import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';
import './Login.css'; // (we’ll create this next)
//import logo from '../assets/logo.png'; // optional: add a logo for FitTrack

const Login_temp = ({ onLogin }) => {
  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      onLogin(result.user);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="app-name">FitTrack</h1>
        <p>Track your fitness journey with ease 💪</p>
        <button className="login-button" onClick={handleSignIn}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login_temp;
