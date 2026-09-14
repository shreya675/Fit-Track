import { today } from './data.js';

// Curated content descriptors, not measurements of effectiveness or suitability.
// Every axis is on the same 0–1 scale; categorical labels are never ordinal encoded.
export const featureNames = ['strength', 'cardio', 'mobility', 'upperBody', 'lowerBody', 'core', 'impact', 'equipment'];

// One row per exercise rather than one per group: a wall push-up and a full
// push-up are not the same thing, and sharing a vector made them score alike.
// The trailing number is how demanding the movement is to attempt — 1 gentle,
// 2 moderate, 3 demanding. A curated ease-of-entry label, not an assessment of
// anyone's fitness; it only stops a beginner being handed burpees and pike push-ups.
//                     name                          category    equipment           str  car  mob  upp  low  cor  imp  eqp  dmd
const catalog = [
  ['Wall push-up', 'Strength', 'No equipment', [.55, 0, .05, 1, 0, .2, 0, 0], 1],
  ['Incline push-up', 'Strength', 'No equipment', [.75, 0, .05, 1, 0, .25, 0, 0], 2],
  ['Knee push-up', 'Strength', 'No equipment', [.7, 0, 0, 1, 0, .3, 0, 0], 2],
  ['Push-up', 'Strength', 'No equipment', [1, 0, 0, 1, 0, .4, 0, 0], 3],
  ['Pike push-up', 'Strength', 'No equipment', [1, 0, .15, 1, 0, .35, 0, 0], 3],
  ['Scapular push-up', 'Strength', 'No equipment', [.45, 0, .35, 1, 0, .2, 0, 0], 1],

  ['Dumbbell row', 'Strength', 'Dumbbells', [1, 0, .05, 1, 0, .3, 0, 1], 2],
  ['Floor press', 'Strength', 'Dumbbells', [.95, 0, 0, 1, 0, .25, 0, 1], 2],
  ['Bench press', 'Strength', 'Dumbbells', [1, 0, 0, 1, 0, .2, 0, 1], 2],
  ['Shoulder press', 'Strength', 'Dumbbells', [.95, 0, .1, 1, 0, .35, 0, 1], 2],
  ['Reverse fly', 'Strength', 'Dumbbells', [.7, 0, .2, 1, 0, .2, 0, 1], 1],
  ['Lateral raise', 'Strength', 'Dumbbells', [.7, 0, .1, 1, 0, .15, 0, 1], 1],
  ['Triceps extension', 'Strength', 'Dumbbells', [.8, 0, .05, 1, 0, .15, 0, 1], 2],
  ['Biceps curl', 'Strength', 'Dumbbells', [.85, 0, 0, 1, 0, .1, 0, 1], 1],
  ['Hammer curl', 'Strength', 'Dumbbells', [.8, 0, 0, .95, 0, .1, 0, 1], 1],

  ['Bodyweight squat', 'Strength', 'No equipment', [.9, .1, .2, 0, 1, .35, 0, 0], 2],
  ['Wall sit', 'Strength', 'No equipment', [.85, 0, 0, 0, 1, .3, 0, 0], 1],
  ['Forward lunge', 'Strength', 'No equipment', [.9, .1, .2, 0, 1, .4, 0, 0], 2],
  ['Reverse lunge', 'Strength', 'No equipment', [.9, .1, .25, 0, 1, .45, 0, 0], 2],
  ['Side lunge', 'Strength', 'No equipment', [.9, .1, .35, 0, 1, .4, 0, 0], 2],
  ['Split squat', 'Strength', 'No equipment', [1, 0, .25, 0, 1, .5, 0, 0], 3],
  ['Glute bridge', 'Strength', 'No equipment', [.75, 0, .2, 0, 1, .5, 0, 0], 1],
  ['Standing calf raise', 'Strength', 'No equipment', [.65, 0, .1, 0, 1, .15, 0, 0], 1],

  ['Goblet squat', 'Strength', 'Dumbbells', [1, .05, .15, .2, 1, .45, 0, 1], 2],
  ['Dumbbell sumo squat', 'Strength', 'Dumbbells', [1, 0, .2, 0, 1, .4, 0, 1], 2],
  ['Dumbbell lunge', 'Strength', 'Dumbbells', [1, .05, .2, .1, 1, .45, 0, 1], 3],
  ['Dumbbell Romanian deadlift', 'Strength', 'Dumbbells', [1, 0, .15, .3, 1, .5, 0, 1], 3],
  ['Dumbbell deadlift', 'Strength', 'Dumbbells', [1, 0, .1, .35, 1, .55, 0, 1], 3],
  ['Weighted calf raise', 'Strength', 'Dumbbells', [.75, 0, .05, 0, 1, .15, 0, 1], 2],

  ['Plank', 'Strength', 'Exercise mat', [.8, 0, .1, .4, .2, 1, 0, 0], 2],
  ['Side plank', 'Strength', 'Exercise mat', [.8, 0, .15, .45, .2, 1, 0, 0], 2],
  ['Hollow hold', 'Strength', 'Exercise mat', [.85, 0, .05, .2, .3, 1, 0, 0], 3],
  ['Dead bug', 'Strength', 'Exercise mat', [.55, 0, .3, .2, .3, 1, 0, 0], 1],
  ['Bird dog', 'Strength', 'Exercise mat', [.55, 0, .35, .4, .3, 1, 0, 0], 1],
  ['Heel tap', 'Strength', 'Exercise mat', [.6, 0, .15, .1, .1, 1, 0, 0], 1],
  ['Reverse crunch', 'Strength', 'Exercise mat', [.7, 0, .1, 0, .3, 1, 0, 0], 2],

  ['Easy walk', 'Cardio', 'No equipment', [.1, .65, .1, 0, 1, .15, 0, 0], 1],
  ['Brisk walk', 'Cardio', 'No equipment', [.15, .85, .1, 0, 1, .2, 0, 0], 2],
  ['Easy march', 'Cardio', 'No equipment', [.1, .7, .15, .2, 1, .25, 0, 0], 1],
  ['Step touch', 'Cardio', 'No equipment', [.1, .7, .2, .1, 1, .2, 0, 0], 1],
  ['Side steps', 'Cardio', 'No equipment', [.15, .75, .25, 0, 1, .25, 0, 0], 1],
  ['Heel digs', 'Cardio', 'No equipment', [.1, .65, .2, .2, 1, .2, 0, 0], 1],
  ['Standing knee lifts', 'Cardio', 'No equipment', [.15, .7, .2, .1, 1, .35, 0, 0], 1],

  ['Jogging', 'Cardio', 'No equipment', [.2, 1, .05, .1, 1, .3, .7, 0], 2],
  ['Jumping jacks', 'Cardio', 'No equipment', [.15, .9, .15, .5, 1, .3, .8, 0], 3],
  ['High knees', 'Cardio', 'No equipment', [.25, 1, .1, .3, 1, .5, .9, 0], 3],
  ['Skater hops', 'Cardio', 'No equipment', [.35, .9, .15, .2, 1, .5, .9, 0], 3],
  ['Mountain climber', 'Cardio', 'No equipment', [.45, .9, .05, .6, .8, .9, .6, 0], 3],
  ['Burpee', 'Cardio', 'No equipment', [.5, 1, .05, .7, 1, .6, 1, 0], 3],

  ['Easy pedaling', 'Cardio', 'Stationary bike', [.1, .65, .05, 0, 1, .15, 0, 1], 1],
  ['Steady cycling', 'Cardio', 'Stationary bike', [.25, 1, .05, .1, 1, .25, 0, 1], 2],

  ['Cat-cow', 'Mobility', 'Exercise mat', [.1, 0, 1, .5, .1, .5, 0, 0], 1],
  ['Thoracic rotation', 'Mobility', 'Exercise mat', [.1, 0, 1, .65, .1, .5, 0, 0], 1],
  ['Shoulder circles', 'Mobility', 'Exercise mat', [.05, 0, 1, .9, 0, .1, 0, 0], 1],
  ['Seated torso turns', 'Mobility', 'Exercise mat', [.05, 0, 1, .35, 0, .5, 0, 0], 1],
  ['Standing side reaches', 'Mobility', 'Exercise mat', [.05, 0, 1, .6, .2, .5, 0, 0], 1],
  ['Child’s pose', 'Mobility', 'Exercise mat', [0, 0, 1, .5, .2, .2, 0, 0], 1],

  ['Hip mobility', 'Mobility', 'Exercise mat', [.1, 0, 1, 0, 1, .35, 0, 0], 1],
  ['Ankle circles', 'Mobility', 'Exercise mat', [.05, 0, 1, 0, .7, 0, 0, 0], 1],
  ['Seated forward fold', 'Mobility', 'Exercise mat', [.05, 0, 1, .2, 1, .2, 0, 0], 1],
  ['Gentle low lunge', 'Mobility', 'Exercise mat', [.15, 0, 1, .1, 1, .3, 0, 0], 1],
  ['Hamstring stretch', 'Mobility', 'Exercise mat', [.05, 0, 1, 0, 1, .15, 0, 0], 1],
  ['Calf stretch', 'Mobility', 'Exercise mat', [.05, 0, 1, 0, 1, .05, 0, 0], 1],
];
export const exerciseCatalog = catalog.map(([name, category, equipment, features, demand]) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, category, equipment, features: [...features], demand,
}));
const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const aliases = { 'single arm row': 'dumbbell-row', 'bench supported dumbbell row': 'dumbbell-row', 'light reverse fly': 'reverse-fly', 'comfortable jog': 'jogging', 'morning run': 'jogging', 'easy run': 'jogging', 'comfortable steady pace': 'steady-cycling' };

