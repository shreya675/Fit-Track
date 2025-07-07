import React from 'react';
import { Link } from 'react-router-dom';
import './sidebar.css';

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>FitnessPro</h2>
      <ul>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/workouts">Workouts</Link></li>
        <li><Link to="/nutrition">Nutrition</Link></li>
        <li><Link to="/settings">Settings</Link></li>
        <li><Link to="/profile" >Profile</Link></li>
      </ul>
    </div>
  );
}

export default Sidebar;
