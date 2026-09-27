import foods from './foodCatalog.js';

export const nutrients = ['calories', 'protein', 'carbs', 'fat'];
export const foodCatalog = foods;
const round = value => Math.round(value * 10) / 10;

export function perServing(meal) {
  if (meal.perServing) return { ...meal.perServing };
  const count = Number(meal.servings) > 0 ? Number(meal.servings) : 1;
  return Object.fromEntries(nutrients.map(key => [key, meal[key] == null || meal[key] === '' ? null : Number(meal[key]) / count]));
}

export function scaleNutrition(base, servings) {
  if (!Number.isFinite(Number(servings)) || Number(servings) <= 0) throw new Error('Enter a serving count greater than zero.');
  return Object.fromEntries(nutrients.map(key => [key, base[key] == null || base[key] === '' ? null : round(Number(base[key]) * Number(servings))]));
}

// Copies contain nutrition snapshots, never the original record ID or timestamps.
export function copyMeal(meal, date) {
  const servings = Number(meal.servings) > 0 ? Number(meal.servings) : 1;
  const base = perServing(meal);
  return { name: meal.name, type: meal.type || 'Snack', date, servings, perServing: base,
    ...scaleNutrition(base, servings), ingredientsText: meal.ingredientsText || '',
    nutritionSource: meal.nutritionSource || 'Manually entered', ingredientMatches: meal.ingredientMatches || [] };
}

export function recipeFromMeal(meal) {
  return { ...copyMeal(meal, ''), servings: 1, ...scaleNutrition(perServing(meal), 1) };
}

// ---------------------------------------------------------------------------------------------
// Free-text meal parsing: "2 roti, 1 katori dal and half cup rice" -> matched foods with gram weights.
// ---------------------------------------------------------------------------------------------

/** Grams per unit when the food itself does not say. Liquids use the larger cup. */
const GENERIC_UNITS = { g: 1, kg: 1000, ml: 1, l: 1000, cup: 150, katori: 150, bowl: 200, glass: 250, tbsp: 15, tsp: 5, slice: 30, handful: 28, plate: 250, scoop: 30, serving: 100, piece: null, small: null, medium: null, large: null, pack: null, can: 330, bottle: 500, bar: null, cube: 15, half: null, pint: 570, fillet: 150, leg: 120, block: 300, sachet: 10, spoon: 5, square: 6 };
const UNIT_ALIASES = {
  g: ['g', 'gm', 'gms', 'gram', 'grams', 'grm'], kg: ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms'],
  ml: ['ml', 'mls', 'millilitre', 'millilitres', 'milliliter', 'milliliters'], l: ['l', 'litre', 'litres', 'liter', 'liters', 'ltr'],
  cup: ['cup', 'cups', 'c'], katori: ['katori', 'katoris', 'katora', 'vati', 'wati'], bowl: ['bowl', 'bowls'], glass: ['glass', 'glasses'],
  tbsp: ['tbsp', 'tbsps', 'tablespoon', 'tablespoons', 'tbs', 'tblsp'], tsp: ['tsp', 'tsps', 'teaspoon', 'teaspoons'], spoon: ['spoon', 'spoons'],
  piece: ['piece', 'pieces', 'pc', 'pcs', 'no', 'nos', 'number', 'numbers', 'unit', 'units', 'whole', 'x'], slice: ['slice', 'slices'],
  handful: ['handful', 'handfuls', 'fistful'], plate: ['plate', 'plates', 'full plate'], scoop: ['scoop', 'scoops'], serving: ['serving', 'servings', 'portion', 'portions', 'helping'],
  small: ['small', 'sm', 'mini'], medium: ['medium', 'med', 'regular'], large: ['large', 'big', 'lg', 'jumbo'],
  pack: ['pack', 'packs', 'packet', 'packets', 'pkt'], can: ['can', 'cans', 'tin'], bottle: ['bottle', 'bottles'], bar: ['bar', 'bars'], cube: ['cube', 'cubes'],
  half: ['halves'], pint: ['pint', 'pints'], fillet: ['fillet', 'fillets'], leg: ['leg', 'legs', 'drumstick', 'drumsticks'], block: ['block'], sachet: ['sachet', 'sachets'], square: ['square', 'squares'],
};
const unitLookup = new Map();
for (const [unit, aliases] of Object.entries(UNIT_ALIASES)) for (const alias of aliases) unitLookup.set(alias, unit);
// Multi-word unit phrases are matched before single words.
const UNIT_PHRASES = [['full plate', 'plate'], ['half plate', 'half-plate']];

