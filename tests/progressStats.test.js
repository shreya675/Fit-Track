import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bestSet, exerciseLog, isLoggedSet, lastSetsFor, latestWeight, personalRecords,
  sessionSets, sessionVolume, setVolume, weightChange, weightSeries,
} from '../src/features/tracker/progressStats.js';

const squat = sets => ({ slug: 'goblet-squat', name: 'Goblet squat', sets });
const session = (date, entries) => ({ id: date, date, entries });

test('A set counts once it has repetitions, with or without weight', () => {
  assert.equal(isLoggedSet({ weight: 20, reps: 5 }), true);
  assert.equal(isLoggedSet({ weight: 0, reps: 12 }), true, 'bodyweight sets count');
  assert.equal(isLoggedSet({ weight: 20, reps: 0 }), false);
  assert.equal(isLoggedSet({ weight: 20 }), false);
  assert.equal(isLoggedSet(undefined), false);
  assert.equal(setVolume({ weight: 10, reps: 8 }), 80);
  assert.equal(setVolume({ weight: 0, reps: 8 }), 0, 'bodyweight adds no tonnage');
  assert.equal(setVolume({ weight: 'heavy', reps: 8 }), 0);
});

test('The best set is the heaviest, with repetitions breaking ties', () => {
  assert.deepEqual(bestSet([{ weight: 10, reps: 10 }, { weight: 12, reps: 4 }]), { weight: 12, reps: 4 });
  assert.deepEqual(bestSet([{ weight: 12, reps: 4 }, { weight: 12, reps: 9 }]), { weight: 12, reps: 9 });
  assert.deepEqual(bestSet([{ weight: 0, reps: 8 }, { weight: 0, reps: 15 }]), { weight: 0, reps: 15 });
  assert.equal(bestSet([{ weight: 30, reps: 0 }]), null);
  assert.equal(bestSet([]), null);
});

test('Session totals count only sets that were actually logged', () => {
  const entry = session('2026-09-10', [squat([{ weight: 10, reps: 10 }, { weight: 10, reps: 8 }, { weight: 10, reps: 0 }])]);
  assert.equal(sessionVolume(entry), 180);
  assert.equal(sessionSets(entry), 2);
  assert.equal(sessionVolume({}), 0);
  assert.equal(sessionSets(undefined), 0);
});

test('The exercise log groups sessions and finds each exercise record', () => {
  const sessions = [
    session('2026-09-01', [squat([{ weight: 10, reps: 10 }])]),
    session('2026-09-08', [squat([{ weight: 14, reps: 6 }]), { name: 'Plank', sets: [{ weight: 0, reps: 3 }] }]),
    session('2026-09-15', [squat([{ weight: 12, reps: 10 }])]),
    session('not-a-date', [squat([{ weight: 99, reps: 10 }])]),
  ];
  const log = exerciseLog(sessions);
  assert.deepEqual(log.map(row => row.name), ['Goblet squat', 'Plank']);
  const goblet = log[0];
  assert.deepEqual(goblet.sessions.map(item => item.date), ['2026-09-15', '2026-09-08', '2026-09-01'], 'newest first');
  assert.deepEqual(goblet.best, { weight: 14, reps: 6, date: '2026-09-08' });
  assert.equal(goblet.latest.date, '2026-09-15');
  assert.equal(goblet.totalSets, 3);
  assert.equal(exerciseLog([]).length, 0);
  assert.equal(exerciseLog([session('2026-09-01', [squat([{ weight: 10, reps: 0 }])])]).length, 0, 'empty sets are not an exercise');
});

test('Records are listed heaviest first and exercises without a slug still group', () => {
  const sessions = [session('2026-09-01', [
    { name: 'Bench press', sets: [{ weight: 40, reps: 5 }] },
    { name: 'bench press', sets: [{ weight: 45, reps: 3 }] },
    { slug: 'plank', name: 'Plank', sets: [{ weight: 0, reps: 2 }] },
  ])];
  const records = personalRecords(sessions);
  assert.deepEqual(records.map(r => r.name), ['Bench press', 'Plank']);
  assert.equal(records[0].weight, 45, 'the two spellings merge into one record');
  assert.equal(records[0].totalSets, 2);
});

