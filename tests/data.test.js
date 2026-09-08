import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, summarize } from '../src/features/tracker/data.js';
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
