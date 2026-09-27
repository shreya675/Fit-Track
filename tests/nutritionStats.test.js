import test from 'node:test';
import assert from 'node:assert/strict';
import { dayIntake, macroSplit, macroTargets, targetStatus, weekIntake, weekSummary } from '../src/features/tracker/nutritionStats.js';

test('Macro targets come from the profile when set, otherwise from a 30/40/30 split of the calorie target', () => {
  const derived = macroTargets({ nutritionGoal: 2000 });
  assert.deepEqual([derived.calories, derived.protein, derived.carbs, derived.fat], [2000, 150, 200, 67]);
  assert.ok(derived.derived.protein && derived.derived.fat);
  const own = macroTargets({ nutritionGoal: 2000, proteinGoal: 120, fatGoal: '55' });
  assert.equal(own.protein, 120);
  assert.equal(own.fat, 55);
  assert.equal(own.carbs, 200);
  assert.deepEqual(own.derived, { protein: false, carbs: true, fat: false });
  assert.deepEqual([macroTargets({}).calories, macroTargets({}).protein], [0, 0]);
  assert.equal(macroTargets({ nutritionGoal: 2000, proteinGoal: -5 }).protein, 150, 'nonsense goals fall back');
});

test('Day intake sums meals and notices when macros were never recorded', () => {
  const meals = [
    { date: '2026-09-15', calories: 400, protein: 20, carbs: 50, fat: 10 },
    { date: '2026-09-15', calories: 300, protein: null, carbs: null, fat: null },
    { date: '2026-09-14', calories: 999, protein: 1, carbs: 1, fat: 1 },
  ];
  const day = dayIntake(meals, '2026-09-15');
  assert.deepEqual([day.calories, day.protein, day.carbs, day.fat, day.meals, day.macrosMissing], [700, 20, 50, 10, 2, 1]);
  assert.equal(dayIntake(meals, '2026-09-13').meals, 0);
  assert.deepEqual(macroSplit(day), { protein: 22, carbs: 54, fat: 24 });
  assert.equal(macroSplit({ protein: 0, carbs: 0, fat: 0 }), null);
});

test('Target status allows a 10% band and does not judge empty days', () => {
  assert.equal(targetStatus(0, 2000), 'none');
  assert.equal(targetStatus(1500, 0), 'none');
  assert.equal(targetStatus(1799, 2000), 'under');
  assert.equal(targetStatus(1900, 2000), 'on');
  assert.equal(targetStatus(2200, 2000), 'on');
  assert.equal(targetStatus(2201, 2000), 'over');
});

test('Week intake runs Monday to Sunday, pairs eaten with burned, and summarises logged days only', () => {
  const data = {
    profile: { nutritionGoal: 2000 },
    meals: [
      { date: '2026-09-14', calories: 1900, protein: 100, carbs: 200, fat: 60 },
      { date: '2026-09-15', calories: 1200, protein: 50, carbs: 150, fat: 30 },
      { date: '2026-09-15', calories: 1200, protein: 50, carbs: 150, fat: 30 },
      { date: '2026-09-20', calories: 500, protein: 20, carbs: 60, fat: 10 },
    ],
    sessions: [{ date: '2026-09-14', calories: 300 }, { date: '2026-09-14', calories: 100 }, { date: '2026-09-16', calories: 250 }],
  };
  const week = weekIntake(data, '2026-09-17', '2026-09-17');
  assert.deepEqual(week.days.map(day => day.date), ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20']);
  assert.deepEqual(week.days.map(day => day.status), ['on', 'over', 'none', 'none', 'none', 'none', 'under']);
  assert.equal(week.days[0].burned, 400);
  assert.equal(week.days[2].burned, 250);
  assert.ok(week.days[3].isToday);
  assert.ok(week.days[4].future && !week.days[3].future);
  assert.equal(week.loggedDays, 3);
  assert.equal(week.onTarget, 1);
  assert.equal(week.average.calories, Math.round((1900 + 2400 + 500) / 3));
  assert.equal(week.average.protein, Math.round((100 + 100 + 20) / 3));
  assert.equal(week.total.burned, 650);
  assert.equal(week.max, 2400);
  assert.ok(weekSummary(week).startsWith('Average 1,600 kcal over 3 logged days'));
  assert.ok(weekSummary(week).includes('1 within 10%'));
  assert.equal(weekSummary(weekIntake({ profile: {}, meals: [], sessions: [] }, '2026-09-17')), 'No meals logged this week yet.');
});
