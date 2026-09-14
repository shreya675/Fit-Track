import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowDownToLine, ArrowRight, Check, ChevronLeft, ChevronRight, Clock3, Flame, Footprints, Leaf, LogIn, LogOut, Minus, Plus, Search, Target, Pencil, Trash2, Utensils, Waves } from 'lucide-react';
import dayjs from 'dayjs';
import { auth } from '../../firebase';
import { summarize, today } from './data';
import WorkoutLibrary from './WorkoutLibrary';
import { Empty, Field, Icon, PanelTitle, Progress } from './components';
import { exerciseLog, latestWeight, personalRecords, weightChange, weightSeries } from './progressStats';
import { equipmentOptions, trainingFocuses } from './recommendations';
import './progressPanels.css';
const number = value => Number(value || 0).toLocaleString();
function Metric({ icon: MetricIcon, title, value, unit, goal, color }) { return <div className="metric panel"><div className="metric-top"><span>{title}</span><span className={`metric-icon ${color}`}><MetricIcon size={19} /></span></div><div className="metric-value">{number(value)}<span>{unit}</span></div><Progress value={value} goal={goal} className={color} /><div className="metric-bottom"><span>of {number(goal)} {unit}</span><strong>{Math.round(value / Math.max(goal, 1) * 100)}%</strong></div></div>; }
function ActivityChart({ stats, offset, setOffset }) {
  const max = Math.max(60, ...stats.week.map(d => d.minutes));
  return <section className="panel activity-panel"><PanelTitle title="Your activity"><div className="chart-controls"><button className="icon-button" aria-label="Previous week" onClick={() => setOffset(offset - 1)}><ChevronLeft size={17} /></button><span>{offset === 0 ? 'This week' : `${dayjs(stats.week[0].date).format('D MMM')} – ${dayjs(stats.week[6].date).format('D MMM')}`}</span><button className="icon-button" aria-label="Next week" disabled={offset === 0} onClick={() => setOffset(offset + 1)}><ChevronRight size={17} /></button></div></PanelTitle><div className="chart-summary"><strong>{stats.week.reduce((n, d) => n + d.minutes, 0)}<span>active minutes</span></strong><span className="chart-key"><i />Workout time</span></div><div className="bar-chart"><div className="chart-axis"><span>{max}</span><span>{Math.round(max / 2)}</span><span>0</span></div><div className="chart-bars">{stats.week.map(d => <div className={`bar-column ${d.date === today() ? 'is-today' : ''}`} key={d.date}><div className="bar-space"><div title={`${d.day}: ${d.minutes} minutes`} className="bar" style={{ height: `${d.minutes / max * 100}%` }}><span>{d.minutes} min</span></div></div><span>{d.day}</span><span className="sr-only">{d.minutes} minutes</span></div>)}</div></div></section>;
}
export function Overview({ tracker, stats, setModal, busy, save }) {
  const { data } = tracker, p = data.profile;
  const [offset, setOffset] = useState(0);
  const chartStats = offset === 0 ? stats : summarize(data, dayjs().add(offset * 7, 'day').format('YYYY-MM-DD'));
  return <>
    <section className="hero"><div className="hero-content"><span className="hero-kicker"><span />MAKE TIME FOR YOU</span><h2>Your only competition<br />is yesterday.</h2><p>Give yourself a little time to move today.</p><Link className="button lime" to="/workouts">Find a workout<ArrowRight size={17} /></Link></div><div className="hero-caption"><span>ONE DAY AT A TIME</span><strong>Keep showing up.</strong></div></section>
    <div className="metrics-grid"><Metric icon={Flame} title="Calories burned" value={stats.burned} unit="kcal" goal={p.dailyCalories} color="orange" /><Metric icon={Footprints} title="Steps today" value={stats.steps} unit="steps" goal={p.dailySteps} color="green" /><Metric icon={Clock3} title="Active time" value={stats.minutes} unit="min" goal={p.dailyWorkout} color="purple" /><Metric icon={Waves} title="Water intake" value={stats.water * 250} unit="ml" goal={p.waterGoal * 250} color="blue" /></div>
    <div className="overview-grid"><ActivityChart stats={chartStats} offset={offset} setOffset={setOffset} /><section className="panel goal-panel"><PanelTitle title="Keep the momentum"><Target size={21} /></PanelTitle><div className="goal-ring" style={{ '--percent': `${Math.min(stats.weekSessions.length / p.weeklySessions * 100, 100)}%` }}><div><strong>{stats.weekSessions.length}<span> / {p.weeklySessions}</span></strong><small>workouts this week</small></div></div><div className="goal-message"><span className="streak-badge"><Flame size={16} />{stats.streak} day streak</span><p>{stats.weekSessions.length >= p.weeklySessions ? 'Weekly goal reached. Take a moment to enjoy it.' : `${Math.max(0, p.weeklySessions - stats.weekSessions.length)} more sessions to reach your weekly goal.`}</p></div><Link to="/profile" className="text-link">Adjust your goals<ArrowRight size={15} /></Link></section></div>
    <div className="overview-grid bottom-grid"><section className="panel"><PanelTitle title="Recent workouts"><Link className="text-link" to="/workouts?view=history">View all<ArrowRight size={15} /></Link></PanelTitle><History sessions={data.sessions.slice().sort((a,b) => b.date.localeCompare(a.date)).slice(0,3)} setModal={setModal} compact /></section><section className="panel water-panel"><PanelTitle title="A moment to hydrate"><Waves size={21} /></PanelTitle><p className="muted">{stats.water} of {p.waterGoal} glasses today <span>· 250 ml each</span></p><div className="water-glasses">{Array.from({ length: Math.min(p.waterGoal, 12) }, (_, i) => <span key={i} className={i < stats.water ? 'filled' : ''}><Waves size={21} /></span>)}</div><div className="water-actions"><button className="icon-button bordered" aria-label="Remove one glass of water" disabled={busy || stats.water === 0} onClick={() => save(() => tracker.setDaily('water', today(), Math.max(0, stats.water - 1)), 'Water intake updated.')}><Minus size={18} /></button><button className="button water-button" disabled={busy} onClick={() => save(() => tracker.setDaily('water', today(), stats.water + 1), 'One glass of water added.')}><Plus size={17} />Add a glass</button></div></section></div>
    <div className="daily-note"><span><Footprints size={19} />Your steps count, too. Add the total from your phone or watch.</span><button className="text-link" onClick={() => setModal({ type: 'steps', initial: { steps: stats.steps } })}>Update steps<ArrowRight size={15} /></button></div>
  </>;
}
function History({ sessions, setModal, compact = false }) { return sessions.length ? <div className="history-list">{sessions.map(s => <div className="history-row" key={s.id}><span className={`exercise-icon ${s.category?.toLowerCase()}`}><Icon category={s.category} /></span><div className="history-name"><strong>{s.title}</strong><span>{dayjs(s.date).format('D MMM')} <i>·</i> {s.category || 'Workout'}</span>{!compact && s.notes && <small className="history-session-notes">{s.notes}</small>}</div><div className="history-value"><strong>{s.durationMinutes} min</strong><span>{number(s.calories)} kcal</span></div>{!compact && <div className="entry-actions"><button className="icon-button" aria-label={`Edit ${s.title}`} onClick={() => setModal({ type: 'workout', initial: s })}><Pencil size={16} /></button><button className="icon-button" aria-label={`Delete ${s.title}`} onClick={() => setModal({ type: 'delete', key: 'sessions', id: s.id, name: s.title })}><Trash2 size={16} /></button></div>}</div>)}</div> : <Empty title="Your first session starts here" text="Log a workout and watch your progress take shape." />; }
export function Workouts({ tracker, setModal }) {
  const location = useLocation();
  const [view, setView] = useState(new URLSearchParams(location.search).get('view') === 'history' ? 'history' : 'library');
  return <>
    <div className="tabs"><button className={view === 'library' ? 'selected' : ''} onClick={() => setView('library')}>Workout library</button><button className={view === 'history' ? 'selected' : ''} onClick={() => setView('history')}>My history<span>{tracker.data.sessions.length}</span></button></div>
    {view === 'library' ? <WorkoutLibrary tracker={tracker} setModal={setModal} /> : <section className="panel"><PanelTitle title="Workout history"><span className="muted">{tracker.data.sessions.length} logged</span></PanelTitle><History sessions={tracker.data.sessions.slice().sort((a,b) => b.date.localeCompare(a.date))} setModal={setModal} /></section>}
  </>;
}
export function Nutrition({ tracker, setModal }) {
  const [date, setDate] = useState(today());
  const stats = summarize(tracker.data, date), p = tracker.data.profile;
  const totals = stats.meals.reduce((acc, m) => ({ protein: acc.protein + Number(m.protein || 0), carbs: acc.carbs + Number(m.carbs || 0), fat: acc.fat + Number(m.fat || 0) }), { protein: 0, carbs: 0, fat: 0 });
  return <><div className="section-date"><label>Food diary <input type="date" aria-label="Food diary date" max={today()} value={date} onChange={e => e.target.value && setDate(e.target.value)} /></label><span className="muted">Your daily target: {number(p.nutritionGoal)} kcal</span></div><div className="nutrition-overview"><section className="panel calorie-panel"><span className="eyebrow">DAILY ENERGY</span><div className="calorie-total">{number(stats.eaten)}<span>kcal logged</span></div><Progress value={stats.eaten} goal={p.nutritionGoal} /><p>{number(Math.max(0, p.nutritionGoal - stats.eaten))} kcal remaining in your target</p></section>{Object.entries(totals).map(([name, value]) => <section className={`panel macro ${name}`} key={name}><span className="macro-dot" /><h3>{name}</h3><strong>{Math.round(value*10)/10}<span>g</span></strong><p>From logged meals</p></section>)}</div><section className="panel"><PanelTitle title="On your plate"><span className="muted">{stats.meals.length} entries</span></PanelTitle>{['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => <div className="meal-group" key={type}><div className="meal-group-heading"><h3>{type}</h3><button className="icon-button bordered" aria-label={`Add ${type.toLowerCase()}`} onClick={() => setModal({ type: 'meal', initial: { type, date } })}><Plus size={17} /></button></div>{stats.meals.filter(m => m.type === type).length ? stats.meals.filter(m => m.type === type).map(m => <div className="meal-row" key={m.id}><span className="meal-icon"><Utensils size={18} /></span><div><strong>{m.name}</strong><small>{m.protein == null ? 'Macros not recorded' : `${m.protein}g protein · ${m.carbs}g carbs · ${m.fat}g fat`}</small></div><strong>{m.calories}<small> kcal</small></strong><div className="entry-actions"><button className="icon-button" aria-label={`Edit ${m.name}`} onClick={() => setModal({ type: 'meal', initial: m })}><Pencil size={16} /></button><button className="icon-button" aria-label={`Delete ${m.name}`} onClick={() => setModal({ type: 'delete', key: 'meals', id: m.id, name: m.name })}><Trash2 size={16} /></button></div></div>) : <p className="meal-empty">Nothing logged yet.</p>}</div>)}</section><p className="fine-print">Food values are entered by you. Targets are personal preferences, not dietary recommendations.</p></>;
}

function PersonalRecords({ sessions }) {
  const records = personalRecords(sessions);
  return <section className="panel records-panel">
    <PanelTitle title="Personal records"><span className="muted">Heaviest set per exercise</span></PanelTitle>
    {records.length ? <ol className="record-list">
      {records.slice(0, 8).map(record => <li key={record.key}>
        <span className="record-name">{record.name}</span>
        <span className="record-best">{record.weight > 0 ? <><strong>{record.weight}</strong> kg × {record.reps}</> : <><strong>{record.reps}</strong> reps</>}</span>
        <span className="record-date">{dayjs(record.date).format('D MMM')}</span>
      </li>)}
    </ol> : <p className="muted">Log the weight and repetitions of a set during a workout and your best effort for each exercise appears here.</p>}
    {records.length > 8 && <p className="muted record-more">Showing your 8 heaviest of {records.length} exercises.</p>}
  </section>;
}

function ExerciseProgress({ sessions }) {
  const log = exerciseLog(sessions);
  const [selected, setSelected] = useState('');
  const exercise = log.find(row => row.key === selected) || log[0];
  if (!log.length) return null;
  const history = exercise.sessions.slice(0, 8).reverse();
  const weighted = history.some(item => item.best.weight > 0);
  const value = item => (weighted ? item.best.weight : item.best.reps);
  const max = Math.max(...history.map(value), 1);
  return <section className="panel exercise-progress">
    <PanelTitle title="Exercise progress">
      <label className="sr-only" htmlFor="exercise-progress-select">Exercise</label>
      <select id="exercise-progress-select" value={exercise.key} onChange={e => setSelected(e.target.value)}>
        {log.map(row => <option key={row.key} value={row.key}>{row.name}</option>)}
      </select>
    </PanelTitle>
    <p className="muted">{weighted ? 'Heaviest set' : 'Best set'} in each of your last {history.length} {history.length === 1 ? 'session' : 'sessions'} · {exercise.totalSets} sets all time</p>
    <ul className="progress-bars">
      {history.map(item => <li key={item.date}>
        <span className="progress-bar-date">{dayjs(item.date).format('D MMM')}</span>
        <span className="progress-bar-track"><span className="progress-bar-fill" style={{ width: `${Math.max(value(item) / max * 100, 4)}%` }} /></span>
        <span className="progress-bar-value">{weighted ? `${item.best.weight} kg × ${item.best.reps}` : `${item.best.reps} reps`}</span>
      </li>)}
    </ul>
  </section>;
}

function WeightTrend({ series }) {
  const weights = series.map(item => item.weight);
  const min = Math.min(...weights), max = Math.max(...weights);
  const span = max - min || 1;
  const points = series.map((item, i) => {
    const x = series.length === 1 ? 150 : (i / (series.length - 1)) * 280 + 10;
    return [x, 78 - ((item.weight - min) / span) * 62];
  });
  const path = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return <svg className="weight-chart" viewBox="0 0 300 90" role="img"
    aria-label={`Body weight from ${series[0].weight} to ${series[series.length - 1].weight} kilograms`}>
    <path d={`${path} L${points[points.length - 1][0].toFixed(1)} 88 L${points[0][0].toFixed(1)} 88 Z`} className="weight-area" />
    <path d={path} className="weight-line" />
    {points.map(([x, y], i) => <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={i === points.length - 1 ? 4 : 2.6} className="weight-dot" />)}
  </svg>;
}

function BodyWeight({ tracker, setModal }) {
  const series = weightSeries(tracker.data.measurements);
  const latest = latestWeight(tracker.data.measurements);
  const change = weightChange(tracker.data.measurements);
  const unavailable = tracker.loadErrors?.measurements;
  return <section className="panel weight-panel">
    <PanelTitle title="Body weight">
      {!unavailable && <button className="button secondary" onClick={() => setModal({ type: 'weight' })}><Plus size={16} />Log weight</button>}
    </PanelTitle>
    {unavailable ? <div className="panel-notice" role="status">
      <p>{unavailable}</p>
      <button className="button secondary" onClick={tracker.retryLoad}>Retry loading</button>
    </div> : latest ? <>
      <div className="weight-figures">
        <strong>{latest.weight}<span>kg</span></strong>
        <span className="muted">Recorded {dayjs(latest.date).format('D MMM YYYY')}</span>
        {change && <span className={`weight-change ${change.difference > 0 ? 'up' : change.difference < 0 ? 'down' : ''}`}>
          {change.difference > 0 ? '+' : ''}{change.difference} kg since {dayjs(change.from.date).format('D MMM')}
        </span>}
      </div>
      {series.length > 1 ? <WeightTrend series={series.slice(-12)} /> : <p className="muted">Add a second reading to see your trend.</p>}
      <p className="fine-print">Weight moves day to day with food, fluid and sleep. A line over weeks tells you more than any single reading.</p>
    </> : <p className="muted">Record your weight to see how it moves over the weeks. You can edit or delete readings below.</p>}
    {!unavailable && tracker.data.measurements?.length > 0 && <details className="weight-history"><summary>Weight history ({tracker.data.measurements.length})</summary><p className="fine-print">The most recently saved reading for each day is used in your trend.</p><ul>{tracker.data.measurements.slice().sort((a, b) => b.date.localeCompare(a.date)).map(reading => <li key={reading.id}><div><strong>{reading.weight} kg</strong><span>{dayjs(reading.date).format('D MMM YYYY')}</span></div><div className="entry-actions"><button className="icon-button" aria-label={`Edit weight on ${reading.date}`} onClick={() => setModal({ type: 'weight', initial: reading })}><Pencil size={16} /></button><button className="icon-button" aria-label={`Delete weight on ${reading.date}`} onClick={() => setModal({ type: 'delete', key: 'measurements', id: reading.id, name: `${reading.weight} kg on ${reading.date}` })}><Trash2 size={16} /></button></div></li>)}</ul></details>}
  </section>;
}

export function ProgressPage({ tracker, stats, setModal }) {
  const [offset, setOffset] = useState(0);
  const chartStats = offset === 0 ? stats : summarize(tracker.data, dayjs().add(offset * 7, 'day').format('YYYY-MM-DD'));
  const sessions = tracker.data.sessions;
  return <><div className="progress-totals">{[['Total workouts', sessions.length, 'sessions logged'], ['Active minutes', sessions.reduce((n,s)=>n+Number(s.durationMinutes || 0),0), 'minutes all time'], ['Current streak', stats.streak, 'consecutive days'], ['Active days', new Set(sessions.map(s=>s.date)).size, 'days with movement']].map(([label,value,unit]) => <section className="panel" key={label}><span className="eyebrow">{label}</span><strong>{number(value)}</strong><span className="muted">{unit}</span></section>)}</div><ActivityChart stats={chartStats} offset={offset} setOffset={setOffset} /><div className="progress-panels"><BodyWeight tracker={tracker} setModal={setModal} /><PersonalRecords sessions={sessions} /></div><ExerciseProgress sessions={sessions} /><section className="panel progress-history"><PanelTitle title="Your activity journal"><span className="muted">Latest 10 sessions</span></PanelTitle><History sessions={sessions.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10)} setModal={setModal} /></section></>;
}
export function Profile({ tracker, busy, save }) {
  const [p, setP] = useState(tracker.data.profile);
  const latest = latestWeight(tracker.data.measurements);
  const update = (key, value) => setP(p => ({ ...p, [key]: value }));
  return <form onSubmit={e => { e.preventDefault(); save(() => tracker.updateProfile(p), 'Your profile and goals have been saved.'); }}><section className="panel profile-banner"><span className="avatar large">{(p.name || 'Y').slice(0,1)}</span><div><h2>{p.name || 'Make this space yours'}</h2><p>{p.fitnessGoal}</p></div><span className="profile-badge"><Leaf size={16} />Your personal best</span></section><div className="profile-grid"><section className="panel"><PanelTitle title="A little about you" /><div className="form-grid"><Field label="Username" required maxLength={60} value={p.name} placeholder="What should we call you?" onChange={e=>update('name',e.target.value)} /><label className="field"><span>Current activity level</span><select value={p.activityLevel || "Just getting started"} onChange={e => update("activityLevel", e.target.value)}>{["Just getting started", "Occasionally active", "Regularly active"].map(value => <option key={value}>{value}</option>)}</select></label><Field label="Your focus" required maxLength={120} value={p.fitnessGoal} onChange={e=>update('fitnessGoal',e.target.value)} /><Field label="Height (cm, optional)" type="number" min="50" max="260" value={p.height || ''} onChange={e=>update('height',e.target.value)} /><Field label="Weight (kg, optional)" type="number" min="20" max="400" step="0.1" value={p.weight || ''} onChange={e=>update('weight',e.target.value)} /><label className="field"><span>What you are working towards</span><select value={p.trainingFocus || 'A balanced mix'} onChange={e => update('trainingFocus', e.target.value)}>{Object.keys(trainingFocuses).map(value => <option key={value}>{value}</option>)}</select></label><fieldset className="field equipment-field"><legend>What you have to hand</legend><p className="muted">Suggestions stay within this. Leave it empty and we work it out from what you have logged.</p><div className="equipment-options">{equipmentOptions.map(item => <label key={item}><input type="checkbox" checked={(p.equipment || []).includes(item)} onChange={e => update('equipment', e.target.checked ? [...(p.equipment || []), item] : (p.equipment || []).filter(value => value !== item))} />{item}</label>)}</div></fieldset>{latest && <p className="muted profile-weight-note">Latest logged reading: {latest.weight} kg on {dayjs(latest.date).format('D MMM YYYY')}. Track it over time on the Progress page.</p>}</div></section><section className="panel"><PanelTitle title="Goals that fit your day" /><div className="form-grid">{[['dailySteps','Daily steps',100,100000],['dailyWorkout','Active minutes / day',1,1440],['dailyCalories','Activity calories / day',1,10000],['weeklySessions','Workouts / week',1,21],['nutritionGoal','Food target (kcal / day)',1,10000],['waterGoal','Glasses of water / day',1,24]].map(([key,label,min,max])=><Field key={key} label={label} type="number" min={min} max={max} required value={p[key]} onChange={e=>update(key,Number(e.target.value))} />)}</div></section></div><div className="form-footer"><span className="muted">Set your own targets. You can adjust them any time.</span><button className="button primary" disabled={busy} type="submit"><Check size={18} />{busy ? 'Saving…' : 'Save changes'}</button></div></form>;
}
export function Settings({ tracker, user, signIn, signOut, exportData, setModal, busy }) { return <div className="settings-stack"><section className="panel"><PanelTitle title="Account & storage" /><div className="setting-row"><div><h3>{user ? user.email : 'Local workspace'}</h3><p>{user ? 'Your entries sync with your Firebase account.' : 'Your entries stay in this browser. Export a copy to keep a backup.'}</p></div><span className="status-pill">{user ? 'Connected' : 'On this device'}</span></div>{user ? <button className="button secondary" onClick={signOut}><LogOut size={17} />Sign out</button> : auth ? <button className="button secondary" disabled={busy} onClick={signIn}><LogIn size={17} />Sign in with Google</button> : <p className="fine-print">Account sync is not configured for this installation.</p>}{!user && auth && <p className="fine-print">Your local data stays separate when you sign in.</p>}</section><section className="panel"><PanelTitle title="Your data" /><div className="setting-row"><div><h3>Keep a copy of your progress</h3><p>Download your workouts, meals, goals, and daily entries as JSON.</p></div><button className="button secondary" onClick={exportData}><ArrowDownToLine size={17} />Export data</button></div>{!user && tracker.data.demo && <div className="setting-row"><div><h3>Start with a clean slate</h3><p>Remove the sample workspace and begin tracking your own activity.</p></div><button className="button secondary" onClick={()=>setModal({type:'fresh'})}>Start fresh</button></div>}</section><section className="panel"><PanelTitle title="A few useful answers" />{[['How are calories calculated?', 'Activity calories are estimated from your workout duration, completed exercises (or activity category), and latest logged body weight, falling back to your profile weight. These are averages, not measurements. You can replace the estimate with a value from your watch or another source. Without a recorded weight, enter calories yourself. Saved calorie values are preserved when editing a workout.'],['Where do my steps come from?', 'Steps are entered manually from your phone or watch. FitTrack does not connect to a wearable or count workout time as steps.'],['What counts toward my streak?', 'A day with at least one logged workout counts. Yesterday’s streak remains active until you have a chance to move today.'],['Can I change my targets?', 'Yes. Open My profile, update your daily or weekly targets, and save. Every progress indicator will use your new goals.']].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section></div>; }