export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.every(Number.isFinite) || !b.every(Number.isFinite)) return 0;
  const denominator = Math.hypot(...a) * Math.hypot(...b);
  return denominator ? Math.max(0, Math.min(1, a.reduce((sum, value, i) => sum + value * b[i], 0) / denominator)) : 0;
}
const average = vectors => featureNames.map((_, i) => vectors.reduce((sum, vector) => sum + vector[i], 0) / vectors.length);
function matchExercise(value) {
  const name = normalize(typeof value === 'object' ? value?.name : String(value).split('·')[0]);
  return exerciseCatalog.find(exercise => normalize(exercise.name) === name || exercise.id === aliases[name]);
}

// ---------------------------------------------------------------- preferences

/** What someone says they are working towards, and the axis it leans on. */
export const trainingFocuses = {
  'A balanced mix': null,
  'Building strength': 'strength',
  'Stamina and endurance': 'cardio',
  'Moving more easily': 'mobility',
};
/** Equipment a person can say they have. "No equipment" is always available. */
export const equipmentOptions = ['Dumbbells', 'Exercise mat', 'Stationary bike'];
/** How far above their usual a suggestion may jump in impact. */
const impactTolerance = { 'Just getting started': .2, 'Occasionally active': .35, 'Regularly active': .5 };
/** The most demanding movement offered before anything harder is held back. */
const demandCeiling = { 'Just getting started': 1, 'Occasionally active': 2, 'Regularly active': 3 };

