import test from 'node:test';
import assert from 'node:assert/strict';
import { cosineSimilarity, exerciseCatalog, featureNames, recommendExercises } from '../src/features/tracker/recommendations.js';
const date = '2026-09-11';
const history = values => values.map(value => ({ date, ...value }));

test('Catalog contains over 50 unique exercises with eight normalized features', () => {
  assert.ok(exerciseCatalog.length > 50);
  assert.equal(new Set(exerciseCatalog.map(e => e.id)).size, exerciseCatalog.length);
  assert.equal(featureNames.length, 8);
  assert.ok(exerciseCatalog.every(e => e.features.length === 8 && e.features.every(n => n >= 0 && n <= 1)));
});
test('Cosine similarity handles identical, orthogonal, zero and invalid vectors', () => {
  assert.equal(cosineSimilarity([1, 0], [2, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([0, 0], [1, 0]), 0);
  assert.equal(cosineSimilarity([NaN], [1]), 0);
  assert.equal(cosineSimilarity([1], [1, 2]), 0);
});
test('Empty, unknown and future history does not fabricate personalization', () => {
  assert.deepEqual(recommendExercises([], [], date).items, []);
  assert.equal(recommendExercises([{ date: '2099-01-01', category: 'Strength' }, { date, title: 'Unknown' }], [], date).historyCount, 0);
});
test('History changes produce three deterministic, descending, relevant suggestions', () => {
  for (const category of ['Strength', 'Cardio', 'Mobility']) {
    const sessions = history([{ category }]);
    const result = recommendExercises(sessions, [], date);
    assert.equal(result.items.length, 3);
    assert.ok(result.items.every(e => e.category === category && Number.isFinite(e.score)));
    assert.ok(result.items[0].score >= result.items[1].score && result.items[1].score >= result.items[2].score);
    assert.deepEqual(result, recommendExercises(sessions, [], date));
    assert.equal(sessions.length, 1);
  }
});
test('Exercise names, IDs, and legacy plan references resolve without category fallback', () => {
  const plan = { id: 'routine', title: 'Custom routine', exercises: ['Goblet squat · 3 × 10'] };
  for (const session of [{ exerciseIds: ['goblet-squat'] }, { title: 'Goblet squat' }, { planId: plan.id }, { title: plan.title }]) {
    const result = recommendExercises(history([session]), [plan], date);
    assert.equal(result.historyCount, 1);
    assert.equal(result.categorySessions, 0);
    assert.ok(result.items.every(e => e.features[4] === 1 && e.category === 'Strength'));
  }
});
test('Session snapshots preserve recommendations after routine edits or deletion', () => {
  const sessions = history([{ planId: 'removed', exercises: ['Cat-cow · 2 × 10'] }]);
  assert.ok(recommendExercises(sessions, [], date).items.every(e => e.category === 'Mobility'));
});
