import { useState } from 'react';
import { Activity } from 'lucide-react';
import { Field } from './components';

export function validateSetup(values) {
  if (!String(values.name || '').trim()) return 'Enter your username.';
  if (!Number.isFinite(Number(values.height)) || Number(values.height) < 50 || Number(values.height) > 260) return 'Enter a height between 50 and 260 cm.';
  if (!Number.isFinite(Number(values.weight)) || Number(values.weight) < 20 || Number(values.weight) > 400) return 'Enter a weight between 20 and 400 kg.';
  if (!String(values.fitnessGoal || '').trim()) return 'Choose your fitness focus.';
  return '';
}

export default function ProfileSetup({ profile, loading, error, onRetry, onSave, onSignOut }) {
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const invalid = validateSetup(values);
    if (invalid) { setLocalError(invalid); return; }
    setBusy(true); setLocalError('');
    try {
      await onSave({ ...profile, name: values.name.trim(), height: Number(values.height), weight: Number(values.weight), fitnessGoal: values.fitnessGoal, activityLevel: values.activityLevel, onboardingCompleted: true });
    } catch { setLocalError('Your profile could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  async function leave() {
    setBusy(true); setLocalError('');
    try { await onSignOut(); } catch { setLocalError('Could not sign out. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="profile-setup"><section className="panel setup-card" aria-labelledby="setup-heading">
    <Activity size={30} /><h1 id="setup-heading">Let’s make FitTrack yours</h1>
    <p>A few basics to set up your profile. You can change these later in My profile.</p>
    {(error || localError) && <div className="error-banner" role="alert">{localError || error}{error && <button className="button secondary" type="button" disabled={busy} onClick={onRetry}>Retry loading</button>}</div>}
    {loading ? <p role="status">{error ? 'Your profile is unavailable. Retry loading or use another account.' : 'Loading your profile…'}</p> : <form className="entry-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <Field label="Username" name="name" autoComplete="nickname" defaultValue={profile.name || ''} required maxLength={60} />
        <div className="form-grid"><Field label="Height (cm)" name="height" type="number" step="0.1" min="50" max="260" defaultValue={profile.height || ''} required /><Field label="Weight (kg)" name="weight" type="number" step="0.1" min="20" max="400" defaultValue={profile.weight || ''} required /></div>
        <label className="field"><span>Fitness focus</span><select name="fitnessGoal" defaultValue={profile.fitnessGoal || 'Build a consistent routine'} required>{[...new Set([profile.fitnessGoal, 'Build a consistent routine', 'Build strength', 'Improve endurance', 'Improve mobility', 'Manage my weight'].filter(Boolean))].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="field"><span>Current activity level</span><select name="activityLevel" defaultValue={profile.activityLevel || 'Just getting started'}>{['Just getting started', 'Occasionally active', 'Regularly active'].map(value => <option key={value}>{value}</option>)}</select></label>
      </fieldset>
      <button className="button primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save profile & continue'}</button>
    </form>}
    <button className="text-link" type="button" disabled={busy} onClick={leave}>Sign out / use another account</button>
  </section></main>;
}
