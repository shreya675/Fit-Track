// Maps the wording used in workout plans onto the illustrations in
// public/images/exercises. Kept free of React so it can be unit tested.
import { exerciseArt, aliases } from './exerciseArtData.js';

export { exerciseArt };

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const byName = new Map(Object.entries(exerciseArt).map(([slug, art]) => [normalize(art.name), slug]));
// Longest names first, so "standing calf raise" wins over "calf raise" inside a longer label.
const searchable = [...byName.keys(), ...Object.keys(aliases)].sort((a, b) => b.length - a.length);
const slugFor = name => byName.get(name) || aliases[name];
const contains = (label, name) =>
  label === name || label.startsWith(`${name} `) || label.endsWith(` ${name}`) || label.includes(` ${name} `);

/** Find the illustration for an exercise line such as "Bodyweight squat · 2 × 10". */
export function findExerciseArt(value) {
  const raw = value && typeof value === 'object' ? value.name : value;
  const label = normalize(String(raw || '').split('·')[0]);
  if (!label) return null;
  const slug = slugFor(label) || slugFor(searchable.find(name => contains(label, name)));
  return slug && exerciseArt[slug] ? { slug, ...exerciseArt[slug] } : null;
}

// Warm-ups, walks and joint circles open most routines, so they only represent one
// on a card when there is nothing more specific. Ranked so that a run is shown
// running rather than walking through its warm-up.
const filler = ['jog', 'cycling', 'walk', 'march-in-place', 'shoulder-circles', 'arm-circles',
  'ankle-circles', 'warm-up', 'gentle-stretches', 'cool-down', 'reclined-rest'];
const generic = new Set(filler);
// A stand-in for workouts built entirely from exercises the photo set does not cover,
// so a card shows a photograph of the kind of work it is rather than a line drawing.
const representative = { Strength: 'bodyweight-squat', Cardio: 'walk', Mobility: 'cat-cow' };

/**
 * The artwork that best represents a whole workout: a photographed exercise from
 * the routine where there is one, then a photograph standing in for the category,
 * and only then a drawing.
 */
export function findPlanArt(plan) {
  const list = Array.isArray(plan?.exercises) ? plan.exercises : String(plan?.exercises || '').split('\n');
  const matches = list.map(findExerciseArt).filter(Boolean);
  const specific = art => !generic.has(art.slug);
  const photographed = matches.filter(art => art.photo?.length);
  const bestFiller = photographed.slice().sort((a, b) => filler.indexOf(a.slug) - filler.indexOf(b.slug))[0];
  const stand_in = exerciseArt[representative[plan?.category]];
  return photographed.find(specific) || bestFiller
    || (stand_in ? { slug: representative[plan.category], ...stand_in, standIn: true } : null)
    || matches.find(specific) || matches[0] || null;
}

export const exerciseArtUrl = slug => `${import.meta.env?.BASE_URL ?? '/'}images/exercises/${slug}.svg`;

// Demonstration photographs are served from jsDelivr rather than bundled, so the
// repository stays small. Point this at a local folder to serve them yourself.
export const PHOTO_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';
export const exercisePhotoUrl = frame => `${PHOTO_BASE}${frame}`;

/** The frame that best identifies an exercise: the finishing position. */
export const mainPhoto = art => (art?.photo?.length ? art.photo[art.photo.length - 1] : null);
