// Nutrition targets and intake summaries. Pure functions: no React, no Firebase.
import dayjs from 'dayjs';

const DAY = 'YYYY-MM-DD';
const round = (value, places = 0) => { const factor = 10 ** places; return Math.round(value * factor) / factor; };
export const macros = ['protein', 'carbs', 'fat'];
export const kcalPerGram = { protein: 4, carbs: 4, fat: 9 };
/** Default energy split when a user has not set gram targets: 30% protein, 40% carbs, 30% fat. */
export const defaultSplit = { protein: 0.3, carbs: 0.4, fat: 0.3 };

/** Daily targets in kcal and grams. Blank macro goals are derived from the calorie target using the default split. */
export function macroTargets(profile = {}) {
  const calories = Math.max(0, Number(profile.nutritionGoal) || 0);
  const targets = { calories, derived: {} };
  for (const key of macros) {
    const own = Number(profile[`${key}Goal`]);
    if (Number.isFinite(own) && own > 0) { targets[key] = round(own); targets.derived[key] = false; }
    else { targets[key] = round(calories * defaultSplit[key] / kcalPerGram[key]); targets.derived[key] = true; }
  }
  return targets;
}

/** Sum of a day's meals. Missing macros count as zero but are reported so the page can say "not recorded". */
export function dayIntake(meals = [], date) {
  const rows = date ? meals.filter(meal => meal.date === date) : meals;
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, meals: rows.length, macrosMissing: 0 };
  for (const meal of rows) {
    totals.calories += Number(meal.calories) || 0;
    if (meal.protein == null && meal.carbs == null && meal.fat == null) totals.macrosMissing++;
    for (const key of macros) totals[key] += Number(meal[key]) || 0;
  }
  for (const key of ['calories', ...macros]) totals[key] = round(totals[key], 1);
  return totals;
}

/** Share of calories from each macro, from grams eaten. Returns null when nothing was recorded. */
export function macroSplit(intake) {
  const energy = macros.reduce((sum, key) => sum + (Number(intake?.[key]) || 0) * kcalPerGram[key], 0);
  if (!energy) return null;
  return Object.fromEntries(macros.map(key => [key, Math.round((Number(intake[key]) || 0) * kcalPerGram[key] / energy * 100)]));
}

/** Within ±10% of the calorie target counts as on target; a day with nothing logged is not judged. */
export function targetStatus(calories, target) {
  if (!target || !calories) return 'none';
  if (calories < target * 0.9) return 'under';
  if (calories > target * 1.1) return 'over';
  return 'on';
}

/**
 * Monday-to-Sunday intake for the week containing `date`, with activity calories from sessions alongside,
 * and a summary over the days that have at least one meal logged.
 */
export function weekIntake(data, date = dayjs().format(DAY), today = dayjs().format(DAY)) {
  const targets = macroTargets(data.profile);
  const day = dayjs(date);
  const start = day.subtract((day.day() + 6) % 7, 'day');
  const days = Array.from({ length: 7 }, (_, i) => {
    const key = start.add(i, 'day').format(DAY);
    const intake = dayIntake(data.meals || [], key);
    const burned = round((data.sessions || []).filter(session => session.date === key).reduce((sum, session) => sum + (Number(session.calories) || 0), 0));
    return { date: key, day: start.add(i, 'day').format('ddd'), ...intake, burned, logged: intake.meals > 0, future: key > today, status: targetStatus(intake.calories, targets.calories), isToday: key === today };
  });
  const logged = days.filter(item => item.logged);
  const average = key => (logged.length ? round(logged.reduce((sum, item) => sum + item[key], 0) / logged.length) : 0);
  return {
    days, targets, loggedDays: logged.length,
    onTarget: logged.filter(item => item.status === 'on').length,
    average: { calories: average('calories'), protein: average('protein'), carbs: average('carbs'), fat: average('fat'), burned: average('burned') },
    total: { calories: round(logged.reduce((sum, item) => sum + item.calories, 0)), burned: round(days.reduce((sum, item) => sum + item.burned, 0)) },
    max: Math.max(targets.calories || 0, ...days.map(item => item.calories), 1),
  };
}

/** A plain-language line for the week panel. */
export function weekSummary(week) {
  if (!week.loggedDays) return 'No meals logged this week yet.';
  const parts = [`Average ${week.average.calories.toLocaleString()} kcal over ${week.loggedDays} logged ${week.loggedDays === 1 ? 'day' : 'days'}`];
  if (week.targets.calories) parts.push(`${week.onTarget} within 10% of your ${week.targets.calories.toLocaleString()} kcal target`);
  if (week.targets.protein) parts.push(`protein averaged ${week.average.protein} g of ${week.targets.protein} g`);
  return parts.join(' · ') + '.';
}
