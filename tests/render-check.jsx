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
import ExerciseRecommendations from '../src/features/tracker/ExerciseRecommendations';
import ProfileSetup, { validateSetup } from '../src/features/tracker/ProfileSetup';
import { signInErrorMessage } from '../src/features/tracker/authErrors';

const setupHtml = renderToString(<ProfileSetup profile={{ name: 'Sam' }} />);
for (const label of ['Username', 'Height (cm)', 'Weight (kg)', 'Fitness focus', 'Current activity level', 'Save profile']) assert.ok(setupHtml.includes(label));
assert.ok(!renderToString(<ProfileSetup profile={{}} loading />).includes('<form'));
assert.equal(validateSetup({ name: 'Sam', height: '175', weight: '70', fitnessGoal: 'Build strength' }), '');
assert.ok(validateSetup({ name: ' ', height: '175', weight: '70', fitnessGoal: 'Build strength' }));
assert.ok(validateSetup({ name: 'Sam', height: 'NaN', weight: '70', fitnessGoal: 'Build strength' }));
assert.ok(validateSetup({ name: 'Sam', height: '175', weight: '0', fitnessGoal: 'Build strength' }));
assert.ok(signInErrorMessage({ code: 'auth/email-already-in-use' }).includes('Log in'));
assert.ok(signInErrorMessage({ code: 'auth/invalid-credential' }).includes('incorrect'));
const welcomeHtml = renderToString(<Welcome />);
assert.ok(welcomeHtml.includes('Create account'));
assert.ok(welcomeHtml.includes('Log in'));
assert.ok(welcomeHtml.includes('name="email"'));
assert.ok(welcomeHtml.includes('type="password"'));
assert.ok(renderToString(<Welcome currentUser={{ email: 'sam@example.com' }} />).includes('Log in to another account'));

const recommendationsHtml = renderToString(<MemoryRouter><ExerciseRecommendations tracker={{ data: demoData() }} setModal={() => {}} /></MemoryRouter>);
assert.equal((recommendationsHtml.match(/Log this exercise/g) || []).length, 3);
assert.ok(recommendationsHtml.includes('sample workout history'));
assert.ok(renderToString(<ExerciseRecommendations tracker={{ data: emptyData() }} />).includes('Log your first workout'));
assert.ok(!renderToString(<ExerciseRecommendations tracker={{ data: demoData(), loading: true }} />).includes('Log this exercise'));
assert.ok(!renderToString(<ExerciseRecommendations tracker={{ data: demoData(), loadErrors: { sessions: 'Unavailable' } }} />).includes('Log this exercise'));

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

const mealEdit = renderToString(<EntryForm type="meal" initial={{ id: 'meal', name: 'Rice bowl', calories: 430, protein: 20, carbs: 55, fat: 12, type: 'Lunch', date: '2026-09-10' }} />);
for (const value of ['Rice bowl', '430', '20', '55', '12', 'Save changes']) assert.ok(mealEdit.includes(value));
const workoutEdit = renderToString(<EntryForm type="workout" initial={{ id: 'session', title: 'Squats', calories: 123, entries: [{ slug: 'goblet-squat', name: 'Goblet squat', sets: [{ weight: 24, reps: 8 }] }] }} />);
for (const value of ['Recorded sets', 'Goblet squat', 'value="24"', 'value="8"', 'value="123"']) assert.ok(workoutEdit.includes(value));
const restored = renderToString(<WorkoutSession plan={plans[0]} draft={{ elapsed: 125, started: true, checked: [0], sets: { 0: [{ weight: 20, reps: 8 }] } }} />);
assert.ok(restored.replace(/<!--.*?-->/g, '').includes('02:05'));
assert.ok(restored.includes('Resume'));
const review = renderToString(<WorkoutSession plan={plans[0]} draft={{ elapsed: 125, started: true, finish: true, checked: [], sets: {}, review: { title: 'Edited draft', notes: 'Keep my notes', calories: 42 } }} />);
assert.ok(review.includes('Keep my notes'));
assert.ok(review.includes('Edited draft'));
assert.ok(review.includes('value="42"'));
const dataWithWeight = { ...emptyData(), measurements: [{ id: 'reading', date: '2026-09-10', weight: 72 }] };
const progressHtml = renderToString(<MemoryRouter><ProgressPage tracker={{ data: dataWithWeight }} stats={summarize(dataWithWeight)} /></MemoryRouter>);
assert.ok(progressHtml.includes('Edit weight on 2026-09-10'));
assert.ok(progressHtml.includes('Delete weight on 2026-09-10'));
console.log('Passed: edit forms, recorded sets, restored timer/review and weight-history controls.');