const NUMBER_WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, dozen: 12, half: 0.5, quarter: 0.25, couple: 2, few: 3, some: 1 };
const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
const FILLER = new Set(['of', 'the', 'with', 'and', 'some', 'my', 'plain', 'fresh', 'homemade', 'home', 'made', 'hot', 'cold', 'big', 'little', 'bit', 'piece', 'pieces']);

function normalise(text) {
  return String(text || '').toLowerCase().replace(/[½¼¾⅓⅔]/g, ch => ` ${FRACTIONS[ch]} `).replace(/[^a-z0-9./%\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}
function singular(word) {
  if (word.length <= 3) return word;
  if (/(ss|us|is)$/.test(word)) return word;
  if (/ies$/.test(word)) return word.slice(0, -3) + 'y';
  if (/(ches|shes|xes|oes)$/.test(word)) return word.slice(0, -2);
  if (/s$/.test(word)) return word.slice(0, -1);
  return word;
}
const canonical = phrase => phrase.split(' ').filter(word => word && !FILLER.has(word)).map(singular).join(' ');

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return rows[a.length][b.length];
}

/** Rank catalog foods for a food phrase. Exact alias, then alias contained in phrase (longest wins), then fuzzy. */
export function matchFood(phrase, catalog = foods) {
  const query = canonical(normalise(phrase));
  if (!query) return [];
  const scored = [];
  for (const food of catalog) {
    let best = 0;
    for (const raw of [food.name, ...food.aliases]) {
      const alias = canonical(normalise(raw));
      if (!alias) continue;
      let score = 0;
      if (alias === query) score = 1;
      else if (query.includes(alias) && (query === alias || query.split(' ').length <= alias.split(' ').length + 2)) score = 0.7 + Math.min(0.2, alias.length / 100);
      else if (alias.includes(query) && query.length >= 4) score = 0.55 + Math.min(0.1, query.length / 100);
      else {
        const tokens = query.split(' '), aliasTokens = alias.split(' ');
        const shared = tokens.filter(token => aliasTokens.some(other => other === token || (token.length >= 4 && editDistance(token, other) <= 1))).length;
        if (shared && shared === aliasTokens.length) score = 0.5 + 0.1 * (shared / tokens.length);
        else if (tokens.length === 1 && aliasTokens.length === 1 && query.length >= 4 && editDistance(query, alias) <= (query.length >= 7 ? 2 : 1)) score = 0.45;
        else if (shared) score = 0.25 + 0.15 * (shared / Math.max(tokens.length, aliasTokens.length));
      }
      if (score > best) best = score;
    }
    if (best >= 0.4) scored.push({ food, score: round(best * 100) / 100 });
  }
  return scored.sort((a, b) => b.score - a.score || a.food.name.length - b.food.name.length);
}

/** Grams for a quantity of a food in a unit; null when the unit makes no sense for that food. */
export function gramsFor(food, quantity, unit) {
  if (!food || !Number.isFinite(quantity) || quantity <= 0) return null;
  if (unit === 'half-plate') return gramsFor(food, quantity * 0.5, 'plate');
  let perUnit = food.units?.[unit];
  if (perUnit == null) {
    if (unit === 'half') perUnit = food.units?.[food.unit] != null ? food.units[food.unit] / 2 : null;
    else if (['small', 'medium', 'large'].includes(unit) && food.units?.piece != null) perUnit = food.units.piece * ({ small: 0.75, medium: 1, large: 1.4 })[unit];
    else if (unit === 'piece' && food.units?.[food.unit] != null && !['g', 'ml'].includes(food.unit)) perUnit = food.units[food.unit];
    else perUnit = GENERIC_UNITS[unit] ?? null;
  }
  return perUnit == null ? null : round(perUnit * quantity);
}

function parseQuantity(tokens) {
  // Returns [quantity, tokensConsumed]. Handles "2", "1.5", "1/2", "1 1/2", "0.5", "half", "a", "two".
  let quantity = null, used = 0;
  const first = tokens[0];
  if (first && /^\d+(\.\d+)?$/.test(first)) { quantity = Number(first); used = 1; const next = tokens[1]; if (next && /^\d+\/\d+$/.test(next)) { const [n, d] = next.split('/').map(Number); if (d) { quantity += n / d; used = 2; } } }
  else if (first && /^\d+\/\d+$/.test(first)) { const [n, d] = first.split('/').map(Number); if (d) { quantity = n / d; used = 1; } }
  else if (first && /^\d+(\.\d+)?[a-z]+$/.test(first)) { return null; } // "100g" handled by splitting first
  else if (first in NUMBER_WORDS) { quantity = NUMBER_WORDS[first]; used = 1; if (first === 'half' && tokens[1] === 'a') used = 2; if (first === 'a' && tokens[1] === 'half') { quantity = 0.5; used = 2; } if (first === 'one' && tokens[1] === 'and' && tokens[2] === 'half') { quantity = 1.5; used = 3; } }
  return quantity == null ? null : [quantity, used];
}

/** Parse one comma-separated item into { text, quantity, unit, foodText }. */
export function parseItem(text) {
  let tokens = normalise(text).replace(/(\d)([a-z])/g, '$1 $2').replace(/(\d+)\s*x\s+/g, '$1 piece ').split(' ').filter(Boolean);
  const original = text.trim();
  let quantity = 1, unit = null, explicitQuantity = false;
  const parsed = parseQuantity(tokens);
  if (parsed) { quantity = parsed[0]; tokens = tokens.slice(parsed[1]); explicitQuantity = true; }
  for (const [phrase, canonicalUnit] of UNIT_PHRASES) if (tokens.slice(0, 2).join(' ') === phrase) { unit = canonicalUnit; tokens = tokens.slice(2); }
  if (!unit && tokens.length && unitLookup.has(tokens[0]) && tokens.length > 1) { unit = unitLookup.get(tokens[0]); tokens = tokens.slice(1); if (tokens[0] === 'of') tokens = tokens.slice(1); }
  // Trailing quantity and unit: "roti 2", "rice 1 cup", "dal (150 g)".
  if (!explicitQuantity && tokens.length > 1) {
    const tail = tokens.slice(-2);
    const q = parseQuantity(tail);
    if (q && q[1] === 1 && unitLookup.has(tail[1])) { quantity = q[0]; unit = unitLookup.get(tail[1]); tokens = tokens.slice(0, -2); explicitQuantity = true; }
    else if (tokens.length > 1 && /^\d+(\.\d+)?$/.test(tokens[tokens.length - 1])) { quantity = Number(tokens[tokens.length - 1]); tokens = tokens.slice(0, -1); explicitQuantity = true; }
  }
  if (!unit && tokens.length > 1 && unitLookup.has(tokens[tokens.length - 1]) && /^\d/.test(tokens[tokens.length - 2] || '')) { unit = unitLookup.get(tokens.pop()); }
  return { text: original, quantity, unit, explicitQuantity, foodText: tokens.join(' ') };
}

/** Split "dal chawal" into ["dal", "chawal"] when every part is an exact food name; otherwise return the phrase whole. */
export function splitCompound(phrase, catalog = foods) {
  const tokens = canonical(normalise(phrase)).split(' ').filter(Boolean);
  if (tokens.length < 2 || tokens.length > 5) return [phrase];
  const exact = text => matchFood(text, catalog)[0]?.score === 1;
  // Fewest parts wins; parts are consecutive token groups.
  const best = new Array(tokens.length + 1).fill(null);
  best[0] = [];
  for (let end = 1; end <= tokens.length; end++) {
    for (let start = 0; start < end; start++) {
      if (!best[start]) continue;
      const text = tokens.slice(start, end).join(' ');
      if (!exact(text)) continue;
      const candidate = [...best[start], text];
      if (!best[end] || candidate.length < best[end].length) best[end] = candidate;
    }
  }
  return best[tokens.length] && best[tokens.length].length > 1 ? best[tokens.length] : [phrase];
}

/**
 * Parse a free-text meal description into matched items with gram weights and nutrition.
 * Always returns whatever could be matched (for a live estimate) plus the items that could not.
 */
export function parseMeal(text, catalog = foods) {
  const parts = String(text || '').split(/[,;\n+]+|\band\b|\bwith\b|\bplus\b|&/i).map(part => part.trim()).filter(Boolean);
  const items = [], unmatched = [];
  const totals = Object.fromEntries(nutrients.map(key => [key, 0]));
  for (const part of parts) {
    const item = parseItem(part);
    if (!item.foodText) { unmatched.push({ text: part, reason: 'Say what the food is.' }); continue; }
    const candidates = matchFood(item.foodText, catalog);
    // "dal chawal", "rajma rice": a compound of exact food names becomes one item per food.
    const pieces = candidates[0]?.score === 1 ? [[item.foodText, candidates]] : splitCompound(item.foodText, catalog).map(text => [text, matchFood(text, catalog)]);
    if (!pieces.length || !pieces[0][1].length) { unmatched.push({ text: part, reason: `“${item.foodText}” is not in the food list yet.` }); continue; }
    for (const [text, ranked] of pieces) {
      const food = ranked[0].food;
      const unit = pieces.length > 1 && !item.explicitQuantity ? food.unit : (item.unit || food.unit);
      const grams = gramsFor(food, item.quantity, unit);
      if (grams == null) { unmatched.push({ text: part, reason: `“${unit}” is not a measure we know for ${food.name}.` }); continue; }
      if (grams > 5000) { unmatched.push({ text: part, reason: `${grams} g of ${food.name} looks like a typo.` }); continue; }
      const nutrition = Object.fromEntries(nutrients.map(key => [key, round(food[key] * grams / 100)]));
      for (const key of nutrients) totals[key] += food[key] * grams / 100;
      items.push({ text: pieces.length > 1 ? text : part, quantity: item.quantity, unit, grams, food, foodId: food.id, name: food.name, fdcId: food.fdcId, source: food.source, confidence: ranked[0].score, alternatives: ranked.slice(1, 6).map(candidate => candidate.food.id), nutrition });
    }
  }
  return { items, unmatched, totals: items.length ? Object.fromEntries(nutrients.map(key => [key, round(totals[key])])) : null, complete: items.length > 0 && unmatched.length === 0 };
}

/** Strict variant used by tests and imports: a partial meal is never presented as a complete estimate. */
export function estimateMeal(text, catalog = foods) {
  const lines = String(text || '').split(/[,;\n]+/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return { errors: ['Enter at least one ingredient and its quantity.'], matches: [], totals: null };
  const result = parseMeal(text, catalog);
  const errors = result.unmatched.map(item => `“${item.text}”: ${item.reason}`);
  return { errors, matches: result.items.map(item => ({ name: item.name, grams: item.grams, fdcId: item.fdcId, foodId: item.foodId, source: item.source })), totals: errors.length ? null : result.totals };
}

/** Totals for an explicit list of items (after the user has corrected foods or units). */
export function totalsFor(items) {
  if (!items.length) return null;
  const totals = Object.fromEntries(nutrients.map(key => [key, 0]));
  for (const item of items) for (const key of nutrients) totals[key] += Number(item.nutrition?.[key]) || 0;
  return Object.fromEntries(nutrients.map(key => [key, round(totals[key])]));
}

/** Re-price one parsed item after the user changed its food, unit or quantity. */
export function repriceItem(item, { foodId = item.foodId, unit = item.unit, quantity = item.quantity } = {}, catalog = foods) {
  const food = catalog.find(candidate => candidate.id === foodId) || item.food;
  if (!food) return null;
  const grams = gramsFor(food, Number(quantity), unit) ?? gramsFor(food, Number(quantity), food.unit);
  const finalUnit = gramsFor(food, Number(quantity), unit) == null ? food.unit : unit;
  const nutrition = Object.fromEntries(nutrients.map(key => [key, round(food[key] * (grams || 0) / 100)]));
  return { ...item, food, foodId: food.id, name: food.name, fdcId: food.fdcId, source: food.source, unit: finalUnit, quantity: Number(quantity), grams: grams || 0, confidence: 1, nutrition };
}

export const unitsFor = food => Object.keys({ ...(food?.units || {}), g: 1 }).filter(unit => unit !== 'ml' || food?.units?.ml);

/** Distinct recently logged meals, newest first, for one-tap re-logging. */
export function recentMeals(meals = [], limit = 8) {
  const seen = new Set(), out = [];
  for (const meal of [...meals].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')))) {
    const key = String(meal.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key); out.push(meal);
    if (out.length >= limit) break;
  }
  return out;
}
