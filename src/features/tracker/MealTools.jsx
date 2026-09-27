import { useState } from 'react';
import dayjs from 'dayjs';
import { copyMeal, perServing } from './mealNutrition';
import { today } from './data';
import './mealTools.css';

export function SavedMeals({ tracker, setModal, date }) {
  const recipes = tracker.data.savedMeals || [];
  const unavailable = tracker.loadErrors?.savedMeals;
  return <section className="panel saved-meals"><div className="panel-title"><h2>Saved meals & recipes</h2><button className="button secondary" disabled={Boolean(unavailable)} onClick={() => setModal({ type: 'recipe' })}>Create recipe</button></div>
    <p className="muted">Save nutrition for one serving, then choose how much you eat when logging it.</p>
    {unavailable ? <div className="error-banner" role="alert"><p>{unavailable}</p><button type="button" className="button secondary" onClick={tracker.retryLoad}>Retry loading recipes</button></div> : recipes.length ? <div className="saved-meal-grid">{recipes.map(recipe => <article key={recipe.id}><h3>{recipe.name}</h3><p>{perServing(recipe).calories ?? '—'} kcal per serving · {recipe.type}</p><div className="entry-actions"><button className="button secondary" onClick={() => setModal({ type: 'meal', initial: copyMeal(recipe, date) })}>Log servings</button><button className="text-link" aria-label={`Edit recipe ${recipe.name}`} onClick={() => setModal({ type: 'recipe', initial: recipe })}>Edit</button><button className="text-link" aria-label={`Delete recipe ${recipe.name}`} onClick={() => setModal({ type: 'delete', key: 'savedMeals', id: recipe.id, name: recipe.name })}>Delete</button></div></article>)}</div> : <p className="meal-empty">No saved meals yet. Create a recipe or save a meal from your diary.</p>}
  </section>;
}

export function CopyMealsForm({ meals, destination, busy, onSubmit }) {
  const [from, setFrom] = useState(dayjs(destination).subtract(1, 'day').format('YYYY-MM-DD'));
  const [date, setDate] = useState(destination);
  const [selected, setSelected] = useState([]);
  const available = meals.filter(meal => meal.date === from);
  const records = available.filter(meal => selected.includes(meal.id));
  return <form className="entry-form" onSubmit={e => { e.preventDefault(); if (records.length && from !== date) onSubmit(records.map(meal => copyMeal(meal, date))); }}>
    <div className="form-grid"><label className="field"><span>Copy from date</span><input type="date" required max={today()} value={from} onChange={e => { setFrom(e.target.value); setSelected([]); }} /></label><label className="field"><span>Copy to date</span><input type="date" required max={today()} value={date} onChange={e => setDate(e.target.value)} /></label></div>
    {available.length ? <><button type="button" className="text-link" onClick={() => setSelected(selected.length === available.length ? [] : available.map(meal => meal.id))}>{selected.length === available.length ? 'Deselect all' : 'Select all'}</button><div className="copy-meal-list">{available.map(meal => <label key={meal.id}><input type="checkbox" checked={selected.includes(meal.id)} onChange={e => setSelected(current => e.target.checked ? [...current, meal.id] : current.filter(id => id !== meal.id))} /><span><strong>{meal.name}</strong><small>{meal.type} · {meal.calories} kcal · {meal.servings || 1} serving(s)</small></span></label>)}</div></> : <p className="meal-empty">No meals logged on that date.</p>}
    <p className="fine-print">Creates new entries with the original portions and nutrition. Existing entries on the destination date are kept.</p>
    {from === date && <p role="alert">Choose two different dates.</p>}
    <button type="submit" className="button primary" disabled={busy || !records.length || from === date}>{busy ? 'Copying…' : `Copy ${records.length} meal(s)`}</button>
  </form>;
}
