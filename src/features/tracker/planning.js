import dayjs from 'dayjs';
import { plans as library, today } from './data.js';

// A weekly plan is a template keyed by weekday; it repeats every week.
export const weekdays = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']];
export const MAX_PER_DAY = 3;
const keys = weekdays.map(([key]) => key);
const iso = value => value.format('YYYY-MM-DD');

export function weekdayKey(date) { return keys[(dayjs(date).day() + 6) % 7]; }
// Monday to Sunday of the week containing the date.
export function weekDates(date = today()) {
  const start = dayjs(date).subtract((dayjs(date).day() + 6) % 7, 'day');
  return keys.map((_, i) => iso(start.add(i, 'day')));
}
export function normalizePlan(raw) {
  const plan = raw && typeof raw === 'object' ? raw : {};
  return Object.fromEntries(keys.map(key => [key, Array.isArray(plan[key]) ? plan[key].filter(id => typeof id === 'string').slice(0, MAX_PER_DAY) : []]));
}
export function assignRoutine(plan, day, id) {
  if (!keys.includes(day)) throw new Error('Choose a day of the week.');
  if (!id) throw new Error('Choose a workout to add.');
  const current = normalizePlan(plan);
  if (current[day].includes(id)) throw new Error('That workout is already planned for this day.');
  if (current[day].length >= MAX_PER_DAY) throw new Error(`Keep it realistic: up to ${MAX_PER_DAY} workouts per day.`);
  return { ...current, [day]: [...current[day], id] };
}
export function removeRoutine(plan, day, id) {
  const current = normalizePlan(plan);
  return { ...current, [day]: current[day].filter(value => value !== id) };
}
export function allRoutines(data) { return [...library, ...(data.customPlans || [])]; }
// Timed sessions keep the routine ID; manual logs are matched by title.
const matches = (session, routine) => session.planId ? session.planId === routine.id : session.title === routine.title;

export function weeklyAdherence(data, date = today(), current = today()) {
  const routines = allRoutines(data), plan = normalizePlan(data.profile?.weeklyPlan);
  const days = weekDates(date).map((day, i) => {
    const sessions = data.sessions.filter(s => s.date === day);
    const used = new Set();
    // Each logged session can satisfy only one planned slot, and unknown IDs (a deleted custom routine) are skipped.
    const planned = plan[keys[i]].map(id => routines.find(r => r.id === id)).filter(Boolean).map(routine => {
      const session = sessions.find(s => !used.has(s) && matches(s, routine));
      if (session) used.add(session);
      return { routine, session: session || null, done: Boolean(session) };
    });
    const extra = sessions.filter(s => !used.has(s));
    const done = planned.filter(p => p.done).length;
    const status = !planned.length ? (sessions.length ? 'extra' : 'rest') : done === planned.length ? 'done' : done > 0 ? 'partial' : day < current ? 'missed' : day === current ? 'today' : 'upcoming';
    return { date: day, key: keys[i], label: weekdays[i][1], planned, extra, status, isToday: day === current };
  });
  const count = (list, pick) => list.reduce((n, d) => n + pick(d), 0);
  const planned = count(days, d => d.planned.length);
  const completed = count(days, d => d.planned.filter(p => p.done).length);
  const due = count(days.filter(d => d.date <= current), d => d.planned.length);
  return { days, planned, completed, due, extra: count(days, d => d.extra.length), percent: due ? Math.round(completed / due * 100) : 0 };
}

export function longestStreak(sessions) {
  const dates = [...new Set(sessions.map(s => s.date).filter(Boolean))].sort();
  let best = 0, run = 0, previous = null;
  for (const date of dates) {
    run = previous && dayjs(date).diff(previous, 'day') === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

export const heatLevel = minutes => minutes <= 0 ? 0 : minutes < 20 ? 1 : minutes < 40 ? 2 : minutes < 60 ? 3 : 4;
// Columns are Monday-to-Sunday weeks ending with the week of the date, oldest first.
export function activityCalendar(sessions, { weeks = 16, date = today() } = {}) {
  const end = dayjs(weekDates(date)[6]);
  const minutes = {};
  for (const s of sessions) if (s.date) minutes[s.date] = (minutes[s.date] || 0) + Number(s.durationMinutes || 0);
  const columns = Array.from({ length: weeks }, (_, w) => {
    const start = end.subtract((weeks - 1 - w) * 7 + 6, 'day');
    return Array.from({ length: 7 }, (_, d) => { const key = iso(start.add(d, 'day')); return { date: key, minutes: minutes[key] || 0, level: heatLevel(minutes[key] || 0) }; });
  });
  const labels = columns.map((column, i) => ({ index: i, text: i === 0 || dayjs(column[0].date).month() !== dayjs(columns[i - 1][0].date).month() ? dayjs(column[0].date).format('MMM') : '' })).filter(item => item.text);
  const first = columns[0][0].date, last = columns[weeks - 1][6].date;
  const active = new Set(sessions.map(s => s.date).filter(key => key >= first && key <= last));
  return { columns, labels, activeDays: active.size, totalMinutes: [...active].reduce((n, key) => n + (minutes[key] || 0), 0) };
}
