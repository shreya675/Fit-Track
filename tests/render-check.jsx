import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import assert from 'node:assert/strict';
import { Overview, Workouts, Nutrition, ProgressPage, Profile, Settings } from '../src/features/tracker/pages';
import { EntryForm, WorkoutSession } from '../src/features/tracker/components';
import { demoData, emptyData, plans, summarize } from '../src/features/tracker/data';
import App from '../src/App';
import { AuthContext } from '../src/context/AuthContext';
import Welcome from '../src/pages/Welcome';

function renderEntry(path, demoActive, currentUser = null) {
  globalThis.sessionStorage = { getItem: () => demoActive ? 'true' : null };
  return renderToString(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={{ currentUser, loading: false, logout() {} }}><App /></AuthContext.Provider></MemoryRouter>);
}
for (const path of ['/', '/dashboard', '/workouts', '/login']) {
  const html = renderEntry(path, false);
  assert.ok(html.includes('Sign in with Google'), `${path}: fresh visit offers sign-in`);
  assert.ok(html.includes('Explore demo'), `${path}: fresh visit offers demo`);
  assert.ok(!html.includes('Sample workspace'), `${path}: sample profile is gated`);
}
assert.ok(renderEntry('/dashboard', true).includes('Sample workspace'), 'Demo selection opens sample workspace');
assert.ok(renderEntry('/login', true).includes('Explore demo'), 'Login URL returns to welcome even after exploring');
assert.ok(!renderEntry('/dashboard', true, { uid: 'test-user' }).includes('Sample workspace'), 'Signed-in account takes precedence over demo selection');
assert.ok(renderToString(<Welcome onExploreDemo={() => {}} authError="Test sign-in failure" />).includes('role="alert"'), 'Sign-in errors are visible');
delete globalThis.sessionStorage;
for (const data of [demoData(), emptyData()]) {
  const props = { tracker: { data }, stats: summarize(data), setModal() {}, save() {}, busy: false, exportData() {} };
  for (const Page of [Overview, Workouts, Nutrition, ProgressPage, Profile, Settings]) {
    const html = renderToString(<MemoryRouter><Page {...props} /></MemoryRouter>);
    assert.ok(html.length > 100, `${Page.name} rendered`);
    assert.ok(!html.includes('NaN'), `${Page.name} has valid numeric output`);
  }
}
for (const type of ['meal', 'steps', 'custom', 'workout']) {
  const html = renderToString(<EntryForm type={type} onSubmit={() => {}} />);
  assert.ok(html.includes('<form'), `${type} form rendered`);
}
assert.ok(renderToString(<WorkoutSession plan={plans[0]} />).includes('Start session'));
console.log('Passed: all six pages with sample and empty data, four entry forms, and workout session render.');
