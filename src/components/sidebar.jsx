import React from 'react';
import { NavLink } from 'react-router-dom';
import './sidebar.css';

function Sidebar({ isOpen, setIsOpen }) {
  const handleLinkClick = () => {
    if (window.innerWidth <= 768 && setIsOpen) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <h2>FitnessPro</h2>
      <ul>
        <li><NavLink to="/dashboard" onClick={handleLinkClick}>Dashboard</NavLink></li>
        <li><NavLink to="/workouts" onClick={handleLinkClick}>Workouts</NavLink></li>
        <li><NavLink to="/nutrition" onClick={handleLinkClick}>Nutrition</NavLink></li>
        <li><NavLink to="/settings" onClick={handleLinkClick}>Settings</NavLink></li>
        <li><NavLink to="/profile" onClick={handleLinkClick}>Profile</NavLink></li>
      </ul>
    </div>
  );
}

export default Sidebar;
