// Estimating the energy cost of a session, so the calories field is not a guess.
//
// kcal/min = MET x 3.5 x bodyweight(kg) / 200, the standard metabolic equivalent
// formula. MET values follow the published Compendium of Physical Activities for
// moderate effort. Every figure here is an average across people and a session is
// not a laboratory, so treat the result as a rough guide, never a measurement.
import { findExerciseArt } from './exerciseArtMatch.js';
import { latestWeight } from './progressStats.js';

/** Metabolic equivalents at moderate effort, per exercise illustration slug. */
export const exerciseMet = {
 "ankle-circles": 2.0,
 "arm-circles": 2.8,
 "bench-press": 5.0,
 "biceps-curl": 3.5,
 "bird-dog": 3.5,
 "bodyweight-squat": 5.0,
 "burpee": 8.0,
 "calf-stretch": 2.3,
 "cat-cow": 2.3,
 "childs-pose": 2.0,
 "cool-down": 2.5,
 "cycling": 7.0,
 "dead-bug": 3.5,
 "dumbbell-deadlift": 5.0,
 "dumbbell-lunge": 5.0,
 "dumbbell-row": 5.0,
 "dumbbell-sumo-squat": 5.0,
 "floor-press": 5.0,
 "forward-lunge": 4.5,
 "gentle-low-lunge": 2.3,
 "gentle-stretches": 2.3,
 "glute-bridge": 3.5,
 "goblet-squat": 5.0,
 "hammer-curl": 3.5,
 "hamstring-stretch": 2.3,
 "heel-digs": 3.5,
 "heel-tap": 3.8,
 "high-knees": 8.0,
 "hip-mobility": 2.5,
 "hollow-hold": 4.0,
 "incline-push-up": 3.8,
 "jog": 7.0,
 "jumping-jacks": 8.0,
 "knee-push-up": 5.0,
 "lateral-raise": 3.5,
 "march-in-place": 3.5,
 "mountain-climber": 8.0,
 "pike-push-up": 8.0,
 "plank": 3.8,
 "push-up": 8.0,
 "reclined-rest": 1.0,
 "reverse-crunch": 3.8,
 "reverse-fly": 3.5,
 "reverse-lunge": 4.5,
 "romanian-deadlift": 5.0,
 "scapular-push-up": 3.5,
 "seated-breathing": 1.3,
 "seated-forward-fold": 2.3,
 "seated-torso-turns": 2.3,
 "shoulder-circles": 2.3,
 "shoulder-press": 5.0,
 "side-lunge": 4.5,
 "side-plank": 3.8,
 "side-steps": 4.0,
 "skater-hops": 7.0,
 "split-squat": 5.0,
 "standing-calf-raise": 3.5,
 "standing-knee-lift": 3.5,
 "standing-side-reaches": 2.3,
 "step-touch": 4.0,
 "thoracic-rotation": 2.3,
 "triceps-extension": 3.5,
 "walk": 3.5,
 "wall-push-up": 3.5,
 "wall-sit": 4.0,
 "warm-up": 3.0,
 "weighted-calf-raise": 3.5
};

/** Used when nothing in a session matches a known exercise. */
export const categoryMet = { Strength: 3.8, Cardio: 6.0, Mobility: 2.5 };
const DEFAULT_MET = 3.5;

/** The average cost of the exercises actually done, falling back to the category. */
export function metFor({ exercises = [], category } = {}) {
  const values = (Array.isArray(exercises) ? exercises : [])
    .map(entry => findExerciseArt(entry)?.slug)
    .filter(Boolean)
    .map(slug => exerciseMet[slug])
    .filter(value => Number.isFinite(value));
  if (values.length) return values.reduce((total, value) => total + value, 0) / values.length;
  return categoryMet[category] ?? DEFAULT_MET;
}

/** The weight to calculate with: a logged reading first, then the profile figure. */
export function bodyWeight(data) {
  const logged = latestWeight(data?.measurements);
  if (logged) return { weight: logged.weight, source: 'log', date: logged.date };
  const profile = Number(data?.profile?.weight);
  if (Number.isFinite(profile) && profile > 0) return { weight: profile, source: 'profile' };
  return null;
}

/** Rounded kilocalories, or null when there is not enough to work from. */
export function estimateCalories({ minutes, weightKg, exercises, category } = {}) {
  const duration = Number(minutes), weight = Number(weightKg);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 1440) return null;
  if (!Number.isFinite(weight) || weight < 20 || weight > 400) return null;
  return Math.round(metFor({ exercises, category }) * 3.5 * weight / 200 * duration);
}
