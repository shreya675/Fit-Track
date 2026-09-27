import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import assert from 'node:assert/strict';
import { Overview, Workouts, Nutrition, ProgressPage, Profile, Settings } from '../src/features/tracker/pages';
import MealEditor from '../src/features/tracker/MealEditor';
import { SavedMeals, CopyMealsForm } from '../src/features/tracker/MealTools';
import { EntryForm, WorkoutSession } from '../src/features/tracker/components';
import { demoData, emptyData, plans, summarize } from '../src/features/tracker/data';
import App from '../src/App';
import { AuthContext } from '../src/context/AuthContext';
import Welcome from '../src/pages/Welcome';
import ExerciseRecommendations from '../src/features/tracker/ExerciseRecommendations';
import ProfileSetup, { validateSetup } from '../src/features/tracker/ProfileSetup';
import { PlanPage, AssignRoutineForm } from '../src/features/tracker/WeeklyPlan';
import RestTimer from '../src/features/tracker/RestTimer';
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
  for (const Page of [Overview, Workouts, PlanPage, Nutrition, ProgressPage, Profile, Settings]) {
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
const planHtml = renderToString(<MemoryRouter><PlanPage tracker={{ data: demoData() }} stats={summarize(demoData())} setModal={() => {}} save={() => {}} busy={false} /></MemoryRouter>);
for (const text of ['This week', 'Consistency', 'Full body strength', 'Add workout', 'day streak', 'planned workouts done']) assert.ok(planHtml.includes(text), `Plan page shows ${text}`);
assert.ok(renderToString(<MemoryRouter><PlanPage tracker={{ data: emptyData() }} stats={summarize(emptyData())} setModal={() => {}} save={() => {}} busy={false} /></MemoryRouter>).includes('Plan your first workout'), 'Empty plan invites the first assignment');
const assignHtml = renderToString(<AssignRoutineForm data={demoData()} day="mon" label="Monday" onSubmit={() => {}} />);
assert.ok(assignHtml.includes('Add to Mondays') && assignHtml.includes('Already planned'), 'Assign form lists routines and marks the ones already planned');
assert.ok(renderToString(<MemoryRouter><Overview tracker={{ data: emptyData() }} stats={summarize(emptyData())} setModal={() => {}} save={() => {}} /></MemoryRouter>).includes('Build your plan'));
const settingsHtml = renderToString(<MemoryRouter><Settings tracker={{ data: emptyData() }} appearance={{ preference: 'system', theme: 'light', setPreference() {}, toggle() {} }} /></MemoryRouter>);
for (const text of ['Colour theme', 'aria-pressed="true"', 'Dark']) assert.ok(settingsHtml.includes(text), `Settings shows ${text}`);
const restHtml = renderToString(<RestTimer loggedSets={0} />);
assert.ok(restHtml.includes('Start rest') && restHtml.includes('01:30'), 'Rest timer idles at the default length');
assert.ok(renderToString(<WorkoutSession plan={plans[1]} />).includes('Start after each set'), 'Session shows the rest timer');
const mealNew = renderToString(<MealEditor onSubmit={() => {}} recent={[{ id: 'r1', name: 'Poha and chai', type: 'Breakfast', calories: 320, date: '2026-09-15', servings: 1 }]} />);
for (const text of ['What did you eat?', 'Poha and chai', 'Servings eaten', 'auto']) assert.ok(mealNew.includes(text), `New meal editor shows ${text}`);
const mealEditing = renderToString(<MealEditor initial={{ id: 'm1', name: '2 roti, dal', calories: 430, protein: 20, carbs: 55, fat: 12, type: 'Lunch', date: '2026-09-10', ingredientMatches: [{ foodId: 'roti', quantity: 2, unit: 'piece' }, { foodId: 'dal', quantity: 1, unit: 'katori' }] }} onSubmit={() => {}} />);
for (const text of ['value="430"', 'Understood as 2 items', 'Save changes']) assert.ok(mealEditing.includes(text), `Editing meal shows ${text}`);
assert.ok(!mealEditing.includes('· auto'), 'Existing values are not overwritten by the estimate');
const nutritionHtml = renderToString(<MemoryRouter><Nutrition tracker={{ data: demoData() }} stats={summarize(demoData())} setModal={() => {}} /></MemoryRouter>);
for (const text of ['This week’s intake', 'kcal target', 'of ', 'Protein', 'Nothing logged yet']) assert.ok(nutritionHtml.includes(text), `Nutrition page shows ${text}`);
assert.ok(renderToString(<MemoryRouter><Profile tracker={{ data: emptyData() }} save={() => {}} /></MemoryRouter>).includes('Macro targets'));
console.log('Passed: all seven pages with sample and empty data, four entry forms, workout session, plan page, assign form, theme settings and rest timer render.');

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

const editedMeal = renderToString(<MealEditor initial={{ id: 'meal', name: 'Lunch', servings: 2, calories: 500, protein: 30, carbs: 50, fat: 10 }} />);
for (const value of ['value="500"', 'value="30"', 'value="2"', 'Save changes', 'Ingredients for one serving']) assert.ok(editedMeal.includes(value));
const recipeEditor = renderToString(<MealEditor recipe initial={{ name: 'Rice bowl', calories: 400 }} />);
assert.ok(recipeEditor.includes('Save recipe'));
assert.ok(!recipeEditor.includes('Servings eaten'));
const savedRecipes = renderToString(<SavedMeals tracker={{ data: { savedMeals: [{ id: 'r', name: 'Rice bowl', calories: 400, type: 'Lunch' }] } }} date="2026-09-14" />);
assert.ok(savedRecipes.includes('Log servings'));
assert.ok(savedRecipes.includes('Edit recipe Rice bowl'));
assert.ok(savedRecipes.includes('Delete recipe Rice bowl'));
const copyForm = renderToString(<CopyMealsForm destination="2026-09-14" meals={[{ id: 'm', date: '2026-09-13', name: 'Breakfast oats', calories: 300 }]} />);
assert.ok(copyForm.includes('Breakfast oats'));
assert.ok(copyForm.includes('Select all'));
assert.ok(copyForm.includes('Copy to date'));
console.log('Passed: meal editor serving totals, recipe controls, and copy-meals selection.');
