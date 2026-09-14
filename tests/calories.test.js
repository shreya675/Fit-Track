import test from 'node:test';
import assert from 'node:assert/strict';
import { bodyWeight, categoryMet, estimateCalories, exerciseMet, metFor } from '../src/features/tracker/calories.js';
import { exerciseArt } from '../src/features/tracker/exerciseArtMatch.js';

test('Every illustrated exercise has a metabolic equivalent', () => {
  const missing = Object.keys(exerciseArt).filter(slug => !Number.isFinite(exerciseMet[slug]));
  assert.deepEqual(missing, []);
  const strange = Object.entries(exerciseMet).filter(([, met]) => met < 1 || met > 15);
  assert.deepEqual(strange, [], 'metabolic equivalents should stay in a plausible range');
});

test('The metabolic equivalent averages the exercises that were done', () => {
  assert.equal(metFor({ exercises: ['Push-up · 3 × 10'] }), exerciseMet['push-up']);
  const pair = ['Push-up · 3 × 10', 'Child’s pose · 2 minutes'];
  assert.equal(metFor({ exercises: pair }), (exerciseMet['push-up'] + exerciseMet['childs-pose']) / 2);
  assert.equal(metFor({ exercises: ['Something nobody has heard of'], category: 'Cardio' }), categoryMet.Cardio);
  assert.equal(metFor({ category: 'Mobility' }), categoryMet.Mobility);
  assert.equal(metFor({ category: 'Nonsense' }), 3.5, 'an unknown category still gives a usable default');
  assert.equal(metFor(), 3.5);
});

test('Calories follow the metabolic equivalent formula', () => {
  // 6 MET x 3.5 x 70 kg / 200 = 7.35 kcal/min, over 30 minutes.
  assert.equal(estimateCalories({ minutes: 30, weightKg: 70, category: 'Cardio' }), 221);
  assert.equal(estimateCalories({ minutes: 60, weightKg: 70, category: 'Cardio' }), 441, 'twice the time, twice the cost');
  assert.ok(estimateCalories({ minutes: 30, weightKg: 90, category: 'Cardio' })
    > estimateCalories({ minutes: 30, weightKg: 60, category: 'Cardio' }), 'a heavier body burns more');
  assert.ok(estimateCalories({ minutes: 30, weightKg: 70, category: 'Cardio' })
    > estimateCalories({ minutes: 30, weightKg: 70, category: 'Mobility' }), 'cardio costs more than mobility');
});

test('An estimate is refused rather than invented when the inputs are unusable', () => {
  assert.equal(estimateCalories({ minutes: 30 }), null, 'no weight, no estimate');
  assert.equal(estimateCalories({ weightKg: 70 }), null, 'no duration, no estimate');
  assert.equal(estimateCalories({ minutes: 0, weightKg: 70 }), null);
  assert.equal(estimateCalories({ minutes: -5, weightKg: 70 }), null);
  assert.equal(estimateCalories({ minutes: 5000, weightKg: 70 }), null);
  assert.equal(estimateCalories({ minutes: 30, weightKg: 5 }), null, 'implausible weights are rejected');
  assert.equal(estimateCalories({ minutes: 30, weightKg: 'heavy' }), null);
  assert.equal(estimateCalories(), null);
});

test('A logged reading is preferred over the figure typed into the profile', () => {
  const data = {
    profile: { weight: 80 },
    measurements: [{ date: '2026-09-01', weight: 76 }, { date: '2026-09-10', weight: 75 }],
  };
  assert.deepEqual(bodyWeight(data), { weight: 75, source: 'log', date: '2026-09-10' });
  assert.deepEqual(bodyWeight({ profile: { weight: 80 }, measurements: [] }), { weight: 80, source: 'profile' });
  assert.equal(bodyWeight({ profile: {}, measurements: [] }), null);
  assert.equal(bodyWeight({ profile: { weight: 0 } }), null);
  assert.equal(bodyWeight(), null);
});