// ---------------------------------------------------------------- ranking

const INDEX = Object.fromEntries(featureNames.map((name, i) => [name, i]));
const MODES = ['strength', 'cardio', 'mobility'];
const REGIONS = ['upperBody', 'lowerBody', 'core'];
// The two sets that should stay roughly in proportion to each other.
const BALANCE = [MODES, REGIONS];
const AREA_LABEL = { strength: 'strength', cardio: 'cardio', mobility: 'mobility', upperBody: 'upper body', lowerBody: 'lower body', core: 'core' };
const HALF_LIFE_DAYS = 14;   // a session counts half as much a fortnight later
const WINDOW_DAYS = 84;      // and not at all after twelve weeks
const RESTED_DAYS = 21;      // fully rested, for the purpose of suggesting it again
const TOO_SOON_DAYS = 2;     // just done, so not suggested back to you
const PER_CATEGORY = 2;      // keeps a trio from being three of the same thing
const TOO_ALIKE = .985;      // biceps curl and hammer curl are not two suggestions

const daysBetween = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
const clamp = value => Math.max(0, Math.min(1, value));

/**
 * How far each balance axis sits below the average of its own group. Measured
 * against the person's own mix rather than an ideal, so the suggestion is
 * "this is the part you have touched least", not "this is what you should do".
 */
