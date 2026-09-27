import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, summarize } from '../src/features/tracker/data.js';
import { selectWorkouts, workoutMinutes } from '../src/features/tracker/workoutFilters.js';

test('Workout filters combine favorites, equipment search, level, category, and duration', () => {
  const items = [
    { id: 'a', title: 'Short strength', category: 'Strength', difficulty: 'Beginner', durationMinutes: 15, equipment: 'Dumbbells' },
    { id: 'b', title: 'Long strength', category: 'Strength', difficulty: 'Beginner', durationMinutes: 40, equipment: 'Dumbbells' },
    { id: 'c', title: 'Medium strength', category: 'Strength', difficulty: 'Intermediate', durationMinutes: 30, equipment: 'Dumbbells' },
  ];
  assert.deepEqual(selectWorkouts(items, { query: ' DUMBBELLS ', category: 'Strength', difficulty: 'Beginner', duration: '15', favoritesOnly: true, favorites: ['a', 'c'] }).map(p => p.id), ['a']);
  assert.equal(selectWorkouts(items, { favoritesOnly: true }).length, 0);
  assert.deepEqual(selectWorkouts(items, { duration: '30' }).map(p => p.id), ['c']);
});

test('Workout sorting supports legacy custom durations without mutating the library', () => {
  const items = [{ id: 'long', title: 'B', duration: '45 mins' }, { id: 'short', title: 'A', durationMinutes: 10 }];
  assert.equal(workoutMinutes(items[0]), 45);
  assert.deepEqual(selectWorkouts(items, { sort: 'shortest' }).map(p => p.id), ['short', 'long']);
  assert.deepEqual(items.map(p => p.id), ['long', 'short']);
});
const session = (date, durationMinutes = 30) => ({ date, durationMinutes, calories: 100 });
test('Sunday belongs to the week starting the preceding Monday', () => {
  const data = emptyData();
  data.sessions = [session('2026-09-06'), session('2026-09-07'), session('2026-09-13'), session('2026-09-14')];
  const result = summarize(data, '2026-09-13');
  assert.equal(result.week[0].date, '2026-09-07');
  assert.equal(result.week[6].date, '2026-09-13');
  assert.equal(result.weekSessions.length, 2);
  assert.equal(result.week.reduce((n,d) => n+d.minutes,0), 60);
});
test('Streak includes yesterday while today has no session; duplicate sessions count once', () => {
  const data = emptyData();
  data.sessions = [session('2026-09-08'),session('2026-09-08'),session('2026-09-07'),session('2026-09-05')];
  assert.equal(summarize(data, '2026-09-09').streak, 2);
  assert.equal(summarize(data, '2026-09-10').streak, 0);
});
test('Daily totals exclude previous and future dates and accept stored numeric strings', () => {
  const data = emptyData();
  data.sessions = [session('2026-09-09', '20'),session('2026-09-09',15),session('2026-09-08',99),session('2026-09-10',80)];
  data.meals = [{date:'2026-09-09',calories:'450'},{date:'2026-09-08',calories:1000}];
  data.water = {'2026-09-08':8};
  data.steps = {'2026-09-09':2000};
  const result = summarize(data,'2026-09-09');
  assert.equal(result.minutes,35);
  assert.equal(result.burned,200);
  assert.equal(result.eaten,450);
  assert.equal(result.water,0);
  assert.equal(result.steps,2000);
  assert.equal(result.weekSessions.length,3);
});
test('A fresh workspace has zero activity and meaningful editable goals', () => {
  const data = emptyData(), result = summarize(data,'2026-09-09');
  assert.equal(result.minutes,0);
  assert.equal(result.streak,0);
  assert.equal(result.week.length,7);
  assert.ok(data.profile.weeklySessions > 0);
});

test('A saved sample workspace is shifted forward to today so it never reads as empty', async () => {
  const { demoData, reanchorDemo, summarize } = await import('../src/features/tracker/data.js');
  const dayjs = (await import('dayjs')).default;
  const saved = { ...demoData(), demoDate: '2026-09-01', sessions: [{ id: 's', title: 'Old', durationMinutes: 30, date: '2026-09-01' }, { id: 't', title: 'Older', durationMinutes: 10, date: '2026-08-30' }], water: { '2026-09-01': 4 }, steps: { '2026-09-01': 5000 }, meals: [{ id: 'm', name: 'Meal', calories: 100, date: '2026-09-01' }] };
  const moved = reanchorDemo(saved, '2026-09-15');
  assert.equal(moved.demoDate, '2026-09-15');
  assert.deepEqual(moved.sessions.map(s => s.date), ['2026-09-15', '2026-09-13']);
  assert.equal(moved.meals[0].date, '2026-09-15');
  assert.deepEqual(moved.water, { '2026-09-15': 4 });
  assert.deepEqual(moved.steps, { '2026-09-15': 5000 });
  assert.equal(summarize(moved, '2026-09-15').minutes, 30);
  assert.equal(reanchorDemo(saved, '2026-09-01'), saved, 'same day: untouched');
  assert.equal(reanchorDemo({ ...saved, demo: false }, '2026-09-15').sessions[0].date, '2026-09-01', 'a real local workspace is never shifted');
  assert.equal(reanchorDemo({ ...saved, demoDate: undefined, sessions: [{ id: 'sample-0', date: '2026-09-01' }, { id: 'sample-3', date: '2026-08-27' }] }, '2026-09-15').sessions[1].date, '2026-09-10', 'an older demo without a stamp is anchored on its newest sample session');
  assert.equal(demoData().demoDate, dayjs().format('YYYY-MM-DD'));
});
