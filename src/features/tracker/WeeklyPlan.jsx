import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Flame, Pencil, Play, Plus, Target, X } from 'lucide-react';
import dayjs from 'dayjs';
import { today } from './data';
import { Icon, PanelTitle } from './components';
import { workoutMinutes } from './workoutFilters';
import { MAX_PER_DAY, activityCalendar, allRoutines, assignRoutine, longestStreak, normalizePlan, removeRoutine, weeklyAdherence } from './planning';
import './weeklyPlan.css';

const statusLabel = { rest: 'Rest day', extra: 'Bonus session', done: 'Completed', partial: 'In progress', missed: 'Missed', today: 'Planned today', upcoming: 'Planned' };
const HEATMAP_WEEKS = 16;

function adherenceMessage(week) {
  if (!week.planned) return 'Add workouts to the days you can realistically train. A plan you keep beats a plan you admire.';
  if (!week.due) return 'Your first planned session of the week is still ahead of you.';
  const missed = week.days.filter(day => day.status === 'missed').length;
  return `${week.percent}% of the sessions due so far are done${week.extra ? `, plus ${week.extra} unplanned` : ''}.${missed ? ' A missed day is not lost: log it late or simply pick up the next one.' : ''}`;
}

export function AssignRoutineForm({ data, day, label, busy, onSubmit }) {
  const plan = normalizePlan(data.profile.weeklyPlan), taken = plan[day] || [];
  const routines = allRoutines(data), favorites = data.profile.favoriteWorkoutIds || [];
  const [id, setId] = useState(routines.find(r => !taken.includes(r.id))?.id || '');
  const [error, setError] = useState('');
  const selected = routines.find(r => r.id === id);
  const groups = [...['Strength', 'Cardio', 'Mobility'].map(category => [category, routines.filter(r => r.category === category && !data.customPlans.some(p => p.id === r.id))]), ['Your workouts', data.customPlans]].filter(([, list]) => list.length);
  function submit(e) {
    e.preventDefault();
    try { onSubmit(assignRoutine(plan, day, id)); } catch (failure) { setError(failure.message); }
  }
  return <form className="entry-form" onSubmit={submit}>
    <p className="modal-copy">Choose a workout for every {label}. Your plan repeats each week and you can change it at any time.</p>
    <label className="field"><span>Workout</span>
      <select value={id} onChange={e => { setId(e.target.value); setError(''); }}>
        {groups.map(([group, list]) => <optgroup key={group} label={group}>{list.map(r => <option key={r.id} value={r.id} disabled={taken.includes(r.id)}>{r.title} · {workoutMinutes(r)} min{favorites.includes(r.id) ? ' · Favorite' : ''}{taken.includes(r.id) ? ' · Already planned' : ''}</option>)}</optgroup>)}
      </select>
    </label>
    {selected && <p className="fine-print">{selected.description || selected.notes || 'Your custom workout routine.'} {selected.equipment ? `Equipment: ${selected.equipment}.` : ''}</p>}
    {error && <div role="alert" className="error-banner">{error}</div>}
    <div className="modal-actions"><button className="button primary" type="submit" disabled={busy || !id}>{busy ? 'Saving…' : `Add to ${label}s`}</button></div>
  </form>;
}

