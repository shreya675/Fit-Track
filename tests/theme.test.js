import test from 'node:test';
import assert from 'node:assert/strict';
import { THEME_KEY, readPreference, resolveTheme, toggledPreference, writePreference } from '../src/features/tracker/theme.js';

test('System preference follows the operating system; explicit choices do not', () => {
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('The quick toggle flips what is on screen and becomes an explicit choice', () => {
  assert.equal(toggledPreference('system', true), 'light');
  assert.equal(toggledPreference('system', false), 'dark');
  assert.equal(toggledPreference('dark', false), 'light');
});

test('Preferences are stored only when explicit and unknown values fall back to system', () => {
  const store = new Map();
  const storage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
  assert.equal(readPreference(storage), 'system');
  writePreference(storage, 'dark');
  assert.equal(store.get(THEME_KEY), 'dark');
  assert.equal(readPreference(storage), 'dark');
  writePreference(storage, 'system');
  assert.equal(store.has(THEME_KEY), false);
  store.set(THEME_KEY, 'purple');
  assert.equal(readPreference(storage), 'system');
  assert.equal(readPreference(null), 'system');
  assert.equal(writePreference({ setItem() { throw new Error('blocked'); } }, 'light'), false);
});
