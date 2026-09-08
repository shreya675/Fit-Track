import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation, Link } from 'react-router-dom';
import { Activity, ArrowDownToLine, ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Dumbbell, LayoutDashboard, Leaf, LogIn, Menu, Plus, Settings2, TrendingUp, UserRound, Utensils, X } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import dayjs from 'dayjs';
import { auth, provider } from './firebase';
import { useAuth } from './context/AuthContext';
import useTracker from './features/tracker/useTracker';
import { summarize, today } from './features/tracker/data';
import { Modal, EntryForm, WorkoutSession } from './features/tracker/components';
import { Overview, Workouts, Nutrition, ProgressPage, Profile, Settings } from './features/tracker/pages';
import './App.css';
const nav = [['/dashboard', LayoutDashboard, 'Overview'], ['/workouts', Dumbbell, 'Workouts'], ['/nutrition', Utensils, 'Nutrition'], ['/progress', TrendingUp, 'Progress']];
export default function App() { const { currentUser } = useAuth(); return <Tracker key={currentUser?.uid || 'local'} user={currentUser} />; }
function Tracker({ user }) {
  const tracker = useTracker(user), { data, error, loading } = tracker;
  const { logout } = useAuth();
  const [menu, setMenu] = useState(false), [modal, setModal] = useState(null), [toast, setToast] = useState(''), [busy, setBusy] = useState(false);
  const location = useLocation(), stats = summarize(data), p = data.profile;
  const page = [...nav, ['/profile', UserRound, 'My profile'], ['/settings', Settings2, 'Settings']].find(([path]) => path === location.pathname)?.[2] || 'Overview';
  useEffect(() => { document.title = `${page} · FitTrack`; }, [page]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t); }, [toast]);
  async function save(action, message) { setBusy(true); try { const ok = await action(); if (ok) { setModal(null); setToast(message); } return ok; } finally { setBusy(false); } }
  async function signIn() { if (!auth) return; setBusy(true); try { await signInWithPopup(auth, provider); } catch { setToast('Sign-in was not completed. Please try again.'); } finally { setBusy(false); } }
  function exportData() { const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `fittrack-${today()}.json`; a.click(); URL.revokeObjectURL(url); setToast('Your fitness data has been exported.'); }
  const actions = { tracker, stats, setModal, save, busy, exportData };
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
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenu(true)}><Menu size={22} /></button><span>My workspace</span><ChevronRight size={14} /><strong>{page}</strong></div><div className="topbar-right"><span className="today"><CalendarDays size={16} />{dayjs().format('ddd, D MMM YYYY')}</span><Link to="/profile" className="avatar small" aria-label="Open profile">{(p.name || 'Y').slice(0, 1)}</Link></div></header>
      <main id="main">
        <div className="page-heading"><div><div className="eyebrow">{page === 'Overview' ? 'YOUR DAILY CHECK-IN' : 'MAKE ROOM FOR YOURSELF'}</div><h1>{page === 'Overview' ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}${p.name ? `, ${p.name.split(' ')[0]}` : ''}` : page}<span className="heading-dot">.</span></h1><p>{({ Overview: 'A little movement. A little progress. All yours.', Workouts: 'Find your next session. Show up at your own pace.', Nutrition: 'A clearer picture of what fuels your day.', Progress: 'See the work you’ve been putting in.', 'My profile': 'Your goals, on your terms.', Settings: 'A workspace that works for you.' })[page]}</p></div>{page === 'Nutrition' ? <button className="button primary" onClick={() => setModal({ type: 'meal' })}><Plus size={18} />Log a meal</button> : ['Overview', 'Workouts'].includes(page) ? <button className="button primary" onClick={() => setModal({ type: 'workout' })}><Plus size={18} />Log a workout</button> : <button className="button secondary" onClick={exportData}><ArrowDownToLine size={17} />Export data</button>}</div>
        {!user && <div className="local-notice"><span><span className="status-dot" />{data.demo ? 'You’re exploring sample data.' : 'Local workspace.'} <span className="notice-detail">{data.demo ? 'Try everything, or start fresh with your own goals.' : 'Your entries are saved in this browser.'}</span></span><button onClick={() => setModal({ type: data.demo ? 'fresh' : 'storage' })}>{data.demo ? 'Make it yours' : 'About storage'}<ArrowRight size={15} /></button></div>}
        {error && <div className="error-banner" role="alert">{error}</div>}
        {loading ? <div className="empty" role="status">Loading your workspace…</div> : <Routes><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/dashboard" element={<Overview {...actions} />} /><Route path="/workouts" element={<Workouts {...actions} />} /><Route path="/nutrition" element={<Nutrition {...actions} />} /><Route path="/progress" element={<ProgressPage {...actions} />} /><Route path="/profile" element={<Profile key={p.name + p.dailySteps} {...actions} />} /><Route path="/settings" element={<Settings {...actions} user={user} signIn={signIn} signOut={async () => { try { await logout(); } catch { setToast('Unable to sign out. Please try again.'); } }} />} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes>}
        <footer><span>fittrack<span className="heading-dot">.</span> <span className="footer-copy">Built around your everyday.</span></span><span>{user ? 'Connected account' : 'Saved on this device'}<span className="status-dot" /></span></footer>
      </main>
    </div>
    {toast && <div className="toast" role="status"><CheckCircle2 size={19} />{toast}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={16} /></button></div>}
    {modal && <Modal title={({ workout: 'Log a workout', meal: 'Log a meal', steps: 'Update today’s steps', fresh: 'Your fresh start', storage: 'Your data, your choice', delete: 'Remove this entry?', plan: modal.plan?.title, custom: 'Create a workout' })[modal.type]} close={() => !busy && setModal(null)}>
      {['workout', 'meal', 'steps', 'custom'].includes(modal.type) && <EntryForm type={modal.type} initial={modal.initial} busy={busy} onSubmit={values => save(() => modal.type === 'steps' ? tracker.setDaily('steps', today(), values.steps) : modal.type === 'custom' && modal.initial?.id ? tracker.editPlan(modal.initial.id, values) : tracker.add(modal.type === 'workout' ? 'sessions' : modal.type === 'custom' ? 'customPlans' : 'meals', values), modal.type === 'steps' ? 'Step count updated.' : 'Your entry has been saved.')} />}
      {modal.type === 'plan' && <WorkoutSession plan={modal.plan} busy={busy} onComplete={values => save(() => tracker.add('sessions', values), 'Workout saved. Nice work showing up!')} />}
      {modal.type === 'fresh' && <><p className="modal-copy">Clear the sample workouts and meals, then add your name and goals in your profile. This also removes any entries you added to this local sample workspace.</p><div className="modal-actions"><button className="button secondary" onClick={() => setModal(null)}>Keep exploring</button><button className="button primary" disabled={busy} onClick={() => save(tracker.resetLocal, 'Your workspace is ready. Set your goals in My profile.')}>Start fresh<ArrowRight size={16} /></button></div></>}
      {modal.type === 'delete' && <><p className="modal-copy">“{modal.name}” will be removed from your history and totals. This cannot be undone.</p><div className="modal-actions"><button className="button secondary" onClick={() => setModal(null)}>Keep entry</button><button className="button danger" disabled={busy} onClick={() => save(() => tracker.remove(modal.key, modal.id), 'Entry removed.')}>Remove entry</button></div></>}
      {modal.type === 'storage' && <><p className="modal-copy">Local entries stay in this browser. Export a backup before clearing browser data or changing devices. Sample data is kept separate from a signed-in account.</p>{auth ? <><p className="modal-copy">Sign in with Google to access your Firebase account. Your local entries will stay here and won’t be copied into your account.</p><button className="button primary" disabled={busy} onClick={signIn}><LogIn size={17} />Sign in with Google</button></> : <p className="modal-copy">Account sync isn’t available in this installation. You can use all tracking features locally.</p>}</>}
    </Modal>}
  </div>;
}

