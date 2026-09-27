// Nutrition targets and intake summaries.
import dayjs from 'dayjs';

const DAY = 'YYYY-MM-DD';
const round = (value, places = 0) => { const factor = 10 ** places; return Math.round(value * factor) / factor; };
export const macros = ['protein', 'carbs', 'fat'];
export const kcalPerGram = { protein: 4, carbs: 4, fat: 9 };
// default energy split
export const defaultSplit = { protein: 0.3, carbs: 0.4, fat: 0.3 };

// gram targets from the profile, else derived from the calorie target
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

export function macroSplit(intake) {
  const energy = macros.reduce((sum, key) => sum + (Number(intake?.[key]) || 0) * kcalPerGram[key], 0);
  if (!energy) return null;
  return Object.fromEntries(macros.map(key => [key, Math.round((Number(intake[key]) || 0) * kcalPerGram[key] / energy * 100)]));
}

// +/-10% band
export function targetStatus(calories, target) {
  if (!target || !calories) return 'none';
  if (calories < target * 0.9) return 'under';
  if (calories > target * 1.1) return 'over';
  return 'on';
}

// Mon-Sun intake for the week of `date`
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

export function weekSummary(week) {
  if (!week.loggedDays) return 'No meals logged this week yet.';
  const parts = [`Average ${week.average.calories.toLocaleString()} kcal over ${week.loggedDays} logged ${week.loggedDays === 1 ? 'day' : 'days'}`];
  if (week.targets.calories) parts.push(`${week.onTarget} within 10% of your ${week.targets.calories.toLocaleString()} kcal target`);
  if (week.targets.protein) parts.push(`protein averaged ${week.average.protein} g of ${week.targets.protein} g`);
  return parts.join(' · ') + '.';
}
