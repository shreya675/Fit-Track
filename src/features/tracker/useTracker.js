import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import dayjs from 'dayjs';
import { defaults, demoData, emptyData } from './data';

const KEY = 'fittrack.local.v1';
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
  const [loading, setLoading] = useState(Boolean(user));
  useEffect(() => {
    if (!user || !db) return;
    const fail = () => { setError('Your account could not be loaded. Check your connection or try again.'); setLoading(false); };
    const ready = new Set();
    const markReady = key => { ready.add(key); if (ready.size === 4) setLoading(false); };
    const stop = [onSnapshot(doc(db, 'users', user.uid), snap => {
      const p = snap.data() || {};
      setData(d => ({ ...d, profile: { ...defaults, name: user.displayName || '', ...p }, water: p.trackerWater || {}, steps: p.trackerSteps || {} })); markReady('profile');
    }, fail)];
    for (const [key, path] of [['sessions', 'workoutSessions'], ['meals', 'meals'], ['customPlans', 'workouts']]) {
      stop.push(onSnapshot(collection(db, 'users', user.uid, path), snap => { setData(d => ({ ...d, [key]: snap.docs.map(s => { const row = s.data(); const timestamp = row.completedAt || row.createdAt; return { ...row, id: s.id, ...(key !== 'customPlans' ? { date: row.date || (timestamp ? dayjs(timestamp.toDate?.() || timestamp).format('YYYY-MM-DD') : '') } : {}) }; }) })); markReady(key); }, fail));
    }
    return () => stop.forEach(fn => fn());
  }, [user]);

  async function commit(next, cloudWrite) {
    setError('');
    try {
      if (user && db) await cloudWrite();
      else localStorage.setItem(KEY, JSON.stringify(next));
      if (!user) setData(next);
      return true;
    } catch { setError('Changes could not be saved. Check your connection and available browser storage, then retry.'); return false; }
  }
  const profileRef = () => doc(db, 'users', user.uid);
  const updateProfile = profile => commit({ ...data, profile }, () => setDoc(profileRef(), profile, { merge: true }));
  const setDaily = (key, date, value) => {
    const values = { ...data[key], [date]: value };
    return commit({ ...data, [key]: values }, () => setDoc(profileRef(), { [key === 'water' ? 'trackerWater' : 'trackerSteps']: values }, { merge: true }));
  };
  const add = (key, record) => {
    const row = { ...record, id: crypto.randomUUID() };
    const path = { sessions: 'workoutSessions', meals: 'meals', customPlans: 'workouts' }[key];
    return commit({ ...data, [key]: [row, ...data[key]] }, () => setDoc(doc(db, 'users', user.uid, path, row.id), row));
  };
  const editPlan = (id, record) => commit({ ...data, customPlans: data.customPlans.map(p => p.id === id ? { ...p, ...record } : p) }, () => setDoc(doc(db, 'users', user.uid, 'workouts', id), record, { merge: true }));
  const remove = (key, id) => commit({ ...data, [key]: data[key].filter(r => r.id !== id) }, () => deleteDoc(doc(db, 'users', user.uid, key === 'sessions' ? 'workoutSessions' : key === 'customPlans' ? 'workouts' : 'meals', id)));
  const resetLocal = () => commit(emptyData(), async () => {});
  return { data, error, loading, updateProfile, setDaily, add, editPlan, remove, resetLocal };
}
