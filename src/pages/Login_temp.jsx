import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, firebaseSetupError, provider } from '../firebase';
import './Login.css';
import fitnessImage from '../assets/fitness.svg';

const Login_temp = () => {
  const navigate = useNavigate();

  const handleSignIn = async () => {
    if (!auth || !provider) return;

    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={fitnessImage} alt="Fitness" className="login-image" />
        <h1 className="app-name">Fit<span>Track</span></h1>
        <p className="tagline">Track your fitness journey with ease</p>
        {firebaseSetupError && (
          <p className="login-error">
            Firebase is not configured. Create a .env file from .env.example, then restart npm run dev.
          </p>
        )}
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