function gapsFrom(trained) {
  const gaps = featureNames.map(() => 0);
  for (const group of BALANCE) {
    const mean = group.reduce((sum, name) => sum + trained[INDEX[name]], 0) / group.length;
    for (const name of group) gaps[INDEX[name]] = Math.max(0, mean - trained[INDEX[name]]);
  }
  return gaps;
}

function describe({ lastDone, area, fit, focusAxis, feature }) {
  if (area && fit > 0.2) return `Your ${AREA_LABEL[area]} work has been lightest lately`;
  if (focusAxis && feature > 0.7) return `Matches what you are working towards`;
  if (lastDone === null) return 'New to you';
  if (lastDone >= RESTED_DAYS) return `Not done in over ${Math.floor(lastDone / 7)} weeks`;
  if (lastDone >= 7) return `Last done ${Math.floor(lastDone / 7)} week${lastDone >= 14 ? 's' : ''} ago`;
  return 'Fits the work you have been doing';
}

/**
 * Suggestions are built from what a person has logged, weighted towards recent
 * sessions. They favour the part of their own routine that has had the least
 * attention, something they have not done for a while, and equipment they can
 * actually reach — then lean towards what they say they are working on, while
 * staying close to the kind of training they already do. A large jump in impact
 * is damped, by more for someone just getting started.
 *
 * Each completed session contributes equally regardless of length, so long
 * routines do not dominate. Legacy sessions without exercise data fall back to
 * their category's content centroid. Exercises the person has dismissed still
 * count as history but are never suggested back.
 */
