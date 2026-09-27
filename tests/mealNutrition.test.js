import test from 'node:test';
import assert from 'node:assert/strict';
import { copyMeal, estimateMeal, foodCatalog, gramsFor, matchFood, parseItem, parseMeal, perServing, recentMeals, recipeFromMeal, repriceItem, scaleNutrition, totalsFor } from '../src/features/tracker/mealNutrition.js';

const sample = { id: 'test', name: 'Cooked test food', aliases: ['test food'], fdcId: 1, calories: 200, protein: 10, carbs: 20, fat: 5 };
test('Ingredient weights are summed in grams and kilograms without partial estimates', () => {
  const estimate = estimateMeal('150 g test food\n0.1 kg test food', [sample]);
  assert.deepEqual(estimate.errors, []);
  assert.deepEqual(estimate.totals, { calories: 500, protein: 25, carbs: 50, fat: 12.5 });
  for (const text of ['test food', '0 g test food', '100 g unknown', '100 g test food, 20 g unknown']) {
    const result = estimateMeal(text, [sample]);
    assert.ok(result.errors.length, text);
    assert.ok(!result.totals, text);
  }
  // A household measure on a food without its own portion table falls back to a generic weight.
  assert.equal(estimateMeal('1 bowl test food', [sample]).matches[0].grams, 200);
});
test('Serving scaling preserves unknown macros and does not compound rounding', () => {
  const base = { calories: 123.45, protein: null, carbs: 15, fat: 0 };
  assert.deepEqual(scaleNutrition(base, 2), { calories: 246.9, protein: null, carbs: 30, fat: 0 });
  assert.equal(scaleNutrition(base, 0.5).calories, 61.7);
  assert.equal(base.calories, 123.45);
  assert.throws(() => scaleNutrition(base, 0));
  assert.throws(() => scaleNutrition(base, NaN));
});
test('Copies and recipes preserve nutrition snapshots without reusing diary IDs', () => {
  const meal = { id: 'original', createdAt: 'old', updatedAt: 'old', name: 'Lunch', date: '2026-09-10', type: 'Lunch', servings: 2, calories: 500, protein: 30, carbs: 50, fat: null };
  const copy = copyMeal(meal, '2026-09-11');
  assert.equal(copy.id, undefined);
  assert.equal(copy.createdAt, undefined);
  assert.equal(copy.updatedAt, undefined);
  assert.equal(copy.date, '2026-09-11');
  assert.equal(copy.calories, 500);
  assert.equal(copy.fat, null);
  assert.deepEqual(perServing(copy), { calories: 250, protein: 15, carbs: 25, fat: null });
  const recipe = recipeFromMeal(meal);
  assert.equal(recipe.servings, 1);
  assert.equal(recipe.calories, 250);
  assert.equal(copyMeal(recipe, '2026-09-12').calories, 250);
  assert.equal(meal.date, '2026-09-10');
});
test('Catalog entries are complete, uniquely aliased and self-consistent', () => {
  assert.ok(foodCatalog.length >= 150);
  assert.equal(new Set(foodCatalog.map(food => food.id)).size, foodCatalog.length);
  const seen = new Map();
  for (const food of foodCatalog) {
    assert.ok(food.name && food.aliases.length && food.source, food.id);
    for (const key of ['calories', 'protein', 'carbs', 'fat']) assert.ok(Number.isFinite(food[key]) && food[key] >= 0, `${food.id}.${key}`);
    assert.ok(food.protein * 4 + food.carbs * 4 + food.fat * 9 <= food.calories * 1.35 + 15, `${food.id} macros exceed its calories`);
    assert.ok(food.units && food.units[food.unit] != null, `${food.id} default unit ${food.unit} has a gram weight`);
    for (const alias of food.aliases) {
      assert.ok(!seen.has(alias) || seen.get(alias) === food.id, `alias "${alias}" is claimed by ${seen.get(alias)} and ${food.id}`);
      seen.set(alias, food.id);
    }
    assert.equal(matchFood(food.aliases[0])[0].food.id, food.id, `${food.aliases[0]} resolves to ${food.id}`);
    assert.equal(estimateMeal(`100 g ${food.aliases[0]}`).totals.calories, Math.round(food.calories * 10) / 10);
  }
  const withIds = foodCatalog.filter(food => food.fdcId);
  assert.equal(new Set(withIds.map(food => food.fdcId)).size, withIds.length);
});
test('Items are parsed with numbers, fractions, words and household units in either order', () => {
  assert.deepEqual(parseItem('2 roti'), { text: '2 roti', quantity: 2, unit: null, explicitQuantity: true, foodText: 'roti' });
  assert.equal(parseItem('1 katori dal').unit, 'katori');
  assert.equal(parseItem('half cup rice').quantity, 0.5);
  assert.equal(parseItem('½ cup rice').quantity, 0.5);
  assert.equal(parseItem('1 1/2 cups rice').quantity, 1.5);
  assert.equal(parseItem('1 1/2 cups rice').unit, 'cup');
  assert.equal(parseItem('100g chicken').unit, 'g');
  assert.equal(parseItem('100g chicken').quantity, 100);
  assert.equal(parseItem('rice 1 cup').unit, 'cup');
  assert.equal(parseItem('rice 1 cup').foodText, 'rice');
  assert.equal(parseItem('roti 3').quantity, 3);
  assert.equal(parseItem('an apple').quantity, 1);
  assert.equal(parseItem('two glasses of milk').unit, 'glass');
  assert.equal(parseItem('two glasses of milk').foodText, 'milk');
  assert.equal(parseItem('2 tbsp peanut butter').foodText, 'peanut butter');
  assert.equal(parseItem('large banana').unit, 'large');
  assert.equal(parseItem('chai').quantity, 1);
  assert.equal(parseItem('chai').explicitQuantity, false);
});
test('Household units resolve to the food’s own portion table, then to sensible generic weights', () => {
  const roti = foodCatalog.find(food => food.id === 'roti'), rice = foodCatalog.find(food => food.id === 'rice'), milk = foodCatalog.find(food => food.id === 'whole-milk');
  assert.equal(gramsFor(roti, 2, 'piece'), 80);
  assert.equal(gramsFor(roti, 1, 'large'), 55);
  assert.equal(gramsFor(roti, 1, 'half'), 20);
  assert.equal(gramsFor(rice, 1, 'katori'), 150);
  assert.equal(gramsFor(rice, 0.5, 'cup'), 80);
  assert.equal(gramsFor(rice, 1, 'half-plate'), 125);
  assert.equal(gramsFor(milk, 200, 'ml'), 200);
  assert.equal(gramsFor(milk, 1, 'glass'), 250);
  assert.equal(gramsFor(roti, 1, 'g'), 1);
  assert.equal(gramsFor(roti, 0, 'piece'), null);
  assert.equal(gramsFor({ id: 'x', name: 'x', aliases: [], calories: 1, protein: 0, carbs: 0, fat: 0 }, 1, 'piece'), null);
});
test('Food matching is exact first, forgiving second, and never wildly wrong', () => {
  assert.equal(matchFood('roti')[0].food.id, 'roti');
  assert.equal(matchFood('rotis')[0].food.id, 'roti');
  assert.equal(matchFood('Chapati')[0].food.id, 'roti');
  assert.equal(matchFood('moong dal')[0].food.id, 'moong-dal');
  assert.equal(matchFood('dal')[0].food.id, 'dal');
  assert.equal(matchFood('aloo paratha')[0].food.id, 'aloo-paratha');
  assert.equal(matchFood('bananna')[0].food.id, 'banana');
  assert.equal(matchFood('boiled eggs')[0].food.id, 'egg');
  assert.equal(matchFood('eggs')[0].food.id, 'egg');
  assert.equal(matchFood('paneer butter masala')[0].food.id, 'paneer-butter-masala');
  assert.equal(matchFood('steamed rice')[0].food.id, 'rice');
  assert.equal(matchFood('idlis')[0].food.id, 'idli');
  assert.equal(matchFood('masala chai')[0].food.id, 'chai');
  assert.ok(matchFood('bananna')[0].score < 1);
  assert.deepEqual(matchFood('xqzv'), []);
  assert.deepEqual(matchFood(''), []);
});
test('A whole meal in plain words is priced item by item, with what could not be matched reported', () => {
  const meal = parseMeal('2 roti, 1 katori dal and half cup rice');
  assert.equal(meal.items.length, 3);
  assert.deepEqual(meal.items.map(item => [item.foodId, item.quantity, item.unit, item.grams]), [['roti', 2, 'piece', 80], ['dal', 1, 'katori', 150], ['rice', 0.5, 'cup', 80]]);
  assert.equal(meal.totals.calories, Math.round((265 * 0.8 + 100 * 1.5 + 130 * 0.8) * 10) / 10);
  assert.ok(meal.complete);
  const partial = parseMeal('2 eggs, 1 bowl of quinoa salad thing, chai');
  assert.equal(partial.items.length, 3, 'a fuzzy hit is still a hit');
  const unknown = parseMeal('2 eggs, xqzv, chai');
  assert.equal(unknown.items.length, 2);
  assert.equal(unknown.unmatched.length, 1);
  assert.ok(!unknown.complete);
  assert.ok(unknown.totals.calories > 0, 'partial totals are still returned for a live estimate');
  assert.equal(parseMeal('').totals, null);
  assert.equal(parseMeal('20 kg rice').unmatched.length, 1, 'absurd weights are flagged');
  const chai = parseMeal('chai').items[0];
  assert.equal(chai.unit, 'cup');
  assert.equal(chai.grams, 150);
});
test('Corrected items are re-priced and totals follow the corrected list', () => {
  const [item] = parseMeal('1 cup rice').items;
  const asBrown = repriceItem(item, { foodId: 'brown-rice' });
  assert.equal(asBrown.foodId, 'brown-rice');
  assert.equal(asBrown.grams, 160);
  assert.equal(asBrown.nutrition.calories, Math.round(123 * 1.6 * 10) / 10);
  const twoKatori = repriceItem(item, { unit: 'katori', quantity: 2 });
  assert.equal(twoKatori.grams, 300);
  const unknownUnit = repriceItem(item, { unit: 'fillet' });
  assert.equal(unknownUnit.unit, 'fillet', 'generic units still work');
  assert.equal(totalsFor([item, asBrown]).calories, Math.round((item.nutrition.calories + asBrown.nutrition.calories) * 10) / 10);
  assert.equal(totalsFor([]), null);
});
test('Recent meals are distinct by name and newest first', () => {
  const meals = [
    { name: 'Chai', date: '2026-09-10', createdAt: '1' }, { name: 'chai ', date: '2026-09-12', createdAt: '2' },
    { name: 'Poha', date: '2026-09-12', createdAt: '1' }, { name: '', date: '2026-09-13' }, { name: 'Dal rice', date: '2026-09-11' },
  ];
  assert.deepEqual(recentMeals(meals).map(meal => meal.name), ['chai ', 'Poha', 'Dal rice']);
  assert.equal(recentMeals(meals, 1).length, 1);
  assert.deepEqual(recentMeals([]), []);
});
