import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate, Link } from 'react-router-dom';
import { Activity, ArrowDownToLine, ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Dumbbell, LayoutDashboard, Leaf, LogIn, Menu, Plus, Settings2, TrendingUp, UserRound, Utensils, X } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import dayjs from 'dayjs';
import { auth, provider } from './firebase';
import { useAuth } from './context/AuthContext';
import useTracker from './features/tracker/useTracker';
import useWorkoutDrafts from './features/tracker/useWorkoutDrafts';
import { summarize, today } from './features/tracker/data';
import { bodyWeight } from './features/tracker/calories';
import { Modal, EntryForm, WorkoutSession } from './features/tracker/components';
import { Overview, Workouts, Nutrition, ProgressPage, Profile, Settings } from './features/tracker/pages';
import Welcome from './pages/Welcome';
import ProfileSetup from './features/tracker/ProfileSetup';
import { signInErrorMessage } from './features/tracker/authErrors';
import './App.css';
const nav = [['/dashboard', LayoutDashboard, 'Overview'], ['/workouts', Dumbbell, 'Workouts'], ['/nutrition', Utensils, 'Nutrition'], ['/progress', TrendingUp, 'Progress']];
export default function App() {
  const { currentUser, loading, authError, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [demoActive, setDemoActive] = useState(() => {
    try { return sessionStorage.getItem('fittrack.demo.active') === 'true'; }
    catch { return false; }
  });

  async function exploreDemo() {
    if (currentUser) await logout();
    try { sessionStorage.setItem('fittrack.demo.active', 'true'); } catch { /* Still usable for this visit. */ }
    setDemoActive(true);
    navigate('/dashboard');
  }
  function leaveDemo() {
    try { sessionStorage.removeItem('fittrack.demo.active'); } catch { /* In-memory state still resets. */ }
    setDemoActive(false);
    navigate('/login');
  }

  if (loading) return <div className="auth-loading" role="status">Opening your workspace…</div>;
  const welcome = <Welcome currentUser={currentUser} onContinue={() => navigate('/dashboard')} onAuthenticated={() => navigate('/dashboard')} onSwitchAccount={async () => { await logout(); leaveDemo(); }} onExploreDemo={exploreDemo} authError={authError} />;
  if (location.pathname === '/') return welcome;
  if (currentUser) {
    if (location.pathname === '/login') return <Navigate to="/dashboard" replace />;
    return <Tracker key={currentUser.uid} user={currentUser} onExitDemo={leaveDemo} />;
  }
  if (!demoActive || location.pathname === '/login') return welcome;
  return <Tracker key="demo" user={null} onExitDemo={leaveDemo} />;
}
function Tracker({ user, onExitDemo }) {
  const tracker = useTracker(user), { data, error, loading } = tracker;
  const { logout } = useAuth();
  const { drafts, error: draftError, saveDraft, removeDraft, clearDrafts } = useWorkoutDrafts(user?.uid);
  const [menu, setMenu] = useState(false), [modal, updateModal] = useState(null), [toast, setToast] = useState(''), [busy, setBusy] = useState(false);
  function setModal(next) {
    if (next?.type === 'plan' && drafts[next.plan.id]) {
      const draft = drafts[next.plan.id];
      updateModal({ ...next, plan: draft.plan, draft });
    } else updateModal(next);
  }
  const [signInError, setSignInError] = useState('');
  const location = useLocation(), stats = summarize(data), p = data.profile;
  const page = [...nav, ['/profile', UserRound, 'My profile'], ['/settings', Settings2, 'Settings']].find(([path]) => path === location.pathname)?.[2] || 'Overview';
  useEffect(() => { document.title = `${page} · FitTrack`; }, [page]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t); }, [toast]);
  async function save(action, message) { setBusy(true); try { const ok = await action(); if (ok) { setModal(null); setToast(message); } return ok; } finally { setBusy(false); } }
  async function signIn() { if (!auth || busy) return; setSignInError(''); setBusy(true); try { await signInWithPopup(auth, provider); } catch (failure) { setSignInError(signInErrorMessage(failure, window.location.hostname)); } finally { setBusy(false); } }
  function exportData() { const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `fittrack-${today()}.json`; a.click(); URL.revokeObjectURL(url); setToast('Your fitness data has been exported.'); }
  const actions = { tracker, stats, setModal, save, busy, exportData };
  if (user && (!tracker.profileLoaded || !p.onboardingCompleted)) return <ProfileSetup profile={p} loading={!tracker.profileLoaded || Boolean(tracker.loadErrors.profile)} error={tracker.loadErrors.profile || error} onRetry={tracker.retryLoad} onSave={tracker.updateProfile} onSignOut={async () => { await logout(); onExitDemo(); }} />;
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    {menu && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMenu(false)} />}
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <Link className="brand" to="/dashboard" onClick={() => setMenu(false)}><span className="brand-mark"><Activity size={25} strokeWidth={2.6} /></span>fittrack<span className="brand-dot">.</span></Link>
      <span className="nav-label">YOUR WORKSPACE</span>
      <nav aria-label="Main navigation">{nav.map(([path, NavIcon, label]) => <NavLink key={path} to={path} onClick={() => setMenu(false)}><NavIcon size={20} />{label}{label === 'Overview' && <span className="nav-active-dot" />}</NavLink>)}</nav>
      <div className="sidebar-note"><span className="note-icon"><Leaf size={20} /></span><h3>A little, every day.</h3><p>Small steps become habits.<br />Make today one of them.</p><Link to="/profile" onClick={() => setMenu(false)}>Set your goals <ArrowRight size={16} /></Link></div>
      <div className="sidebar-bottom"><NavLink to="/settings" onClick={() => setMenu(false)}><Settings2 size={20} />Settings</NavLink><Link to="/profile" className="sidebar-profile" onClick={() => setMenu(false)}><span className="avatar">{(p.name || 'Y').slice(0, 1)}</span><span><strong>{p.name || 'Your workspace'}</strong><small>{user ? 'Personal account' : data.demo ? 'Sample workspace' : 'Local workspace'}</small></span><ChevronRight size={17} /></Link></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenu(true)}><Menu size={22} /></button><span>My workspace</span><ChevronRight size={14} /><strong>{page}</strong></div><div className="topbar-right">{!user && <button className="exit-demo" onClick={onExitDemo}>Exit demo</button>}<span className="today"><CalendarDays size={16} />{dayjs().format('ddd, D MMM YYYY')}</span><Link to="/profile" className="avatar small" aria-label="Open profile">{(p.name || 'Y').slice(0, 1)}</Link></div></header>
      <main id="main">
        <div className="page-heading"><div><div className="eyebrow">{page === 'Overview' ? 'YOUR DAILY CHECK-IN' : 'MAKE ROOM FOR YOURSELF'}</div><h1>{page === 'Overview' ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}${p.name ? `, ${p.name.split(' ')[0]}` : ''}` : page}<span className="heading-dot">.</span></h1><p>{({ Overview: 'Your activity and daily goals.', Workouts: 'Browse workouts or add your own routine.', Nutrition: 'Record meals and track daily nutrition.', Progress: 'View your workout history and activity totals.', 'My profile': 'Manage your personal details and goals.', Settings: 'Manage your account and data.' })[page]}</p></div>{page === 'Nutrition' ? <button className="button primary" onClick={() => setModal({ type: 'meal' })}><Plus size={18} />Log a meal</button> : ['Overview', 'Workouts'].includes(page) ? <button className="button primary" onClick={() => setModal({ type: 'workout' })}><Plus size={18} />Log a workout</button> : <button className="button secondary" onClick={exportData}><ArrowDownToLine size={17} />Export data</button>}</div>
        {!user && <div className="local-notice"><span><span className="status-dot" />{data.demo ? 'You’re exploring sample data.' : 'Local workspace.'} <span className="notice-detail">{data.demo ? 'Try everything, or start fresh with your own goals.' : 'Your entries are saved in this browser.'}</span></span><button onClick={() => setModal({ type: data.demo ? 'fresh' : 'storage' })}>{data.demo ? 'Make it yours' : 'About storage'}<ArrowRight size={15} /></button></div>}
        {draftError && <div className="error-banner" role="alert">{draftError}</div>}
        {Object.values(drafts).length > 0 && <section className="panel draft-panel" aria-label="Unfinished workouts"><h2>Unfinished workouts</h2><p className="muted">Saved on this device. Resume when you are ready.</p>{Object.values(drafts).map(draft => <div className="setting-row" key={draft.plan.id}><strong>{draft.plan.title}</strong><div className="entry-actions"><button className="button secondary" onClick={() => setModal({ type: 'plan', plan: draft.plan })}>Resume workout</button><button className="button secondary" onClick={() => setModal({ type: 'discard', plan: draft.plan })}>Discard</button></div></div>)}</section>}
        {Object.keys(tracker.blockingErrors || {}).length > 0 && <div className="error-banner" role="alert"><strong>Some account data is unavailable</strong>{Object.entries(tracker.blockingErrors).map(([key, message]) => <p key={key}>{message}</p>)}<button className="button secondary" disabled={loading} onClick={tracker.retryLoad}>{loading ? "Retrying…" : "Retry loading"}</button></div>}{error && <div className="error-banner" role="alert">{error}</div>}{signInError && <div className="error-banner" role="alert">{signInError}</div>}
        {loading || (Object.keys(tracker.blockingErrors).length > 0 && !["/profile", "/settings"].includes(location.pathname)) ? <div className="empty" role="status">{loading ? "Loading your workspace…" : "Your totals will appear once your account data is available."}</div> : <Routes><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/dashboard" element={<Overview {...actions} />} /><Route path="/workouts" element={<Workouts {...actions} />} /><Route path="/nutrition" element={<Nutrition {...actions} />} /><Route path="/progress" element={<ProgressPage {...actions} />} /><Route path="/profile" element={<Profile key={p.name + p.dailySteps} {...actions} />} /><Route path="/settings" element={<Settings {...actions} user={user} signIn={signIn} signOut={async () => { try { await logout(); onExitDemo(); } catch { setToast('Unable to sign out. Please try again.'); } }} />} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes>}
        <footer><span>fittrack<span className="heading-dot">.</span> <span className="footer-copy">Fitness tracker</span></span><span>{user ? 'Connected account' : 'Saved on this device'}<span className="status-dot" /></span></footer>
      </main>
    </div>
    {toast && <div className="toast" role="status"><CheckCircle2 size={19} />{toast}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={16} /></button></div>}
    {modal && <Modal title={modal.initial?.id ? ({ workout: 'Edit workout', meal: 'Edit meal', weight: 'Edit weight', custom: 'Edit workout routine' })[modal.type] : ({ discard: 'Discard unfinished workout?', workout: 'Log a workout', meal: 'Log a meal', steps: 'Update today’s steps', weight: 'Log your weight', fresh: 'Your fresh start', storage: 'Your data, your choice', delete: 'Remove this entry?', plan: modal.plan?.title, custom: 'Create a workout' })[modal.type]} close={() => !busy && setModal(null)}>{signInError && modal.type === 'storage' && <div className="error-banner" role="alert">{signInError}</div>}
      {['workout', 'meal', 'steps', 'custom', 'weight'].includes(modal.type) && <EntryForm key={`${modal.type}-${modal.initial?.id || "new"}`} type={modal.type} initial={modal.initial} busy={busy} bodyWeight={bodyWeight(data)} onSubmit={values => save(() => modal.type === 'steps' ? tracker.setDaily('steps', today(), values.steps) : modal.initial?.id ? tracker.edit({ workout: 'sessions', custom: 'customPlans', weight: 'measurements', meal: 'meals' }[modal.type], modal.initial.id, values) : tracker.add({ workout: 'sessions', custom: 'customPlans', weight: 'measurements', meal: 'meals' }[modal.type], values), { steps: 'Step count updated.', weight: 'Weight recorded.' }[modal.type] || 'Your entry has been saved.')} />}
      {modal.type === 'plan' && <WorkoutSession key={modal.plan.id} plan={modal.plan} draft={modal.draft} onDraft={saveDraft} sessions={data.sessions} bodyWeight={bodyWeight(data)} busy={busy} onComplete={values => save(async () => { const ok = await tracker.add('sessions', values); if (ok) removeDraft(modal.plan.id); return ok; }, 'Workout saved. Nice work showing up!')} />}
      {modal.type === 'fresh' && <><p className="modal-copy">Clear the sample workouts and meals, then add your name and goals in your profile. This also removes any entries you added to this local sample workspace.</p><div className="modal-actions"><button className="button secondary" onClick={() => setModal(null)}>Keep exploring</button><button className="button primary" disabled={busy} onClick={() => save(async () => { const ok = await tracker.resetLocal(); if (ok) clearDrafts(); return ok; }, 'Your workspace is ready. Set your goals in My profile.')}>Start fresh<ArrowRight size={16} /></button></div></>}
      {modal.type === 'discard' && <><p className="modal-copy">Discard the unfinished workout “{modal.plan.title}” and its entered sets?</p><div className="modal-actions"><button className="button secondary" onClick={() => setModal(null)}>Keep draft</button><button className="button danger" onClick={() => { removeDraft(modal.plan.id); setModal(null); }}>Discard draft</button></div></>}
      {modal.type === 'delete' && <><p className="modal-copy">“{modal.name}” will be removed from your history and totals. This cannot be undone.</p><div className="modal-actions"><button className="button secondary" onClick={() => setModal(null)}>Keep entry</button><button className="button danger" disabled={busy} onClick={() => save(() => tracker.remove(modal.key, modal.id), 'Entry removed.')}>Remove entry</button></div></>}
      {modal.type === 'storage' && <><p className="modal-copy">Local entries stay in this browser. Export a backup before clearing browser data or changing devices. Sample data is kept separate from a signed-in account.</p>{auth ? <><p className="modal-copy">Sign in with Google to access your Firebase account. Your local entries will stay here and won’t be copied into your account.</p><button className="button primary" disabled={busy} onClick={signIn}><LogIn size={17} />Sign in with Google</button></> : <p className="modal-copy">Account sync isn’t available in this installation. You can use all tracking features locally.</p>}</>}
    </Modal>}
  </div>;
}


