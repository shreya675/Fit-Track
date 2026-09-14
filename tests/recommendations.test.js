import test from 'node:test';
import assert from 'node:assert/strict';
import { cosineSimilarity, exerciseCatalog, featureNames, recommendExercises } from '../src/features/tracker/recommendations.js';
const date = '2026-09-11';
const history = values => values.map(value => ({ date, ...value }));
const daysBefore = n => new Date(Date.parse(`${date}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10);

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

test('History produces three deterministic, descending suggestions without mutating it', () => {
  for (const category of ['Strength', 'Cardio', 'Mobility']) {
    const sessions = history([{ category }]);
    const result = recommendExercises(sessions, [], date);
    assert.equal(result.items.length, 3);
    assert.ok(result.items.every(e => Number.isFinite(e.score) && e.reason));
    assert.ok(result.items[0].score >= result.items[1].score && result.items[1].score >= result.items[2].score);
    assert.deepEqual(result, recommendExercises(sessions, [], date));
    assert.equal(sessions.length, 1);
  }
});

test('Suggestions broaden a narrow routine instead of mirroring it', () => {
  // Nothing but lower body strength for a month.
  const sessions = [0, 3, 7, 10, 14, 17, 21].map(n => ({ date: daysBefore(n), title: 'Goblet squat', category: 'Strength' }));
  const items = recommendExercises(sessions, [], date).items;
  assert.ok(items.some(e => e.features[featureNames.indexOf('upperBody')] > 0.5),
    'the untrained half of the body is offered');
  assert.ok(!items.some(e => e.category === 'Strength' && e.features[featureNames.indexOf('lowerBody')] === 1),
    'and it stops offering more lower body strength (lower body cardio is a different thing)');
  assert.ok(items.every(e => e.reason.length > 0));
});

test('A trio is never three of the same category', () => {
  const sessions = [0, 2, 4, 6, 8].map(n => ({ date: daysBefore(n), title: 'Easy walk', category: 'Cardio' }));
  const counts = {};
  for (const item of recommendExercises(sessions, [], date).items) counts[item.category] = (counts[item.category] || 0) + 1;
  assert.ok(Object.values(counts).every(count => count <= 2), JSON.stringify(counts));
});

test('What you did in the last couple of days is not handed straight back', () => {
  const sessions = [{ date: daysBefore(1), title: 'Bodyweight squat', category: 'Strength' }];
  const items = recommendExercises(sessions, [], date).items;
  assert.ok(!items.some(e => e.id === 'bodyweight-squat'));
  // The same exercise becomes available again once it has had a rest.
  const older = [{ date: daysBefore(30), title: 'Bodyweight squat', category: 'Strength' }];
  assert.ok(recommendExercises(older, [], date).items.every(e => Number.isFinite(e.score)));
});

test('Recent sessions count more than old ones, and very old ones not at all', () => {
  const recentCardio = recommendExercises([
    { date: daysBefore(60), title: 'Goblet squat', category: 'Strength' },
    { date: daysBefore(1), title: 'Easy walk', category: 'Cardio' },
  ], [], date);
  const recentStrength = recommendExercises([
    { date: daysBefore(60), title: 'Easy walk', category: 'Cardio' },
    { date: daysBefore(1), title: 'Goblet squat', category: 'Strength' },
  ], [], date);
  assert.notDeepEqual(recentCardio.items.map(e => e.id), recentStrength.items.map(e => e.id),
    'the order of the same two sessions changes what is suggested');
  assert.equal(recommendExercises([{ date: daysBefore(200), title: 'Easy walk', category: 'Cardio' }], [], date).historyCount, 0,
    'a session from six months ago is outside the window');
});

test('Exercise names, IDs, and legacy plan references resolve without category fallback', () => {
  const plan = { id: 'routine', title: 'Custom routine', exercises: ['Goblet squat · 3 × 10'] };
  for (const session of [{ exerciseIds: ['goblet-squat'] }, { title: 'Goblet squat' }, { planId: plan.id }, { title: plan.title }]) {
    const result = recommendExercises(history([session]), [plan], date);
    assert.equal(result.historyCount, 1);
    assert.equal(result.categorySessions, 0, 'the exercise was recognised, so no category centroid was needed');
    assert.equal(result.items.length, 3);
  }
});

test('Session snapshots preserve recommendations after routine edits or deletion', () => {
  const sessions = history([{ planId: 'removed', exercises: ['Cat-cow · 2 × 10'] }]);
  const result = recommendExercises(sessions, [], date);
  assert.equal(result.historyCount, 1);
  assert.equal(result.categorySessions, 0, 'the stored exercise list is used even though the routine is gone');
});

test('Every exercise has its own feature vector and a demand level', () => {
  const vectors = new Set(exerciseCatalog.map(e => e.features.join(',')));
  assert.equal(vectors.size, exerciseCatalog.length, 'no two exercises share a vector');
  assert.ok(exerciseCatalog.every(e => [1, 2, 3].includes(e.demand)));
  // A wall push-up and a full push-up are no longer interchangeable.
  const wall = exerciseCatalog.find(e => e.id === 'wall-push-up');
  const full = exerciseCatalog.find(e => e.id === 'push-up');
  assert.ok(wall.features[featureNames.indexOf('strength')] < full.features[featureNames.indexOf('strength')]);
  assert.ok(wall.demand < full.demand);
});

test('Near-identical exercises are not offered side by side', () => {
  const sessions = [0, 3, 7, 10].map(n => ({ date: daysBefore(n), title: 'Goblet squat', category: 'Strength' }));
  const items = recommendExercises(sessions, [], date).items;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      assert.ok(cosineSimilarity(items[i].features, items[j].features) <= 0.985,
        `${items[i].name} and ${items[j].name} are too alike to suggest together`);
    }
  }
});

test('Dismissed exercises stop being suggested but still count as history', () => {
  const sessions = [0, 3, 7, 10, 14].map(n => ({ date: daysBefore(n), title: 'Goblet squat', category: 'Strength' }));
  const before = recommendExercises(sessions, [], date);
  const dropped = before.items[0].id;
  const after = recommendExercises(sessions, [], date, { dismissedExerciseIds: [dropped] });
  assert.ok(!after.items.some(e => e.id === dropped));
  assert.equal(after.items.length, 3, 'the gap is filled by the next suggestion');
  assert.equal(after.dismissedCount, 1);
  assert.equal(after.historyCount, before.historyCount, 'history is unchanged');
});

test('Declared equipment is a limit; declaring none falls back to what was logged', () => {
  const sessions = [0, 3, 7].map(n => ({ date: daysBefore(n), title: 'Goblet squat', category: 'Strength' }));
  const limited = recommendExercises(sessions, [], date, { equipment: ['Exercise mat'] }).items;
  assert.ok(limited.every(e => ['Exercise mat', 'No equipment'].includes(e.equipment)), JSON.stringify(limited.map(e => e.equipment)));
  assert.ok(recommendExercises(sessions, [], date, { equipment: [] }).items.length === 3);
  assert.ok(recommendExercises(sessions, [], date, { equipment: ['Nonsense'] }).items.length === 3,
    'an unrecognised entry is ignored rather than hiding everything');
});

test('A stated focus leans the suggestions without overruling the gaps', () => {
  const sessions = [0, 3, 7, 10].map(n => ({ date: daysBefore(n), title: 'Goblet squat', category: 'Strength' }));
  const mobility = recommendExercises(sessions, [], date, { trainingFocus: 'Moving more easily' }).items;
  const endurance = recommendExercises(sessions, [], date, { trainingFocus: 'Stamina and endurance' }).items;
  assert.notDeepEqual(mobility.map(e => e.id), endurance.map(e => e.id));
  assert.ok(mobility.some(e => e.category === 'Mobility'));
  assert.ok(endurance.some(e => e.category === 'Cardio'));
  assert.deepEqual(recommendExercises(sessions, [], date, { trainingFocus: 'A balanced mix' }).items.map(e => e.id),
    recommendExercises(sessions, [], date).items.map(e => e.id), 'a balanced focus changes nothing');
});

test('Demanding movements are held back from someone just getting started', () => {
  const sessions = [0, 2, 4, 6].map(n => ({ date: daysBefore(n), title: 'Easy walk', category: 'Cardio' }));
  const beginner = recommendExercises(sessions, [], date, { activityLevel: 'Just getting started' }).items;
  assert.ok(beginner.every(e => e.demand <= 2), JSON.stringify(beginner.map(e => [e.name, e.demand])));
  assert.ok(!beginner.some(e => e.id === 'burpee' || e.id === 'pike-push-up'));
  // Someone who already trains hard is not held back in the same way.
  const active = recommendExercises(sessions, [], date, { activityLevel: 'Regularly active' }).items;
  assert.notDeepEqual(active.map(e => e.id), beginner.map(e => e.id));
});