test('The last sets for an exercise come from the most recent session that has them', () => {
  const sessions = [
    session('2026-09-01', [squat([{ weight: 10, reps: 10 }])]),
    session('2026-09-08', [squat([{ weight: 12, reps: 8 }, { weight: 12, reps: 6 }])]),
    session('2026-09-15', [squat([])]),
  ];
  assert.deepEqual(lastSetsFor(sessions, { slug: 'goblet-squat' }), [{ weight: 12, reps: 8 }, { weight: 12, reps: 6 }]);
  assert.deepEqual(lastSetsFor(sessions, { name: 'Goblet squat' }), [{ weight: 12, reps: 8 }, { weight: 12, reps: 6 }]);
  assert.deepEqual(lastSetsFor(sessions, { slug: 'plank' }), []);
  assert.deepEqual(lastSetsFor([], { slug: 'goblet-squat' }), []);
  assert.deepEqual(lastSetsFor(sessions, {}), []);
});

test('Weight readings are sorted, deduplicated by day, and cleaned of bad values', () => {
  const series = weightSeries([
    { date: '2026-09-10', weight: 75 },
    { date: '2026-09-01', weight: 76 },
    { date: '2026-09-10', weight: 74.5 },
    { date: 'nonsense', weight: 70 },
    { date: '2026-09-05', weight: 0 },
  ]);
  assert.deepEqual(series, [{ date: '2026-09-01', weight: 76 }, { date: '2026-09-10', weight: 74.5 }]);
  assert.deepEqual(latestWeight(series), { date: '2026-09-10', weight: 74.5 });
  assert.equal(latestWeight([]), null);
});

test('Weight change compares the latest reading with the oldest one inside the window', () => {
  const readings = [
    { date: '2026-07-01', weight: 80 },
    { date: '2026-08-20', weight: 77 },
    { date: '2026-09-10', weight: 75.5 },
  ];
  assert.deepEqual(weightChange(readings, 30), { from: readings[1], to: readings[2], difference: -1.5 });
  assert.deepEqual(weightChange(readings, 120).from, readings[0]);
  assert.equal(weightChange([readings[2]]), null, 'one reading is not a trend');
  assert.equal(weightChange(readings, 5), null, 'nothing to compare against inside the window');
});

test('An exercise stored with a slug still matches one identified only by name', () => {
  const sessions = [
    session('2026-09-01', [{ name: 'Goblet squat', sets: [{ weight: 10, reps: 10 }] }]),
    session('2026-09-08', [{ slug: 'goblet-squat', name: 'Goblet squat', sets: [{ weight: 12, reps: 8 }] }]),
  ];
  assert.equal(exerciseLog(sessions).length, 1, 'both spellings are one exercise');
  assert.equal(exerciseLog(sessions)[0].sessions.length, 2);
  assert.deepEqual(lastSetsFor(sessions, { name: 'Goblet squat' }), [{ weight: 12, reps: 8 }]);
  assert.deepEqual(lastSetsFor(sessions, { slug: 'goblet-squat', name: 'Goblet squat' }), [{ weight: 12, reps: 8 }]);
});

test('Newest timestamp wins for same-day weights in either storage order', () => {
  const older = { date: '2026-09-10', weight: 80, createdAt: '2026-09-10T08:00:00Z' };
  const newer = { date: '2026-09-10', weight: 79, createdAt: '2026-09-10T09:00:00Z' };
  for (const readings of [[older, newer], [newer, older]]) {
    assert.equal(latestWeight(readings).weight, 79);
  }
  const corrected = { ...older, weight: 78, updatedAt: '2026-09-10T10:00:00Z' };
  assert.equal(latestWeight([corrected, newer]).weight, 78);
  assert.equal(latestWeight([newer, corrected]).weight, 78);
  assert.equal(latestWeight([newer, { date: newer.date, weight: 90 }]).weight, 79);
  assert.equal(latestWeight([newer, { ...older, updatedAt: { seconds: Date.parse('2026-09-10T11:00:00Z') / 1000 } }]).weight, 80);
});
