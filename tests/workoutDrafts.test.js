import test from 'node:test';
import assert from 'node:assert/strict';
import { draftKey, readDrafts, writeDrafts } from '../src/features/tracker/workoutDrafts.js';

const memory = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
test('Drafts survive reload with sets, timer, review and the original routine snapshot', () => {
  const storage = memory();
  const draft = { plan: { id: 'squat', title: 'Legs', exercises: ['Squat'] }, elapsed: 123, started: true, finish: true, checked: [0], sets: { 0: [{ weight: '20', reps: '8' }] }, review: { notes: 'Keep this', calories: '42' } };
  writeDrafts(storage, draftKey('alice'), { squat: draft });
  assert.deepEqual(readDrafts(storage, draftKey('alice')), { squat: draft });
  assert.deepEqual(readDrafts(storage, draftKey('bob')), {});
  assert.deepEqual(readDrafts(storage, draftKey()), {});
  writeDrafts(storage, draftKey('alice'), {});
  assert.deepEqual(readDrafts(storage, draftKey('alice')), {});
});
test('Malformed drafts are ignored and storage failures reach the caller', () => {
  const storage = memory();
  storage.setItem('key', JSON.stringify({ bad: { elapsed: -1 } }));
  assert.deepEqual(readDrafts(storage, 'key'), {});
  storage.setItem('key', '{');
  assert.throws(() => readDrafts(storage, 'key'));
  assert.throws(() => writeDrafts({ setItem() { throw new Error('Quota'); } }, 'key', { draft: {} }), /Quota/);
});
