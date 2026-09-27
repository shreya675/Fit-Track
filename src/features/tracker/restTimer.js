// Rest timer helpers.
import { isLoggedSet } from './progressStats.js';

export const REST_KEY = 'fittrack.rest-seconds';
export const DEFAULT_REST = 90;
export const MIN_REST = 15;
export const MAX_REST = 600;
export const REST_STEP = 15;

export function clampRest(seconds) {
  const value = seconds == null || seconds === '' ? NaN : Number(seconds);
  if (!Number.isFinite(value)) return DEFAULT_REST;
  return Math.min(MAX_REST, Math.max(MIN_REST, Math.round(value / REST_STEP) * REST_STEP));
}

export function readRestSeconds(storage) {
  try { return clampRest(storage?.getItem(REST_KEY) ?? DEFAULT_REST); } catch { return DEFAULT_REST; }
}

export function writeRestSeconds(storage, seconds) {
  try { storage.setItem(REST_KEY, String(clampRest(seconds))); } catch { /* ignore */ }
}

export function countLoggedSets(sets = {}) {
  return Object.values(sets).reduce((total, list) => total + (list || []).filter(isLoggedSet).length, 0);
}

export function startRest(seconds, now = Date.now()) {
  const total = clampRest(seconds);
  return { total, endsAt: now + total * 1000, startedAt: now };
}

export function restRemaining(rest, now = Date.now()) {
  if (!rest) return 0;
  return Math.max(0, Math.ceil((rest.endsAt - now) / 1000));
}

// adjust a running rest
export function adjustRest(rest, deltaSeconds, now = Date.now()) {
  if (!rest) return rest;
  const remaining = restRemaining(rest, now);
  const next = Math.min(MAX_REST, Math.max(0, remaining + deltaSeconds));
  return { ...rest, endsAt: now + next * 1000, total: Math.max(rest.total, next) };
}

export function restProgress(rest, now = Date.now()) {
  if (!rest || !rest.total) return 0;
  return Math.min(1, Math.max(0, 1 - restRemaining(rest, now) / rest.total));
}

export function formatClock(seconds) {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
