import test from 'node:test';
import assert from 'node:assert/strict';
import dayjs from 'dayjs';
import { emptyData, demoData, plans } from '../src/features/tracker/data.js';
import { MAX_PER_DAY, activityCalendar, assignRoutine, heatLevel, longestStreak, normalizePlan, removeRoutine, weekDates, weekdayKey, weeklyAdherence } from '../src/features/tracker/planning.js';

// A fixed week (Mon 7 – Sun 13 Sep 2026) viewed on Thursday the 10th.
const NOW = '2026-09-10';
const session = (date, title, extra = {}) => ({ id: `${date}-${title}`, date, title, durationMinutes: 30, ...extra });
const title = id => plans.find(p => p.id === id).title;

test('Plan templates are normalised and edited without mutation or duplicates', () => {
  assert.deepEqual(normalizePlan(null).mon, []);
  assert.deepEqual(Object.keys(normalizePlan({})), ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  assert.deepEqual(normalizePlan({ mon: ['a', 7, null, 'b', 'c', 'd'] }).mon, ['a', 'b', 'c']);
  const base = { mon: ['a'] };
  const next = assignRoutine(base, 'tue', 'b');
  assert.deepEqual(next.tue, ['b']);
  assert.deepEqual(base, { mon: ['a'] });
  assert.throws(() => assignRoutine(base, 'mon', 'a'), /already planned/);
  assert.throws(() => assignRoutine(base, 'someday', 'a'), /day of the week/);
  assert.throws(() => assignRoutine(base, 'mon', ''), /Choose a workout/);
  const full = { mon: Array.from({ length: MAX_PER_DAY }, (_, i) => `r${i}`) };
  assert.throws(() => assignRoutine(full, 'mon', 'extra'), /up to/);
  assert.deepEqual(removeRoutine(next, 'tue', 'b').tue, []);
  assert.deepEqual(removeRoutine(next, 'tue', 'missing').tue, ['b']);
});

test('Weeks run Monday to Sunday and weekday keys follow the same order', () => {
  assert.deepEqual(weekDates('2026-09-13'), ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13']);
  assert.equal(weekdayKey('2026-09-07'), 'mon');
  assert.equal(weekdayKey('2026-09-13'), 'sun');
});

test('Adherence matches sessions to planned routines by ID or title, once each', () => {
  const data = emptyData();
  data.profile.weeklyPlan = { tue: ['easy-run'], thu: ['full-body', 'core'], fri: ['walk', 'ghost-routine'], sun: ['mobility'] };
  data.sessions = [
    session('2026-09-10', 'Full body strength', { planId: 'full-body' }),
    session('2026-09-10', 'Evening stroll'),
    session('2026-09-08', 'Something else'),
    session('2026-09-07', 'Bonus walk'),
  ];
  const week = weeklyAdherence(data, NOW, NOW);
  const byDate = Object.fromEntries(week.days.map(d => [d.date, d]));
  assert.equal(byDate['2026-09-07'].status, 'extra');
  assert.equal(byDate['2026-09-08'].status, 'missed');
  assert.equal(byDate['2026-09-09'].status, 'rest');
  assert.equal(byDate['2026-09-10'].status, 'partial');
  assert.ok(byDate['2026-09-10'].isToday);
  assert.deepEqual(byDate['2026-09-10'].planned.map(p => p.done), [true, false]);
  assert.equal(byDate['2026-09-10'].extra.length, 1);
  assert.equal(byDate['2026-09-11'].status, 'upcoming');
  assert.equal(byDate['2026-09-11'].planned.length, 1, 'unknown routine IDs are skipped');
  assert.equal(byDate['2026-09-13'].status, 'upcoming');
  assert.deepEqual([week.planned, week.completed, week.due, week.extra, week.percent], [5, 1, 3, 3, 33]);
  // A manual log with the routine title counts, and one session cannot satisfy two slots.
  data.profile.weeklyPlan = { thu: ['full-body', 'full-body'] };
  data.sessions = [session('2026-09-10', title('full-body'))];
  const single = weeklyAdherence(data, NOW, NOW);
  assert.equal(single.days[3].status, 'partial');
  assert.equal(single.completed, 1);
  // A session started from a different routine does not count for one that merely shares the name.
  data.sessions = [session('2026-09-10', title('full-body'), { planId: 'core' })];
  assert.equal(weeklyAdherence(data, NOW, NOW).completed, 0);
});

test('Empty plans are rest weeks, a plan-free today is pending, and the demo ships with a plan', () => {
  const data = emptyData();
  assert.equal(weeklyAdherence(data, NOW, NOW).planned, 0);
  assert.ok(weeklyAdherence(data, NOW, NOW).days.every(d => d.status === 'rest'));
  data.profile.weeklyPlan = { thu: ['core'] };
  assert.equal(weeklyAdherence(data, NOW, NOW).days[3].status, 'today');
  assert.equal(weeklyAdherence(data, NOW, NOW).percent, 0);
  data.sessions = [session('2026-09-10', title('core'))];
  assert.equal(weeklyAdherence(data, NOW, NOW).days[3].status, 'done');
  assert.equal(weeklyAdherence(data, NOW, NOW).percent, 100);
  // Viewing an earlier week keeps statuses relative to the real current day.
  const previous = weeklyAdherence(data, '2026-09-03', NOW);
  assert.equal(previous.days[0].date, '2026-08-31');
  assert.equal(previous.days[3].status, 'missed');
  assert.ok(weeklyAdherence(demoData()).planned >= 4, 'the sample workspace ships with a plan');
});

test('Longest streak counts consecutive days once each, ignoring undated rows', () => {
  assert.equal(longestStreak([]), 0);
  assert.equal(longestStreak([session('2026-09-01', 'a'), session('2026-09-01', 'b'), session('2026-09-02', 'c'), session('2026-09-04', 'd'), session('2026-09-05', 'e'), session('2026-09-06', 'f'), { title: 'undated' }]), 3);
});

test('The activity calendar covers whole weeks, buckets minutes, and labels month changes', () => {
  assert.deepEqual([0, 1, 19, 20, 39, 40, 59, 60, 400].map(heatLevel), [0, 1, 1, 2, 2, 3, 3, 4, 4]);
  const calendar = activityCalendar([session(NOW, 'a', { durationMinutes: 25 }), session(NOW, 'b', { durationMinutes: 25 }), session('2026-01-01', 'old'), session('2026-08-30', 'zero', { durationMinutes: 0 })], { weeks: 4, date: NOW });
  assert.equal(calendar.columns.length, 4);
  assert.ok(calendar.columns.every(column => column.length === 7));
  assert.equal(calendar.columns[0][0].date, '2026-08-17');
  assert.equal(calendar.columns[3][6].date, '2026-09-13');
  const cell = calendar.columns.flat().find(c => c.date === NOW);
  assert.equal(cell.minutes, 50);
  assert.equal(cell.level, 3);
  assert.equal(calendar.activeDays, 2, 'a logged session with no minutes is still an active day');
  assert.equal(calendar.totalMinutes, 50);
  assert.deepEqual(calendar.labels, [{ index: 0, text: 'Aug' }, { index: 3, text: 'Sep' }]);
  assert.equal(dayjs(calendar.columns[3][0].date).month(), 8);
});
