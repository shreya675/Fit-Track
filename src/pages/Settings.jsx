import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import './settings.css';

const initialSettings = {
  name: '',
  age: '',
  weight: '',
  height: '',
  fitnessGoal: '',
  activity: '',
  emailNotifications: true,
};

const Settings = () => {
  const { currentUser, logout } = useAuth();
  const [settings, setSettings] = useState(initialSettings);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser || !db) return;

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setSettings((current) => ({
          ...current,
          ...userDoc.data(),
          emailNotifications: userDoc.data().emailNotifications ?? true,
        }));
      }
    };

    loadSettings();
  }, [currentUser]);

  const handleChange = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!currentUser || !db) return;

    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          ...settings,
          email: currentUser.email,
        },
        { merge: true }
      );
      setStatus('Settings saved');
      window.setTimeout(() => setStatus(''), 2500);
    } catch (error) {
      console.error('Settings save failed:', error);
      setStatus('Unable to save settings');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-heading-row">
        <h2 className="settings-title">Settings</h2>
        {status && <span className="settings-status">{status}</span>}
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>Profile</h3>
          <div className="settings-fields-grid">
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={settings.name} onChange={(e) => handleChange('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={currentUser?.email || ''} disabled />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input type="number" value={settings.age} onChange={(e) => handleChange('age', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Weight</label>
              <input type="number" value={settings.weight} onChange={(e) => handleChange('weight', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Height</label>
              <input type="number" value={settings.height} onChange={(e) => handleChange('height', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Fitness Goal</label>
              <input type="text" value={settings.fitnessGoal} onChange={(e) => handleChange('fitnessGoal', e.target.value)} />
            </div>
          </div>
          <button className="support-btn" onClick={handleSave}>Save Profile</button>
        </div>

        <div className="settings-card">
          <h3>Preferences</h3>
          <div className="form-group">
            <label>Activity Level</label>
            <input type="text" value={settings.activity} onChange={(e) => handleChange('activity', e.target.value)} />
          </div>
          <div className="form-group toggle-row">
            <label>Dark Mode</label>
            <input type="checkbox" checked readOnly />
          </div>
          <div className="form-group toggle-row">
            <label>Email Notifications</label>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => handleChange('emailNotifications', e.target.checked)}
            />
          </div>
        </div>

        <div className="settings-card">
          <h3>Support</h3>
          <p>Need help or have feedback?</p>
          <div className="support-btn-group">
            <button className="support-btn">Contact Us</button>
            <button className="support-btn">FAQs</button>
          </div>
        </div>

        <div className="settings-card">
          <h3>Account</h3>
          <button className="dangerrr-button" onClick={handleLogout}>Logout</button>
          <button className="dangerrr-button" disabled>Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
