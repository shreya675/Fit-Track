// Match workout plan wording to exercise artwork.
import { exerciseArt, aliases } from './exerciseArtData.js';

export { exerciseArt };

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const byName = new Map(Object.entries(exerciseArt).map(([slug, art]) => [normalize(art.name), slug]));
// longest names first
const searchable = [...byName.keys(), ...Object.keys(aliases)].sort((a, b) => b.length - a.length);
const slugFor = name => byName.get(name) || aliases[name];
const contains = (label, name) =>
  label === name || label.startsWith(`${name} `) || label.endsWith(` ${name}`) || label.includes(` ${name} `);

export function findExerciseArt(value) {
  const raw = value && typeof value === 'object' ? value.name : value;
  const label = normalize(String(raw || '').split('·')[0]);
  if (!label) return null;
  const slug = slugFor(label) || slugFor(searchable.find(name => contains(label, name)));
  return slug && exerciseArt[slug] ? { slug, ...exerciseArt[slug] } : null;
}

// generic warm-up moves rank lowest
const filler = ['jog', 'cycling', 'walk', 'march-in-place', 'shoulder-circles', 'arm-circles',
  'ankle-circles', 'warm-up', 'gentle-stretches', 'cool-down', 'reclined-rest'];
const generic = new Set(filler);
// fallback photo per category
const representative = { Strength: 'bodyweight-squat', Cardio: 'walk', Mobility: 'cat-cow' };

// best artwork for a whole workout
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

// photos served from jsDelivr
export const PHOTO_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';
export const exercisePhotoUrl = frame => `${PHOTO_BASE}${frame}`;

export const mainPhoto = art => (art?.photo?.length ? art.photo[art.photo.length - 1] : null);
