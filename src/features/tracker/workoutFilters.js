export function workoutMinutes(plan) {
  return Number(plan.durationMinutes) || parseInt(plan.duration, 10) || 30;
}

export function selectWorkouts(plans, { query = '', category = 'All workouts', difficulty = 'Any level', duration = 'Any duration', favoritesOnly = false, favorites = [], sort = 'default' } = {}) {
  const term = query.trim().toLowerCase();
  const result = plans.filter(plan => {
    const minutes = workoutMinutes(plan);
    const haystack = [plan.title, plan.category, plan.description, plan.equipment, ...(Array.isArray(plan.exercises) ? plan.exercises.map(e => typeof e === 'string' ? e : e.name) : [plan.exercises])].join(' ').toLowerCase();
    return (!term || haystack.includes(term)) &&
      (category === 'All workouts' || plan.category === category) &&
      (difficulty === 'Any level' || plan.difficulty === difficulty) &&
      (duration === 'Any duration' || (duration === '15' ? minutes <= 15 : duration === '30' ? minutes > 15 && minutes <= 30 : minutes > 30)) &&
      (!favoritesOnly || favorites.includes(plan.id));
  });
  if (sort === 'shortest') result.sort((a, b) => workoutMinutes(a) - workoutMinutes(b));
  if (sort === 'longest') result.sort((a, b) => workoutMinutes(b) - workoutMinutes(a));
  if (sort === 'name') result.sort((a, b) => a.title.localeCompare(b.title));
  return result;
}
