import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, History, RotateCcw, Sparkles, X } from 'lucide-react';
import { copyMeal, foodCatalog, nutrients, parseMeal, perServing, repriceItem, scaleNutrition, totalsFor, unitsFor } from './mealNutrition';
import { today } from './data';
import './mealTools.css';

const labels = { calories: 'Calories (kcal)', protein: 'Protein (g)', carbs: 'Carbs (g)', fat: 'Fat (g)' };
const sortedCatalog = [...foodCatalog].sort((a, b) => a.name.localeCompare(b.name));

// Meal / recipe form with live nutrition estimate from the description.
export default function MealEditor({ initial = {}, recipe = false, busy, onSubmit, recent = [] }) {
  const editing = Boolean(initial.id);
  const [name, setName] = useState(initial.name || '');
  const [type, setType] = useState(initial.type || 'Breakfast');
  const [date, setDate] = useState(initial.date || today());
  const [servings, setServings] = useState(recipe ? 1 : initial.servings || 1);
  const [base, setBase] = useState(() => perServing(initial));
  // fields that auto-fill from the estimate
  const [following, setFollowing] = useState(() => Object.fromEntries(nutrients.map(key => [key, !editing && initial.calories == null])));
  const [items, setItems] = useState(() => (initial.ingredientMatches || []).filter(item => item.foodId).map(item => repriceItem({ foodId: item.foodId, unit: item.unit, quantity: item.quantity }, {})).filter(item => item?.grams));
  const [unmatched, setUnmatched] = useState([]);
  const [parsedText, setParsedText] = useState(editing ? initial.name || '' : '');
  const [manualItems, setManualItems] = useState(false);
  const [source, setSource] = useState(initial.nutritionSource || 'Manually entered');
  const timer = useRef(null);
  const anyFollowing = nutrients.some(key => following[key]);
  const count = recipe ? 1 : Number(servings) > 0 ? Number(servings) : 1;

  // debounce parse
  useEffect(() => {
    if (manualItems || name.trim() === parsedText) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const result = parseMeal(name);
      setItems(result.items); setUnmatched(result.unmatched); setParsedText(name.trim());
    }, 300);
    return () => clearTimeout(timer.current);
  }, [name, parsedText, manualItems]);

  const estimate = useMemo(() => totalsFor(items), [items]);
  useEffect(() => {
    if (!anyFollowing) return;
    setBase(current => {
      const next = { ...current };
      for (const key of nutrients) if (following[key]) next[key] = estimate ? estimate[key] / count : null;
      return next;
    });
    if (estimate) setSource(nutrients.every(key => following[key]) ? 'Estimated from your description' : 'User-adjusted estimate');
  }, [estimate, following, anyFollowing, count]);

  const totals = scaleNutrition(base, count);
  function editItem(index, change) {
    setManualItems(true);
    setItems(current => current.map((item, i) => (i === index ? repriceItem(item, change) : item)));
    setSource(anyFollowing ? 'User-adjusted estimate' : source);
  }
  function removeItem(index) { setManualItems(true); setItems(current => current.filter((_, i) => i !== index)); }
  function reestimate() {
    setManualItems(false); setParsedText('');
    setFollowing(Object.fromEntries(nutrients.map(key => [key, true])));
  }
  function applyRecent(meal) {
    const copy = copyMeal(meal, date);
    setName(copy.name); setType(copy.type); setParsedText(copy.name.trim()); setManualItems(true);
    setItems((copy.ingredientMatches || []).filter(item => item.foodId).map(item => repriceItem({ foodId: item.foodId, unit: item.unit, quantity: item.quantity }, {})).filter(item => item?.grams));
    setUnmatched([]);
    if (!recipe) setServings(copy.servings);
    setBase(perServing(copy));
    setFollowing(Object.fromEntries(nutrients.map(key => [key, false])));
    setSource(copy.nutritionSource || 'From a recent meal');
  }
  function submit(event) {
    event.preventDefault();
    if (!count || !Number.isFinite(count)) return;
    if (totals.calories == null) return;
    onSubmit({ name: name.trim(), type, ...(recipe ? {} : { date }), servings: count, perServing: base, ...totals,
      ingredientsText: name.trim(),
      ingredientMatches: items.map(item => ({ name: item.name, grams: item.grams, quantity: item.quantity, unit: item.unit, foodId: item.foodId, ...(item.fdcId ? { fdcId: item.fdcId } : {}), source: item.source })),
      nutritionSource: items.length ? source : 'Manually entered' });
  }

  return <form className="entry-form meal-editor" onSubmit={submit}>
    <label className="field"><span>{recipe ? 'Recipe name or ingredients for one serving' : 'What did you eat?'}</span>
      <input required maxLength={200} autoFocus={!editing} placeholder={recipe ? 'e.g. 2 roti, 1 katori dal, salad' : 'e.g. 2 roti, 1 katori dal, half cup rice'} value={name} onChange={event => setName(event.target.value)} />
      <small className="field-note">Quantities and measures like cup, katori, glass, tbsp or grams are understood. Nutrition is calculated as you type.</small>
    </label>
    {!editing && recent.length > 0 && <div className="recent-meals" aria-label="Recent meals"><History size={14} />{recent.map(meal => <button type="button" key={meal.id || meal.name} className="recent-chip" onClick={() => applyRecent(meal)} title={`${meal.calories} kcal`}>{meal.name}</button>)}</div>}
    <div className="form-grid"><label className="field"><span>Meal</span><select value={type} onChange={event => setType(event.target.value)}>{['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(item => <option key={item}>{item}</option>)}</select></label>
      {!recipe && <><label className="field"><span>Date</span><input required type="date" max={today()} value={date} onChange={event => setDate(event.target.value)} /></label><label className="field"><span>Servings eaten</span><input required type="number" min="0.1" max="100" step="0.1" value={servings} onChange={event => setServings(event.target.value)} /></label></>}
    </div>

    {(items.length > 0 || unmatched.length > 0) && <div className="estimate-list" aria-live="polite">
      <div className="estimate-heading"><Sparkles size={14} /><strong>{items.length ? `Understood as ${items.length} ${items.length === 1 ? 'item' : 'items'}` : 'Nothing recognised yet'}</strong>{estimate && <span>{Math.round(estimate.calories)} kcal · {Math.round(estimate.protein)} g protein · {Math.round(estimate.carbs)} g carbs · {Math.round(estimate.fat)} g fat</span>}</div>
      <ul>{items.map((item, index) => <li key={`${item.foodId}-${index}`} className={item.confidence < 0.7 ? 'uncertain' : ''}>
        <input type="number" min="0.1" step="0.5" aria-label={`Quantity of ${item.name}`} value={item.quantity} onChange={event => editItem(index, { quantity: event.target.value })} />
        <select aria-label={`Measure for ${item.name}`} value={item.unit} onChange={event => editItem(index, { unit: event.target.value })}>{[...new Set([...unitsFor(item.food), item.unit])].map(unit => <option key={unit} value={unit}>{unit}</option>)}</select>
        <select aria-label={`Food matched for “${item.text}”`} value={item.foodId} onChange={event => editItem(index, { foodId: event.target.value })}>{sortedCatalog.map(food => <option key={food.id} value={food.id}>{food.name}</option>)}</select>
        <span className="estimate-grams">{item.grams} g · {Math.round(item.nutrition.calories)} kcal{item.confidence < 0.7 && <em title="Best guess, check the food"> · guess</em>}</span>
        <button type="button" className="icon-button" aria-label={`Remove ${item.name}`} onClick={() => removeItem(index)}><X size={14} /></button>
      </li>)}</ul>
      {unmatched.map(item => <p key={item.text} className="estimate-unmatched"><AlertCircle size={13} />“{item.text}”: {item.reason} Not counted in the total. Enter the values below or rephrase it.</p>)}
      <div className="estimate-actions">
        {(manualItems || !anyFollowing) && <button type="button" className="text-link" onClick={reestimate}><RotateCcw size={13} />Re-estimate from the description</button>}
        <details><summary>Foods it knows ({foodCatalog.length})</summary><ul className="supported-foods">{sortedCatalog.map(food => <li key={food.id}>{food.name} <small>({food.aliases.slice(0, 3).join(', ')})</small></li>)}</ul></details>
      </div>
    </div>}
    {editing && !items.length && !anyFollowing && <button type="button" className="text-link" onClick={reestimate}><Sparkles size={13} />Estimate nutrition from the description</button>}

    <p className="fine-print">{recipe ? 'Nutrition for one serving of this recipe.' : `Nutrition for ${count} serving${count === 1 ? '' : 's'}.`} {anyFollowing ? 'Fields follow the estimate until you type in them.' : 'Values are yours; use re-estimate to fill them from the description.'}</p>
    <div className="form-grid nutrient-grid">{nutrients.map(key => <label className={`field ${following[key] ? 'following' : ''}`} key={key}><span>{labels[key]}{following[key] && <em> · auto</em>}</span>
      <input type="number" step="0.1" min="0" max={key === 'calories' ? 15000 : 2000} required={key === 'calories'} value={totals[key] == null ? '' : totals[key]}
        onChange={event => { setFollowing(current => ({ ...current, [key]: false })); setBase(current => ({ ...current, [key]: event.target.value === '' ? null : Number(event.target.value) / count })); setSource(items.length ? 'User-adjusted estimate' : 'Manually entered'); }} /></label>)}</div>
    <p className="fine-print">{items.length ? source : 'Manually entered'}. Portions, brands and cooking oil change the numbers; an estimate is not a measurement.</p>
    <div className="modal-actions"><button className="button primary" disabled={busy || !name.trim() || totals.calories == null} type="submit">{busy ? 'Saving…' : editing ? 'Save changes' : recipe ? 'Save recipe' : 'Save meal'}</button></div>
  </form>;
}
