import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';
import './Login.css';
import fitnessImage from '../assets/fitness.svg'; // add your image here

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
        <img src={fitnessImage} alt="Fitness" className="login-image" />
        <h1 className="app-name">Fit<span>Track</span></h1>
        <p className="tagline">Track your fitness journey with ease 💪</p>
        <button className="google-login-btn" onClick={handleSignIn}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login_temp;
