import { useEffect, useState } from 'react';
import { Activity, ArrowRight, Check, LogIn } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';
import { signInErrorMessage } from '../features/tracker/authErrors';
import './Welcome.css';

export default function Welcome({ onExploreDemo, authError = '' }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { document.title = 'Welcome · FitTrack'; }, []);

  async function signIn() {
    if (pending) return;
    if (!auth || !provider) {
      setError('Account sign-in is not configured yet. You can explore the demo, or add your Firebase settings to .env and restart the server.');
      return;
    }
    setError('');
    setPending(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (failure) {
      setError(signInErrorMessage(failure, window.location.hostname));
    } finally {
      setPending(false);
    }
  }

  return <div className="welcome-page">
    <section className="welcome-story" aria-label="About FitTrack">
      <a href="/" className="brand"><span className="brand-mark"><Activity size={27} /></span>fittrack<span className="brand-dot">.</span></a>
      <div className="welcome-story-copy">
        <span className="eyebrow">A LITTLE, EVERY DAY</span>
        <h1>Track your fitness.</h1>
        <p>Keep your workouts, meals, and daily goals in one place.</p>
        <div className="welcome-benefits"><span><Check size={16} />Track your activity</span><span><Check size={16} />Build your routine</span><span><Check size={16} />See your progress</span></div>
      </div>
      <span className="welcome-photo-caption">ONE DAY AT A TIME.</span>
    </section>
    <section className="welcome-entry" aria-labelledby="welcome-heading">
      <div className="welcome-form">
        <span className="welcome-emblem"><Activity size={28} /></span>
        <span className="eyebrow">YOUR EVERYDAY FITNESS WORKSPACE</span>
        <h2 id="welcome-heading">Welcome to FitTrack<span className="heading-dot">.</span></h2>
        <p>Sign in to your account or explore the demo.</p>
        <button type="button" className="button primary welcome-action" disabled={pending} onClick={signIn}><LogIn size={19} />{pending ? 'Connecting to Google…' : 'Sign in with Google'}<ArrowRight size={18} /></button>
        <span className="welcome-action-note">Your own profile. Your progress, saved to your account.</span>
        {(error || authError) && <div className="error-banner welcome-error" role="alert">{error || authError}</div>}
        <div className="welcome-divider"><span />or<span /></div>
        <button type="button" className="button secondary welcome-action" disabled={pending} onClick={onExploreDemo}>Explore demo<ArrowRight size={18} /></button>
        <span className="welcome-action-note">Try the full experience with a sample profile. No account needed.</span>
        <div className="welcome-privacy">Demo activity stays in this browser and is never added to your personal account.</div>
      </div>
      <span className="welcome-footer">FitTrack</span>
    </section>
  </div>;
}
