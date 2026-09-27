import test from 'node:test';
import assert from 'node:assert/strict';
import { adjustRest, clampRest, countLoggedSets, formatClock, readRestSeconds, restProgress, restRemaining, startRest, writeRestSeconds, DEFAULT_REST } from '../src/features/tracker/restTimer.js';

test('Rest lengths stay within bounds and on the 15-second grid', () => {
  assert.equal(clampRest(90), 90);
  assert.equal(clampRest(92), 90);
  assert.equal(clampRest(5), 15);
  assert.equal(clampRest(9999), 600);
  assert.equal(clampRest('abc'), DEFAULT_REST);
  assert.equal(clampRest(null), DEFAULT_REST);
});

test('Preference survives a round trip and tolerates a broken storage', () => {
  const store = new Map();
  const storage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  assert.equal(readRestSeconds(storage), DEFAULT_REST);
  writeRestSeconds(storage, 120);
  assert.equal(readRestSeconds(storage), 120);
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(readRestSeconds(broken), DEFAULT_REST);
  assert.doesNotThrow(() => writeRestSeconds(broken, 60));
});

test('Logged sets are counted across exercises and blank rows are ignored', () => {
  assert.equal(countLoggedSets({}), 0);
  assert.equal(countLoggedSets({ 0: [{ weight: '', reps: '' }] }), 0);
  assert.equal(countLoggedSets({ 0: [{ weight: 20, reps: 8 }, { weight: '', reps: 10 }], 2: [{ weight: '', reps: '' }, { weight: 5, reps: 12 }] }), 3);
});

test('A rest counts down from its length, can be adjusted, and never goes negative', () => {
  const now = 1_000_000;
  const rest = startRest(90, now);
  assert.equal(restRemaining(rest, now), 90);
  assert.equal(restRemaining(rest, now + 30_000), 60);
  assert.equal(restRemaining(rest, now + 91_000), 0);
  assert.equal(restProgress(rest, now + 45_000), 0.5);
  const longer = adjustRest(rest, 15, now + 30_000);
  assert.equal(restRemaining(longer, now + 30_000), 75);
  assert.equal(longer.total, 90);
  const shorter = adjustRest(rest, -100, now + 30_000);
  assert.equal(restRemaining(shorter, now + 30_000), 0);
  assert.equal(adjustRest(null, 15), null);
});

test('Clock formatting pads minutes and seconds', () => {
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(75), '01:15');
  assert.equal(formatClock(-4), '00:00');
  assert.equal(formatClock(600), '10:00');
});
