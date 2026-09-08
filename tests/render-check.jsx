import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import assert from 'node:assert/strict';
import { Overview, Workouts, Nutrition, ProgressPage, Profile, Settings } from '../src/features/tracker/pages';
import { EntryForm, WorkoutSession } from '../src/features/tracker/components';
import { demoData, emptyData, plans, summarize } from '../src/features/tracker/data';
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
