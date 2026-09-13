import { useEffect, useState } from 'react';
import { Activity, ArrowRight, Check, LogIn } from 'lucide-react';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';
import { signInErrorMessage } from '../features/tracker/authErrors';
import './Welcome.css';

export default function Welcome({ onExploreDemo, onAuthenticated = () => {}, currentUser, onContinue, onSwitchAccount, authError = '' }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');

  async function submitEmail(event) {
    event.preventDefault();
    if (pending) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!auth) { setError('Account access is temporarily unavailable. Please try the demo.'); return; }
    if (mode === 'signup' && values.password !== values.confirmPassword) { setError('Your passwords do not match.'); return; }
    setPending(true); setError(''); setMessage('');
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, values.email.trim());
        setMessage('If an account uses this email, you will receive a password reset link.');
      } else {
        await (mode === 'signup' ? createUserWithEmailAndPassword : signInWithEmailAndPassword)(auth, values.email.trim(), values.password);
        onAuthenticated();
      }
    } catch (failure) { setError(signInErrorMessage(failure, window.location.hostname)); }
    finally { setPending(false); }
  }

  async function accountAction(action) {
    setPending(true); setError('');
    try { await action(); } catch { setError('Could not switch accounts. Please try again.'); }
    finally { setPending(false); }
  }

  useEffect(() => { document.title = 'Welcome · FitTrack'; }, []);

  async function signIn() {
    if (pending) return;
    if (!auth || !provider) {
      setError('Account access is temporarily unavailable. Please try the demo.');
      return;
    }
    setError('');
    setPending(true);
    try {
      await signInWithPopup(auth, provider);
      onAuthenticated();
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
        <p>Create an account, log in, or try FitTrack with a demo.</p>
        {currentUser ? <div className="entry-form"><p>Signed in as {currentUser.email || currentUser.displayName}</p><button className="button primary welcome-action" disabled={pending} onClick={onContinue}>Continue to my account<ArrowRight size={18} /></button><button className="button secondary welcome-action" disabled={pending} onClick={() => accountAction(onSwitchAccount)}>Log in to another account</button></div> : <>
        <div className="auth-modes" aria-label="Account options">{[['login', 'Log in'], ['signup', 'Create account']].map(([value, label]) => <button key={value} type="button" aria-pressed={mode === value} disabled={pending} onClick={() => { setMode(value); setError(''); setMessage(''); }}>{label}</button>)}</div>
        <form className="entry-form" onSubmit={submitEmail} key={mode}>
          {mode === 'reset' && <h3>Reset your password</h3>}
          <label className="field"><span>Email address</span><input name="email" type="email" autoComplete="email" required maxLength={254} disabled={pending} /></label>
          {mode !== 'reset' && <label className="field"><span>Password</span><input name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} required disabled={pending} />{mode === 'signup' && <small>Use at least 8 characters.</small>}</label>}
          {mode === 'signup' && <label className="field"><span>Confirm password</span><input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} disabled={pending} /></label>}
          <button className="button primary welcome-action" disabled={pending} type="submit">{pending ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Log in'}</button>
          <button type="button" className="text-link" disabled={pending} onClick={() => { setMode(mode === 'reset' ? 'login' : 'reset'); setError(''); setMessage(''); }}>{mode === 'reset' ? 'Back to log in' : 'Forgot password?'}</button>
        </form>
        <div className="welcome-divider"><span />or use Google<span /></div>
        <button type="button" className="button secondary welcome-action" disabled={pending} onClick={signIn}><LogIn size={19} />Sign in with Google<ArrowRight size={18} /></button>
        </>}
        <span className="welcome-action-note">Your own profile. Your progress, saved to your account.</span>
        {(error || authError) && <div className="error-banner welcome-error" role="alert">{error || authError}</div>}
        {message && <p role="status">{message}</p>}
        <div className="welcome-divider"><span />or<span /></div>
        <button type="button" className="button secondary welcome-action" disabled={pending} onClick={() => accountAction(onExploreDemo)}>Explore demo<ArrowRight size={18} /></button>
        <span className="welcome-action-note">Try the full experience with a sample profile. No account needed.</span>
        <div className="welcome-privacy">Demo activity stays in this browser and is never added to your personal account.</div>
      </div>
      <span className="welcome-footer">FitTrack</span>
    </section>
  </div>;
}
