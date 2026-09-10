import { useState } from 'react';
import { ArrowRight, Clock3, Heart, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import { plans } from './data';
import { Empty, Icon } from './components';
import { selectWorkouts, workoutMinutes } from './workoutFilters';
import './workoutLibrary.css';

export default function WorkoutLibrary({ tracker, setModal }) {
  const [category, setCategory] = useState('All workouts');
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('Any level');
  const [duration, setDuration] = useState('Any duration');
  const [sort, setSort] = useState('default');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const favorites = tracker.data.profile.favoriteWorkoutIds || [];
  const allPlans = [...plans, ...tracker.data.customPlans];
  const list = selectWorkouts(allPlans, { query, category, difficulty, duration, favoritesOnly, favorites, sort });
  const filtered = query || category !== 'All workouts' || difficulty !== 'Any level' || duration !== 'Any duration' || favoritesOnly;

  function clearFilters() {
    setQuery(''); setCategory('All workouts'); setDifficulty('Any level');
    setDuration('Any duration'); setFavoritesOnly(false); setSort('default');
  }
  async function toggleFavorite(plan) {
    if (saving) return;
    setSaving(true);
    setStatus('');
    try {
      const ok = await tracker.toggleFavorite(plan.id);
      setStatus(ok ? `${plan.title} ${favorites.includes(plan.id) ? 'removed from' : 'added to'} favorites.` : 'Favorite could not be saved. Check the account message above and try again.');
    } finally { setSaving(false); }
  }

  return <>
    <div className="library-toolbar">
      <div className="filters">{['All workouts', 'Strength', 'Cardio', 'Mobility'].map(value => <button key={value} aria-pressed={category === value} className={category === value ? 'active' : ''} onClick={() => setCategory(value)}>{value}</button>)}</div>
      <label className="search"><Search size={17} /><input aria-label="Search workouts, equipment, or exercises" placeholder="Search workouts or equipment" value={query} onChange={e => setQuery(e.target.value)} /></label>
    </div>
    <div className="workout-filter-row">
      <label>Difficulty<select value={difficulty} onChange={e => setDifficulty(e.target.value)}>{['Any level', 'Beginner', 'Intermediate', 'Advanced'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Duration<select value={duration} onChange={e => setDuration(e.target.value)}><option>Any duration</option><option value="15">15 minutes or less</option><option value="30">16–30 minutes</option><option value="long">Over 30 minutes</option></select></label>
      <label>Sort by<select value={sort} onChange={e => setSort(e.target.value)}><option value="default">Default order</option><option value="shortest">Shortest first</option><option value="longest">Longest first</option><option value="name">Name (A–Z)</option></select></label>
      <button className={`button secondary favorites-filter ${favoritesOnly ? 'selected' : ''}`} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly(value => !value)}><Heart size={16} fill={favoritesOnly ? 'currentColor' : 'none'} />Favorites</button>
    </div>
    <div className="workout-results"><span role="status">{list.length} of {allPlans.length} workouts</span>{filtered && <button className="text-link" onClick={clearFilters}>Clear filters</button>}</div>
    {status && <p className="favorite-status" role="status">{status}</p>}
    <div className="workout-grid">{list.map(plan => {
      const custom = tracker.data.customPlans.some(p => p.id === plan.id);
      const lastSession = tracker.data.sessions.filter(s => s.planId === plan.id || (!s.planId && s.title === plan.title)).sort((a, b) => b.date.localeCompare(a.date))[0];
      const exercises = Array.isArray(plan.exercises) ? plan.exercises : String(plan.exercises || '').split(',').filter(Boolean);
      return <article className="panel workout-card library-card" key={plan.id}>
        <div className="routine-card-heading"><span className={`exercise-icon ${plan.category?.toLowerCase()}`}><Icon category={plan.category} /></span><span>{plan.category}{custom ? ' · Custom' : ''}</span><button className={`icon-button favorite-button ${favorites.includes(plan.id) ? 'saved' : ''}`} disabled={saving} aria-pressed={favorites.includes(plan.id)} aria-label={`${favorites.includes(plan.id) ? 'Remove' : 'Save'} ${plan.title} ${favorites.includes(plan.id) ? 'from' : 'to'} favorites`} onClick={() => toggleFavorite(plan)}><Heart size={19} fill={favorites.includes(plan.id) ? 'currentColor' : 'none'} /></button></div>
        <div className="workout-card-body"><h2>{plan.title}</h2><p>{plan.description || plan.notes || 'Your custom workout routine.'}</p>
          <div className="workout-meta"><span><Clock3 size={15} />{workoutMinutes(plan)} min</span><span>{exercises.length} exercises</span><span>{plan.difficulty || 'Not specified'}</span></div>
          <p className="routine-equipment"><strong>Equipment</strong>{plan.equipment || 'Not specified'}</p>
          <p className="routine-last-session">{lastSession ? `Last completed ${dayjs(lastSession.date).format('D MMM YYYY')}` : 'Not completed yet'}</p>
          <button className="button secondary" onClick={() => setModal({ type: 'plan', plan })}>View workout<ArrowRight size={16} /></button>
          {custom && <div className="custom-actions"><button className="text-link" onClick={() => setModal({ type: 'custom', initial: { ...plan, durationMinutes: workoutMinutes(plan) } })}><Pencil size={14} />Edit routine</button><button className="icon-button" aria-label={`Delete ${plan.title}`} onClick={() => setModal({ type: 'delete', key: 'customPlans', id: plan.id, name: plan.title })}><Trash2 size={15} /></button></div>}
        </div>
      </article>;
    })}</div>
    {!list.length && <Empty title={favoritesOnly ? 'No matching favorites' : 'No matching workouts'} text={favoritesOnly ? 'Save workouts using the heart button, or clear your filters.' : 'Try another search or clear the filters.'} />}
    <button className="create-routine" onClick={() => setModal({ type: 'custom' })}><Plus size={20} /><strong>Create a workout</strong><span>Add your own exercises and equipment</span><ArrowRight size={18} /></button>
  </>;
}
