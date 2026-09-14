import test from 'node:test';
import assert from 'node:assert/strict';
import { plans } from '../src/features/tracker/data.js';
import { exerciseCatalog } from '../src/features/tracker/recommendations.js';
import { exerciseArt, exerciseArtUrl, exercisePhotoUrl, findExerciseArt, findPlanArt, mainPhoto } from '../src/features/tracker/exerciseArtMatch.js';

test('Every exercise in the workout library has an illustration', () => {
  const missing = [];
  for (const plan of plans) for (const exercise of plan.exercises) if (!findExerciseArt(exercise)) missing.push(exercise);
  assert.deepEqual(missing, []);
});

test('Every recommended exercise has an illustration', () => {
  const missing = exerciseCatalog.filter(exercise => !findExerciseArt(exercise.name)).map(exercise => exercise.name);
  assert.deepEqual(missing, []);
});

test('Illustrations carry a name and form cues', () => {
  for (const [slug, art] of Object.entries(exerciseArt)) {
    assert.match(slug, /^[a-z0-9-]+$/, `${slug} is not a usable file name`);
    assert.ok(art.name, `${slug} has no name`);
    assert.ok(art.cues.length >= 3, `${slug} has fewer than three cues`);
  }
});

test('Exercise lines match regardless of counts, wording, or punctuation', () => {
  assert.equal(findExerciseArt('Bodyweight squat · 2 × 10').slug, 'bodyweight-squat');
  assert.equal(findExerciseArt('Bench-supported dumbbell row · 3 × 10 each side').slug, 'dumbbell-row');
  assert.equal(findExerciseArt('Child’s pose or seated rest · 2 minutes').slug, 'childs-pose');
  assert.equal(findExerciseArt({ name: 'Wall push-up', sets: 2, reps: 10 }).slug, 'wall-push-up');
  assert.equal(findExerciseArt('Standing calf raise · 3 × 12').slug, 'standing-calf-raise');
  assert.equal(findExerciseArt('Slow bodyweight squat to a chair').slug, 'bodyweight-squat');
  assert.equal(findExerciseArt('Something nobody has heard of'), null);
  assert.equal(findExerciseArt(''), null);
  assert.equal(findExerciseArt(undefined), null);
});

test('A workout card prefers a specific exercise over its warm-up', () => {
  assert.equal(findPlanArt(plans.find(p => p.id === 'bodyweight-basics')).slug, 'bodyweight-squat');
  assert.equal(findPlanArt(plans.find(p => p.id === 'lower-body')).slug, 'goblet-squat');
  assert.equal(findPlanArt({ exercises: ['Easy walk · 20 minutes'] }).slug, 'walk');
  assert.equal(findPlanArt({ exercises: [] }), null);
  assert.equal(findPlanArt(undefined), null);
});

test('Every built-in workout card shows a photograph rather than a drawing', () => {
  const drawn = plans.filter(plan => !findPlanArt(plan)?.photo?.length).map(plan => plan.title);
  assert.deepEqual(drawn, []);
});

test('A card falls back to a photograph of the category, not a drawing', () => {
  // Nothing in this routine is covered by the photo set.
  const marching = { category: 'Cardio', exercises: ['Easy march · 3 minutes', 'Side steps · 3 minutes'] };
  const art = findPlanArt(marching);
  assert.ok(art.photo?.length, 'a stand-in photograph is used');
  assert.equal(art.standIn, true, 'and it is flagged so the caption does not name the wrong exercise');
  // A routine that does contain a photographed exercise uses that one instead.
  const yoga = findPlanArt(plans.find(p => p.id === 'yoga-flow'));
  assert.equal(yoga.slug, 'cat-cow');
  assert.ok(!yoga.standIn);
  // An unknown category has no stand-in, so the drawing is still better than nothing.
  assert.equal(findPlanArt({ category: 'Nonsense', exercises: ['Bird dog · 2 × 8'] }).slug, 'bird-dog');
});

test('Exercises with a demonstration photograph point at real dataset frames', () => {
  const withPhoto = Object.entries(exerciseArt).filter(([, art]) => art.photo);
  assert.ok(withPhoto.length >= 44, `only ${withPhoto.length} exercises carry a photograph`);
  for (const [slug, art] of withPhoto) {
    assert.ok(Array.isArray(art.photo) && art.photo.length, `${slug} has an empty photo list`);
    for (const frame of art.photo) assert.match(frame, /^[A-Za-z0-9_\-.,()]+\/\d+\.jpg$/, `${slug}: ${frame}`);
    assert.equal(mainPhoto(art), art.photo[art.photo.length - 1]);
    assert.ok(exercisePhotoUrl(art.photo[0]).startsWith('https://'), `${slug} photo URL is not absolute`);
  }
});

test('Exercises without a photograph report no frame, so the UI can show a tile instead', () => {
  const uncovered = Object.entries(exerciseArt).filter(([, art]) => !art.photo);
  assert.ok(uncovered.length > 0, 'some exercises are still uncovered by the photo set');
  for (const [slug, art] of uncovered) {
    assert.equal(mainPhoto(art), null, `${slug} should have no photo frame`);
    assert.ok(art.cues.length >= 3, `${slug} still explains itself in words`);
  }
  // The drawings remain on disk and addressable, but nothing renders them now.
  assert.ok(exerciseArtUrl('plank').endsWith('plank.svg'));
});
