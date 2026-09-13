import { today } from './data.js';

// Curated content descriptors, not measurements of effectiveness or suitability.
// Every axis is on the same 0–1 scale; categorical labels are never ordinal encoded.
export const featureNames = ['strength', 'cardio', 'mobility', 'upperBody', 'lowerBody', 'core', 'impact', 'equipment'];
const groups = [
  ['Strength', [1, 0, 0, 1, 0, .3, 0, 0], 'No equipment', 'Wall push-up|Incline push-up|Push-up|Knee push-up|Scapular push-up|Pike push-up'],
  ['Strength', [1, 0, 0, 1, 0, .3, 0, 1], 'Dumbbells', 'Dumbbell row|Floor press|Shoulder press|Biceps curl|Hammer curl|Reverse fly|Triceps extension|Lateral raise|Bench press'],
  ['Strength', [1, 0, .2, 0, 1, .4, 0, 0], 'No equipment', 'Bodyweight squat|Reverse lunge|Forward lunge|Glute bridge|Standing calf raise|Wall sit|Split squat|Side lunge'],
  ['Strength', [1, 0, .1, 0, 1, .4, 0, 1], 'Dumbbells', 'Goblet squat|Dumbbell Romanian deadlift|Dumbbell deadlift|Dumbbell lunge|Weighted calf raise|Dumbbell sumo squat'],
  ['Strength', [.8, 0, .2, .2, .2, 1, 0, 0], 'Exercise mat', 'Plank|Side plank|Dead bug|Bird dog|Heel tap|Reverse crunch|Hollow hold'],
  ['Cardio', [0, 1, .1, 0, 1, .2, 0, 0], 'No equipment', 'Easy walk|Brisk walk|Easy march|Side steps|Standing knee lifts|Heel digs|Step touch'],
  ['Cardio', [.2, 1, 0, .2, 1, .5, 1, 0], 'No equipment', 'Jogging|Jumping jacks|High knees|Skater hops|Mountain climber|Burpee'],
  ['Cardio', [.2, 1, 0, .2, 1, .3, 0, 1], 'Stationary bike', 'Easy pedaling|Steady cycling'],
  ['Mobility', [0, 0, 1, .6, .3, .5, 0, 0], 'Exercise mat', 'Cat-cow|Thoracic rotation|Shoulder circles|Seated torso turns|Standing side reaches|Child’s pose'],
  ['Mobility', [0, 0, 1, 0, 1, .3, 0, 0], 'Exercise mat', 'Hip mobility|Ankle circles|Seated forward fold|Gentle low lunge|Hamstring stretch|Calf stretch'],
];
export const exerciseCatalog = groups.flatMap(([category, features, equipment, names]) => names.split('|').map(name => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, category, equipment, features: [...features],
})));
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

// Each completed session contributes equally, so long routines do not dominate.
// Legacy sessions without exercise data use their category's content centroid.
export function recommendExercises(sessions = [], plans = [], date = today()) {
  const vectors = [];
  let categorySessions = 0;
  for (const session of sessions) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(session.date || '') || session.date > date) continue;
    const plan = plans.find(p => session.planId ? p.id === session.planId : normalize(p.title) === normalize(session.title));
    const ids = Array.isArray(session.exerciseIds) ? session.exerciseIds : [];
    const entries = session.exercises || plan?.exercises || [];
    const matched = [...ids.map(id => exerciseCatalog.find(e => e.id === id)), ...(Array.isArray(entries) ? entries : String(entries).split('\n')).map(matchExercise), matchExercise(session.title)].filter(Boolean);
    const unique = [...new Map(matched.map(e => [e.id, e])).values()];
    if (unique.length) vectors.push(average(unique.map(e => e.features)));
    else {
      const category = exerciseCatalog.filter(e => e.category === session.category);
      if (category.length) { vectors.push(average(category.map(e => e.features))); categorySessions++; }
    }
  }
  if (!vectors.length) return { items: [], historyCount: 0, categorySessions: 0 };
  const profile = average(vectors);
  const items = exerciseCatalog.map(exercise => ({ ...exercise, score: cosineSimilarity(profile, exercise.features) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 3);
  return { items, historyCount: vectors.length, categorySessions };
}
