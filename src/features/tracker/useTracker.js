import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import dayjs from 'dayjs';
import { defaults, demoData, emptyData } from './data';
import { dataErrorMessage } from './dataErrors';

const KEY = 'fittrack.local.v1';
// Local keys mapped to their Firestore subcollection under users/{uid}.
const COLLECTIONS = { sessions: 'workoutSessions', meals: 'meals', customPlans: 'workouts', measurements: 'measurements' };
// Additions the rest of the app can live without. If one of these fails to load
// the page keeps working and only the panel that needs it reports the problem,
// so a missing Firestore rule for a new collection cannot black out the app.
const OPTIONAL = new Set(['measurements']);
function readLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && Array.isArray(raw.sessions) && Array.isArray(raw.meals)) return { ...emptyData(), ...raw, profile: { ...defaults, ...raw.profile } };
  } catch { /* A fresh local workspace remains usable when browser storage is unavailable. */ }
  return demoData();
}

export default function useTracker(user) {
  const [data, setData] = useState(() => user ? emptyData() : readLocal());
  const [error, setError] = useState('');
  const [loadErrors, setLoadErrors] = useState({});
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(Boolean(user));
  const [profileLoaded, setProfileLoaded] = useState(!user);
  useEffect(() => {
    if (!user || !db) return;
    const fail = key => failure => {
      setLoadErrors(previous => ({ ...previous, [key]: dataErrorMessage(failure, { profile: 'your profile', sessions: 'workout history', meals: 'your meals', customPlans: 'custom workouts', measurements: 'your weight log' }[key]) }));
      setLoading(false);
    };
    const ready = new Set();
    const markReady = key => {
      setLoadErrors(previous => { const next = { ...previous }; delete next[key]; return next; });
      ready.add(key); if (ready.size === 5) setLoading(false);
    };
    const stop = [onSnapshot(doc(db, 'users', user.uid), snap => {
      const p = snap.data() || {};
      setData(d => ({ ...d, profile: { ...defaults, name: user.displayName || '', ...p }, water: p.trackerWater || {}, steps: p.trackerSteps || {} })); setProfileLoaded(true); markReady('profile');
    }, fail('profile'))];
    for (const [key, path] of [['sessions', 'workoutSessions'], ['meals', 'meals'], ['customPlans', 'workouts'], ['measurements', 'measurements']]) {
      stop.push(onSnapshot(collection(db, 'users', user.uid, path), snap => { setData(d => ({ ...d, [key]: snap.docs.map(s => { const row = s.data(); const timestamp = row.completedAt || row.createdAt; return { ...row, id: s.id, ...(key !== 'customPlans' ? { date: row.date || (timestamp ? dayjs(timestamp.toDate?.() || timestamp).format('YYYY-MM-DD') : '') } : {}) }; }) })); markReady(key); }, fail(key)));
    }
    return () => stop.forEach(fn => fn());
  }, [user, attempt]);

  const blockingErrors = Object.fromEntries(Object.entries(loadErrors).filter(([key]) => !OPTIONAL.has(key)));

  async function commit(next, cloudWrite, profileOnly = false) {
    if (user && (profileOnly ? !profileLoaded || loadErrors.profile : loading || Object.keys(blockingErrors).length)) {
      setError('Wait until your account data has loaded before making changes. Resolve the loading error and retry.');
      return false;
    }
    setError('');
    try {
      if (user && db) await cloudWrite();
      else localStorage.setItem(KEY, JSON.stringify(next));
      if (!user) setData(next);
      return true;
    } catch { setError('Changes could not be saved. Check your connection and available browser storage, then retry.'); return false; }
  }
  const profileRef = () => doc(db, 'users', user.uid);
  const updateProfile = profile => commit({ ...data, profile }, () => setDoc(profileRef(), profile, { merge: true }), true);
  const toggleFavorite = id => {
    const current = data.profile.favoriteWorkoutIds || [];
    const selected = current.includes(id);
    const favoriteWorkoutIds = selected ? current.filter(value => value !== id) : [...current, id];
    return commit({ ...data, profile: { ...data.profile, favoriteWorkoutIds } }, () => setDoc(profileRef(), { favoriteWorkoutIds: selected ? arrayRemove(id) : arrayUnion(id) }, { merge: true }));
  };
  // Dismissed exercises still count as history; they are only kept out of suggestions.
  const dismissExercise = id => {
    const current = data.profile.dismissedExerciseIds || [];
    if (current.includes(id)) return Promise.resolve(true);
    return commit({ ...data, profile: { ...data.profile, dismissedExerciseIds: [...current, id] } },
      () => setDoc(profileRef(), { dismissedExerciseIds: arrayUnion(id) }, { merge: true }));
  };
  const restoreExercises = () => commit({ ...data, profile: { ...data.profile, dismissedExerciseIds: [] } },
    () => setDoc(profileRef(), { dismissedExerciseIds: [] }, { merge: true }));
  const setDaily = (key, date, value) => {
    const values = { ...data[key], [date]: value };
    return commit({ ...data, [key]: values }, () => setDoc(profileRef(), { [key === 'water' ? 'trackerWater' : 'trackerSteps']: values }, { merge: true }));
  };
  const add = (key, record) => {
    const row = { ...record, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const path = COLLECTIONS[key];
    return commit({ ...data, [key]: [row, ...data[key]] }, () => setDoc(doc(db, 'users', user.uid, path, row.id), row));
  };
  const edit = (key, id, record) => {
    const changes = { ...record, updatedAt: new Date().toISOString() };
    return commit({ ...data, [key]: data[key].map(row => row.id === id ? { ...row, ...changes, id } : row) },
      () => setDoc(doc(db, 'users', user.uid, COLLECTIONS[key], id), changes, { merge: true }));
  };
  const editPlan = (id, record) => commit({ ...data, customPlans: data.customPlans.map(p => p.id === id ? { ...p, ...record } : p) }, () => setDoc(doc(db, 'users', user.uid, 'workouts', id), record, { merge: true }));
  const remove = (key, id) => commit({ ...data, [key]: data[key].filter(r => r.id !== id) }, () => deleteDoc(doc(db, 'users', user.uid, COLLECTIONS[key], id)));
  const resetLocal = () => commit(emptyData(), async () => {});
  const retryLoad = () => { setError(''); setLoading(true); setAttempt(value => value + 1); };
  return { data, error, loadErrors, blockingErrors, retryLoad, loading, profileLoaded, updateProfile, toggleFavorite, dismissExercise, restoreExercises, setDaily, add, edit, editPlan, remove, resetLocal };
}
