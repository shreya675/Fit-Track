import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowLeft, Check, Clock3, Dumbbell, Footprints, Leaf, Pause, Play, X } from 'lucide-react';
import { today } from './data';
import { ExerciseChecklist, findExerciseArt } from './exerciseArt';
import { isLoggedSet, lastSetsFor } from './progressStats';
import { estimateCalories } from './calories';
const categoryIcon = { Strength: Dumbbell, Cardio: Footprints, Mobility: Leaf };
export function Icon({ category, size = 20 }) { const Component = categoryIcon[category] || Activity; return <Component size={size} />; }
export function Progress({ value, goal, className = '' }) { return <div className={`progress ${className}`} role="progressbar" aria-label="Goal progress" aria-valuenow={Math.round(Math.min(value / Math.max(goal, 1) * 100, 100))} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.min(value / Math.max(goal, 1) * 100, 100)}%` }} /></div>; }
export function PanelTitle({ title, children }) { return <div className="panel-title"><h2>{title}</h2>{children}</div>; }
export function Empty({ title, text }) { return <div className="empty"><Activity size={28} /><h3>{title}</h3><p>{text}</p></div>; }
export function Modal({ title, children, close }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = prev; }; }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === ref.current) close(); }}><div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={close}><X size={20} /></button></div>{children}</dialog>;
}
export function Field({ label, ...props }) { return <label className="field"><span>{label}</span><input {...props} /></label>; }
function Select({ label, children, ...props }) { return <label className="field"><span>{label}</span><select {...props}>{children}</select></label>; }
export function EntryForm({ type, initial = {}, onSubmit, busy, bodyWeight = null, onDraftChange }) {
  const isMeal = type === 'meal', custom = type === 'custom', weight = type === 'weight';
  // Activity calories follow the duration and category until they are typed over.
  const [minutes, setMinutes] = useState(initial.durationMinutes || '');
  const [category, setCategory] = useState(initial.category || 'Strength');
  const [calories, setCalories] = useState(String(initial.calories ?? 0));
  const [typedCalories, setTypedCalories] = useState(initial.calories != null);
  const [editedEntries, setEditedEntries] = useState(initial.entries || []);
  const formRef = useRef(null);
  // Capture calculated values after React updates the controlled inputs too.
  useEffect(() => {
    if (onDraftChange && formRef.current) onDraftChange(Object.fromEntries(new FormData(formRef.current)));
  }, [minutes, category, calories, onDraftChange]);
  const estimate = isMeal || custom || weight || type === 'steps' ? null
    : estimateCalories({ minutes, weightKg: bodyWeight?.weight, exercises: initial.exercises, category });
  useEffect(() => { if (!typedCalories && estimate !== null) setCalories(String(estimate)); }, [estimate, typedCalories]);
  function submit(e) { e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget)); for (const key of ['durationMinutes','calories','protein','carbs','fat','steps','weight']) if (key in f) f[key] = ['protein','carbs','fat'].includes(key) && f[key] === '' ? null : Number(f[key]); if (custom) f.exercises = f.exercises.split('\n').map(s=>s.trim()).filter(Boolean); if (initial.entries) f.entries = editedEntries.map(entry => ({ ...entry, sets: entry.sets.filter(isLoggedSet).map(set => ({ weight: Number(set.weight) || 0, reps: Number(set.reps) })) })); onSubmit(f); }
  return <form ref={formRef} onSubmit={submit} onChange={e => onDraftChange?.(Object.fromEntries(new FormData(e.currentTarget)))} className="entry-form">{weight ? <><p className="modal-copy">Weigh yourself at a similar time of day for readings you can compare.</p><div className="form-grid"><Field label="Weight (kg)" name="weight" type="number" step="0.1" min="20" max="400" defaultValue={initial.weight || ''} required autoFocus /><Field label="Date" name="date" type="date" defaultValue={initial.date || today()} max={today()} required /></div></> : type === 'steps' ? <><p className="modal-copy">Enter your total for today. This replaces your previous step count.</p><Field label="Total steps" name="steps" type="number" min="0" max="200000" defaultValue={initial.steps || 0} required /></> : <><Field label={isMeal ? 'What did you eat?' : 'Workout name'} name={isMeal ? 'name' : 'title'} placeholder={isMeal ? 'e.g. Rice bowl with vegetables' : 'e.g. Evening walk'} defaultValue={isMeal ? initial.name : initial.title} required maxLength={100} /><div className="form-grid"><Select label={isMeal ? 'Meal' : 'Category'} name={isMeal ? 'type' : 'category'} {...(isMeal ? { defaultValue: initial.type } : { value: category, onChange: e => setCategory(e.target.value) })}>{(isMeal ? ['Breakfast','Lunch','Dinner','Snack'] : ['Strength','Cardio','Mobility']).map(v=><option key={v}>{v}</option>)}</Select>{!custom && <Field label="Date" name="date" type="date" defaultValue={initial.date || today()} max={today()} required />}{!isMeal && <Field label="Duration (minutes)" name="durationMinutes" type="number" min="1" max="1440" value={minutes} onChange={e => setMinutes(e.target.value)} required />}{!custom && (isMeal
          ? <Field label="Calories (kcal)" name="calories" type="number" min="0" max="15000" defaultValue={initial.calories ?? ''} required />
          : <label className="field"><span>Activity calories (kcal)</span>
              <input name="calories" type="number" min="0" max="15000" required value={calories}
                onChange={e => { setTypedCalories(true); setCalories(e.target.value); }} />
              <small className="field-note">{typedCalories ? 'Your saved or entered calorie value is kept. You can change it here.' : estimate !== null
                ? `Estimated for ${minutes} minutes at ${bodyWeight.weight} kg${bodyWeight.source === 'profile' ? ' from your profile' : ''}. It is an average, not a measurement — type over it if you tracked your own.`
                : bodyWeight ? 'Add a duration and this will be estimated for you.'
                : 'Record your weight on the Progress page and these will be estimated for you.'}</small>
            </label>)}{isMeal && ['protein','carbs','fat'].map(key=><Field key={key} label={`${key[0].toUpperCase()+key.slice(1)} (g, optional)`} name={key} type="number" step="0.1" min="0" max="2000" defaultValue={initial[key] ?? ''} />)}</div>{custom && <div className="form-grid"><Select label="Difficulty" name="difficulty" defaultValue={initial.difficulty || "Beginner"}>{["Beginner", "Intermediate", "Advanced"].map(value => <option key={value}>{value}</option>)}</Select><Field label="Equipment" name="equipment" maxLength={200} defaultValue={initial.equipment || ""} placeholder="e.g. Dumbbells, bench, or none" /></div>}{custom && <label className="field"><span>Exercises (one per line)</span><textarea name="exercises" rows="5" defaultValue={Array.isArray(initial.exercises) ? initial.exercises.map(e => typeof e === 'string' ? e : e.name).join('\n') : initial.exercises || ''} maxLength={2000} placeholder={'Warm-up · 5 minutes\nSquat · 3 × 10'} required /></label>}{!isMeal && <label className="field"><span>{custom ? "Instructions (optional)" : "Session notes (optional)"}</span><textarea name="notes" rows="2" maxLength={1000} defaultValue={initial.notes || ""} placeholder={custom ? "Rest periods or exercise variations" : "Weights, reps, or how the session went"} /></label>}</>}{initial.entries?.length > 0 && <fieldset className="field"><legend>Recorded sets</legend><ExerciseChecklist checked={editedEntries.map((_, i) => i)} exercises={editedEntries.map(entry => entry.name)} sets={Object.fromEntries(editedEntries.map((entry, i) => [i, entry.sets]))} onSetsChange={(i, next) => setEditedEntries(current => current.map((entry, index) => index === i ? { ...entry, sets: next } : entry))} /></fieldset>}<div className="modal-actions"><button type="submit" className="button primary" disabled={busy}><Check size={17} />{busy ? 'Saving…' : initial.id ? 'Save changes' : custom ? 'Create workout' : weight ? 'Save weight' : 'Save entry'}</button></div></form>;
}
export function WorkoutSession({ plan, busy, onComplete, sessions = [], bodyWeight = null, draft, onDraft }) {
  const [running, setRunning] = useState(false), [elapsed, setElapsed] = useState(draft?.elapsed || 0), [started, setStarted] = useState(draft?.started || false), [finish, setFinish] = useState(draft?.finish || false);
  const [checked, setChecked] = useState(draft?.checked || []);
  const [sets, setSets] = useState(draft?.sets || {});
  const [review, setReview] = useState(draft?.review || {});
  const startedAt = useRef(0), accumulated = useRef(draft?.elapsed || 0);
  useEffect(() => {
    if (started || checked.length || Object.keys(sets).length) onDraft?.({ plan, elapsed, started, finish, checked, sets, review });
  }, [plan, elapsed, started, finish, checked, sets, review, onDraft]);
  useEffect(() => { if (!running) return; const t = setInterval(() => setElapsed(accumulated.current + Math.floor((Date.now() - startedAt.current) / 1000)), 250); return () => clearInterval(t); }, [running]);
  function toggle() { if (running) { accumulated.current += Math.floor((Date.now() - startedAt.current) / 1000); setElapsed(accumulated.current); } else { startedAt.current = Date.now(); setStarted(true); } setRunning(!running); }
  const exercises = Array.isArray(plan.exercises) ? plan.exercises : String(plan.exercises || '').split(',');
  // Each line is matched to the exercise library so sets carry a stable identity.
  const named = exercises.map(entry => {
    const art = findExerciseArt(entry);
    const raw = typeof entry === 'string' ? entry : entry?.name;
    return { slug: art?.slug || null, name: art?.name || String(raw || '').split('\u00b7')[0].trim() };
  });
  const lastSets = Object.fromEntries(named.map((item, i) => [i, lastSetsFor(sessions, item)]));
  const entries = named.map((item, i) => ({ ...item, sets: (sets[i] || []).filter(isLoggedSet).map(set => ({ weight: Number(set.weight) || 0, reps: Number(set.reps) })) }))
    .filter(entry => entry.sets.length);
  const loggedSets = entries.reduce((total, entry) => total + entry.sets.length, 0);
  const volume = entries.reduce((total, entry) => total + entry.sets.reduce((n, set) => n + set.weight * set.reps, 0), 0);
  if (finish) return <><p className="modal-copy">Review your completed session. Enter your actual duration and activity calories before saving.</p>{loggedSets > 0 && <p className="session-summary">{entries.length} {entries.length === 1 ? 'exercise' : 'exercises'} · {loggedSets} {loggedSets === 1 ? 'set' : 'sets'}{volume > 0 ? ` · ${Math.round(volume).toLocaleString()} kg lifted` : ''}</p>}<EntryForm type="workout" busy={busy} bodyWeight={bodyWeight} onDraftChange={setReview} initial={{ title: plan.title, category: plan.category, durationMinutes: Math.max(1, Math.round(elapsed / 60)), exercises: exercises.filter((_, i) => checked.includes(i)), ...review }} onSubmit={values => onComplete({ ...values, planId: plan.id, exercises: exercises.filter((_, i) => checked.includes(i)), entries })} /><button className="text-link" onClick={()=>setFinish(false)}><ArrowLeft size={15} />Back to session</button></>;
  return <><p className="fine-print">Unfinished workouts are saved in this browser. Reopened workouts start paused.</p><div className="session-meta"><span className="status-pill">{plan.category}</span><span><Clock3 size={16} />{plan.durationMinutes || parseInt(plan.duration) || 30} min planned</span></div><p className="modal-copy">{plan.equipment || 'Your own equipment'}</p>{plan.notes && <p className="session-instructions">{plan.notes}</p>}<ExerciseChecklist exercises={exercises} checked={checked} onToggle={i=>setChecked(c=>c.includes(i)?c.filter(n=>n!==i):[...c,i])} sets={sets} lastSets={lastSets} onSetsChange={(i,next)=>setSets(current=>({ ...current, [i]: next }))} /><div className="session-timer"><span>{String(Math.floor(elapsed/60)).padStart(2,'0')}:{String(elapsed%60).padStart(2,'0')}</span><small>{checked.length} of {exercises.length} exercises checked{loggedSets > 0 ? ` · ${loggedSets} ${loggedSets === 1 ? 'set' : 'sets'} logged` : ''}</small></div><div className="modal-actions"><button className="button secondary" onClick={toggle}>{running ? <Pause size={17} /> : <Play size={17} />}{running ? 'Pause' : started ? 'Resume' : 'Start session'}</button><button className="button primary" disabled={!started} onClick={()=>{ if(running) toggle(); setFinish(true); }}>Finish & review<Check size={17} /></button></div></>;
}

