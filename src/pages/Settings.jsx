import React from 'react';
import './settings.css';

const Settings = () => {
  return (
    <div className="settings-container">
      <h2 className="settings-title">Settings</h2>

      <div className="settings-grid">

        {/* 👤 Profile Settings */}
        <div className="settings-card">
          <h3>Profile</h3>
          <div className="form-group">
            <label>Name</label>
            <input type="text" placeholder="Your Name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Change Password" />
          </div>
        </div>

        {/* 🌗 Preferences */}
        <div className="settings-card">
          <h3>Preferences</h3>
          <div className="form-group toggle-row">
            <label>Dark Mode</label>
            <input type="checkbox" />
          </div>
          <div className="form-group toggle-row">
            <label>Email Notifications</label>
            <input type="checkbox" />
          </div>
        </div>

        {/* 📞 Support */}
        <div className="settings-card">
          <h3>Support</h3>
          <p>Need help or have feedback?</p>
          <button className="support-btn">Contact Us</button>
          <button className="support-btn">FAQs</button>
        </div>

        {/* ⚠️ Account Actions */}
        <div className="settings-card">
          <h3>Account</h3>
          <button className="danger-button">Logout</button>
          <button className="danger-button">Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