export function recommendExercises(sessions = [], plans = [], date = today(), profile = {}) {
  const vectors = [];
  const lastSeen = new Map();
  const equipmentUsed = new Set();
  let categorySessions = 0;
  for (const session of sessions) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(session.date || '') || session.date > date) continue;
    const age = daysBetween(session.date, date);
    if (age > WINDOW_DAYS) continue;
    const weight = Math.pow(0.5, age / HALF_LIFE_DAYS);
    const plan = plans.find(p => session.planId ? p.id === session.planId : normalize(p.title) === normalize(session.title));
    const ids = Array.isArray(session.exerciseIds) ? session.exerciseIds : [];
    const entries = session.exercises || plan?.exercises || [];
    const matched = [...ids.map(id => exerciseCatalog.find(e => e.id === id)), ...(Array.isArray(entries) ? entries : String(entries).split('\n')).map(matchExercise), matchExercise(session.title)].filter(Boolean);
    const unique = [...new Map(matched.map(e => [e.id, e])).values()];
    for (const exercise of unique) {
      equipmentUsed.add(exercise.equipment);
      if (!lastSeen.has(exercise.id) || age < lastSeen.get(exercise.id)) lastSeen.set(exercise.id, age);
    }
    if (unique.length) vectors.push({ vector: average(unique.map(e => e.features)), weight });
    else {
      const category = exerciseCatalog.filter(e => e.category === session.category);
      if (category.length) { vectors.push({ vector: average(category.map(e => e.features)), weight }); categorySessions++; }
    }
  }
  if (!vectors.length) return { items: [], historyCount: 0, categorySessions: 0, dismissedCount: 0 };

  const total = vectors.reduce((sum, item) => sum + item.weight, 0);
  const trained = featureNames.map((_, i) => vectors.reduce((sum, item) => sum + item.vector[i] * item.weight, 0) / total);
  const gaps = gapsFrom(trained);
  const gapTotal = gaps.reduce((sum, value) => sum + value, 0);

  const dismissed = new Set(profile.dismissedExerciseIds || []);
  const declared = (profile.equipment || []).filter(item => equipmentOptions.includes(item));
  const reachable = equipment => equipment === 'No equipment'
    || (declared.length ? declared.includes(equipment) : true);
  const focusAxis = trainingFocuses[profile.trainingFocus] || null;
  const tolerance = impactTolerance[profile.activityLevel] ?? .35;
  // Someone who has already done demanding work has shown it suits them, whatever
  // they said when they signed up.
  const attempted = [...lastSeen.keys()].map(id => exerciseCatalog.find(e => e.id === id)?.demand || 0);
  const ceiling = Math.max(demandCeiling[profile.activityLevel] ?? 2, ...attempted, 1);

  const scored = exerciseCatalog
    .filter(exercise => !dismissed.has(exercise.id) && reachable(exercise.equipment))
    .map(exercise => {
      const lastDone = lastSeen.has(exercise.id) ? lastSeen.get(exercise.id) : null;
      const contributions = gaps.map((gap, i) => gap * exercise.features[i]);
      const fit = gapTotal ? contributions.reduce((sum, value) => sum + value, 0) / gapTotal : 0;
      const rest = lastDone === null ? 1 : clamp(lastDone / RESTED_DAYS);
      // Declared equipment is a filter above; history is only a hint about habits.
      const known = declared.length || equipmentUsed.has(exercise.equipment) ? 1 : 0.5;
      const similar = cosineSimilarity(trained, exercise.features);
      // A constant for a balanced focus, so it shifts nothing.
      const focus = focusAxis ? exercise.features[INDEX[focusAxis]] : 0.5;
      // Stepping up the impact of a routine is offered gently, never led with.
      const gentleness = exercise.features[INDEX.impact] - trained[INDEX.impact] > tolerance ? 0.6 : 1;
      // Harder movements than the person has shown are not led with either.
      const step = exercise.demand - ceiling;
      const readiness = step <= 0 ? 1 : step === 1 ? 0.55 : 0.3;
      // Body regions only describe strength work here; a stretch is explained by
      // its mode, so "child's pose" is never sold as upper body training.
      const namable = exercise.category === 'Strength' ? [...MODES, ...REGIONS] : MODES;
      const best = namable.reduce((top, name) =>
        contributions[INDEX[name]] > contributions[INDEX[top]] ? name : top, namable[0]);
      return {
        ...exercise,
        lastDone,
        reason: describe({
          lastDone, fit, focusAxis,
          area: contributions[INDEX[best]] > 0 ? best : null,
          feature: focusAxis ? exercise.features[INDEX[focusAxis]] : 0,
        }),
        score: (0.40 * fit + 0.22 * rest + 0.13 * known + 0.10 * similar + 0.15 * focus) * gentleness * readiness,
      };
    })
    .filter(exercise => exercise.lastDone === null || exercise.lastDone > TOO_SOON_DAYS)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const items = [];
  const perCategory = new Map();
  for (const exercise of scored) {
    const used = perCategory.get(exercise.category) || 0;
    if (used >= PER_CATEGORY) continue;
    if (items.some(chosen => cosineSimilarity(chosen.features, exercise.features) > TOO_ALIKE)) continue;
    perCategory.set(exercise.category, used + 1);
    items.push(exercise);
    if (items.length === 3) break;
  }
  return { items, historyCount: vectors.length, categorySessions, dismissedCount: dismissed.size };
}