export function ActivityHeatmap({ sessions }) {
  const calendar = activityCalendar(sessions, { weeks: HEATMAP_WEEKS });
  const current = today();
  return <section className="panel heatmap-panel">
    <PanelTitle title="Consistency"><span className="muted">{calendar.activeDays} active days in the last {HEATMAP_WEEKS} weeks</span></PanelTitle>
    <div className="heatmap" role="img" aria-label={`Activity calendar: ${calendar.activeDays} active days and ${calendar.totalMinutes} minutes over the last ${HEATMAP_WEEKS} weeks`}>
      <div className="heatmap-months">{calendar.labels.map(label => <span key={label.index} style={{ gridColumn: label.index + 1 }}>{label.text}</span>)}</div>
      <div className="heatmap-body">
        <div className="heatmap-days">{['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((name, i) => <span key={i}>{name}</span>)}</div>
        <div className="heatmap-grid">{calendar.columns.flat().map(cell => <span key={cell.date} className={`heat level-${cell.level}${cell.date === current ? ' is-today' : cell.date > current ? ' future' : ''}`} title={`${dayjs(cell.date).format('ddd D MMM')}: ${cell.minutes} min`} />)}</div>
      </div>
    </div>
    <div className="heatmap-legend"><span>Less</span>{[0, 1, 2, 3, 4].map(level => <i key={level} className={`heat level-${level}`} />)}<span>More</span><span className="muted">· {calendar.totalMinutes.toLocaleString()} active minutes</span></div>
  </section>;
}

export function TodayPlan({ tracker, setModal }) {
  const week = weeklyAdherence(tracker.data);
  const day = week.days.find(d => d.isToday);
  const pending = day.planned.filter(item => !item.done);
  return <section className="panel today-plan">
    <div>
      <span className="eyebrow">TODAY’S PLAN</span>
      {!week.planned ? <><strong>No weekly plan yet</strong><p className="muted">Decide which days you train and the week takes care of itself.</p></>
        : day.planned.length ? <><strong>{day.planned.map(item => item.routine.title).join(' · ')}</strong><p className="muted">{day.status === 'done' ? 'All done for today. Nice work showing up.' : `${pending.length} of ${day.planned.length} still to do${day.extra.length ? ` · ${day.extra.length} extra logged` : ''}`}</p></>
        : <><strong>Rest day</strong><p className="muted">{day.extra.length ? 'You moved anyway. Recovery still counts.' : 'Nothing planned. Recovery is part of the plan.'}</p></>}
    </div>
    {pending.length ? <button className="button primary" onClick={() => setModal({ type: 'plan', plan: pending[0].routine })}><Play size={16} />Start {pending[0].routine.title}</button> : <Link className="text-link" to="/plan">{week.planned ? 'Open your plan' : 'Build your plan'}<ArrowRight size={15} /></Link>}
  </section>;
}

export function PlanPage({ tracker, stats, setModal, save, busy }) {
  const [offset, setOffset] = useState(0);
  const date = dayjs().add(offset * 7, 'day').format('YYYY-MM-DD');
  const week = weeklyAdherence(tracker.data, date);
  const best = longestStreak(tracker.data.sessions);
  const plan = normalizePlan(tracker.data.profile.weeklyPlan);
  const remove = (day, routine) => save(() => tracker.setWeeklyPlan(removeRoutine(plan, day, routine.id)), `${routine.title} removed from your plan.`);
  return <>
    <div className="plan-toolbar">
      <div className="chart-controls"><button className="icon-button" aria-label="Previous week" onClick={() => setOffset(offset - 1)}><ChevronLeft size={17} /></button><span>{offset === 0 ? 'This week' : `${dayjs(week.days[0].date).format('D MMM')} – ${dayjs(week.days[6].date).format('D MMM')}`}</span><button className="icon-button" aria-label="Next week" onClick={() => setOffset(offset + 1)}><ChevronRight size={17} /></button>{offset !== 0 && <button className="text-link" onClick={() => setOffset(0)}>Back to this week</button>}</div>
      <span className="muted">Your plan repeats every week. Up to {MAX_PER_DAY} workouts a day.</span>
    </div>
    <div className="plan-week">{week.days.map(day => <article className={`panel plan-day ${day.status}${day.isToday ? ' is-today' : ''}`} key={day.date}>
      <header className="plan-day-heading"><div><strong>{dayjs(day.date).format('ddd')}</strong><span>{dayjs(day.date).format('D MMM')}</span></div><span className={`plan-status ${day.status}`}>{day.status === 'partial' ? `${day.planned.filter(p => p.done).length} of ${day.planned.length} done` : statusLabel[day.status]}</span></header>
      {day.planned.length > 0 && <ul className="plan-list">{day.planned.map(({ routine, done }) => <li key={routine.id} className={done ? 'done' : ''}>
        <span className={`exercise-icon ${routine.category?.toLowerCase() || ''}`}><Icon category={routine.category} size={17} /></span>
        <div><strong>{routine.title}</strong><small>{workoutMinutes(routine)} min · {routine.category || 'Workout'}</small></div>
        {done ? <span className="plan-check" aria-label={`${routine.title} completed`}><Check size={15} /></span>
          : day.date === today() ? <button className="icon-button bordered" aria-label={`Start ${routine.title}`} onClick={() => setModal({ type: 'plan', plan: routine })}><Play size={15} /></button>
          : day.date < today() ? <button className="icon-button bordered" aria-label={`Log ${routine.title} for ${dayjs(day.date).format('D MMM')}`} onClick={() => setModal({ type: 'workout', initial: { title: routine.title, category: routine.category, durationMinutes: workoutMinutes(routine), date: day.date } })}><Pencil size={15} /></button> : null}
        <button className="icon-button" aria-label={`Remove ${routine.title} from ${day.label}s`} disabled={busy} onClick={() => remove(day.key, routine)}><X size={15} /></button>
      </li>)}</ul>}
      {day.extra.length > 0 && <p className="plan-extra">Also logged: {day.extra.map(s => s.title).join(', ')}</p>}
      {!day.planned.length && !day.extra.length && <p className="plan-rest">Nothing planned</p>}
      <button className="text-link plan-add" disabled={busy || day.planned.length >= MAX_PER_DAY} onClick={() => setModal({ type: 'assign', day: day.key, label: day.label })}><Plus size={14} />Add workout</button>
    </article>)}</div>
    <div className="plan-panels">
      <section className="panel goal-panel plan-adherence">
        <PanelTitle title={offset === 0 ? 'This week’s adherence' : 'Adherence that week'}><Target size={21} /></PanelTitle>
        <div className="goal-ring" style={{ '--percent': `${week.planned ? Math.min(week.completed / week.planned * 100, 100) : 0}%` }}><div><strong>{week.completed}<span> / {week.planned}</span></strong><small>planned workouts done</small></div></div>
        <div className="goal-message"><span className="streak-badge"><Flame size={16} />{stats.streak} day streak</span> <span className="streak-badge best">Best {best} {best === 1 ? 'day' : 'days'}</span><p>{adherenceMessage(week)}</p></div>
        {!week.planned && <button className="text-link" onClick={() => setModal({ type: 'assign', day: 'mon', label: 'Monday' })}>Plan your first workout<ArrowRight size={15} /></button>}
      </section>
      <ActivityHeatmap sessions={tracker.data.sessions} />
    </div>
    <p className="fine-print">A planned workout counts as done when a session for that routine is logged on that day, whether you start it from here or log it manually with the same name. Extra sessions never count against you.</p>
  </>;
}
