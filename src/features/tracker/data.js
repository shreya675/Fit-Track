import dayjs from 'dayjs';

export const today = () => dayjs().format('YYYY-MM-DD');
export const defaults = { name: 'Alex Morgan', fitnessGoal: 'Build a consistent routine', dailyWorkout: 60, dailySteps: 8000, dailyCalories: 500, nutritionGoal: 2200, waterGoal: 8, weeklySessions: 4 };
export const plans = [
  { id: 'bodyweight-basics', title: 'Bodyweight circuit', category: 'Strength', durationMinutes: 25, difficulty: 'Beginner', equipment: 'No equipment', description: 'A simple home session using bodyweight movements.', exercises: ['March in place · 3 minutes', 'Bodyweight squat · 2 × 10', 'Wall push-up · 2 × 10', 'Glute bridge · 2 × 12', 'Bird dog · 2 × 8 each side', 'Easy walk and stretch · 3 minutes'], notes: 'Rest between sets as needed. Use a comfortable range of motion.' },
  { id: 'lower-body', title: 'Lower body strength', category: 'Strength', durationMinutes: 35, difficulty: 'Intermediate', equipment: 'Dumbbells · Exercise mat', description: 'A lower-body routine covering squats, hinges, and single-leg work.', exercises: ['Easy walk and bodyweight warm-up · 5 minutes', 'Goblet squat · 3 × 10', 'Dumbbell Romanian deadlift · 3 × 10', 'Reverse lunge · 2 × 8 each side', 'Standing calf raise · 3 × 12', 'Cool-down · 5 minutes'], notes: 'Choose a weight you can control. Rest 60–90 seconds between sets.' },
  { id: 'back-biceps', title: 'Back and biceps', category: 'Strength', durationMinutes: 30, difficulty: 'Intermediate', equipment: 'Dumbbells · Bench', description: 'Pulling movements for the upper back and arms.', exercises: ['Shoulder circles and light rows · 5 minutes', 'Bench-supported dumbbell row · 3 × 10 each side', 'Light reverse fly · 2 × 10', 'Hammer curl · 3 × 10', 'Biceps curl · 2 × 12', 'Cool-down · 3 minutes'], notes: 'Keep each repetition controlled and avoid swinging the weights.' },
  { id: 'low-impact-cardio', title: 'Low-impact cardio', category: 'Cardio', durationMinutes: 20, difficulty: 'Beginner', equipment: 'No equipment', description: 'An indoor cardio session without jumping.', exercises: ['Easy march · 3 minutes', 'Side steps · 3 minutes', 'Standing knee lifts · 3 minutes', 'Easy march · 2 minutes', 'Heel digs · 3 minutes', 'Side steps · 3 minutes', 'Slow march · 3 minutes'], notes: 'Adjust your pace and take breaks when needed.' },
  { id: 'cycling', title: 'Steady cycling', category: 'Cardio', durationMinutes: 30, difficulty: 'Beginner', equipment: 'Stationary bike', description: 'A steady indoor cycling session with a warm-up and cool-down.', exercises: ['Easy pedaling · 5 minutes', 'Comfortable steady pace · 20 minutes', 'Easy pedaling · 5 minutes'], notes: 'Set the seat and resistance to a comfortable position before starting.' },
  { id: 'run-walk', title: 'Run-walk intervals', category: 'Cardio', durationMinutes: 30, difficulty: 'Beginner', equipment: 'Running shoes · Outdoor route', description: 'Short jogging intervals separated by walking breaks.', exercises: ['Warm-up walk · 5 minutes', 'Jog 1 minute, walk 2 minutes · repeat 6 times', 'Easy walk · 7 minutes'], notes: 'Keep the jogging intervals easy; switch to walking whenever needed.' },
  { id: 'desk-mobility', title: 'Desk break mobility', category: 'Mobility', durationMinutes: 10, difficulty: 'Beginner', equipment: 'Chair', description: 'A short movement break for a day spent sitting.', exercises: ['Easy walk · 2 minutes', 'Shoulder circles · 1 minute', 'Seated torso turns · 1 minute', 'Standing side reaches · 2 minutes', 'Ankle circles · 1 minute', 'Easy walk · 3 minutes'], notes: 'Move gently without forcing a stretch.' },
  { id: 'yoga-flow', title: 'Gentle yoga', category: 'Mobility', durationMinutes: 20, difficulty: 'Beginner', equipment: 'Exercise mat', description: 'A short sequence of gentle positions and stretches.', exercises: ['Comfortable seated breathing · 3 minutes', 'Cat-cow · 3 minutes', 'Child’s pose or seated rest · 2 minutes', 'Gentle low lunge · 2 minutes each side', 'Seated forward fold · 2 minutes', 'Reclined rest · 6 minutes'], notes: 'Use cushions for support and skip any position that feels uncomfortable.' },
  { id: 'full-body', title: 'Full body strength', category: 'Strength', durationMinutes: 40, difficulty: 'Intermediate', equipment: 'Dumbbells · Exercise mat', description: 'A balanced session for your major muscle groups.', exercises: ['Warm-up · 5 minutes', 'Goblet squat · 3 × 10', 'Dumbbell row · 3 × 12', 'Floor press · 3 × 10', 'Reverse lunge · 3 × 10 each side', 'Plank · 3 × 30 seconds'] },
  { id: 'easy-run', title: 'The everyday run', category: 'Cardio', durationMinutes: 30, difficulty: 'Beginner', equipment: 'Running shoes · Outdoor route', description: 'Find a comfortable pace and enjoy some time outside.', exercises: ['Easy walk · 5 minutes', 'Comfortable jog · 20 minutes', 'Cool-down walk · 5 minutes'] },
  { id: 'mobility', title: 'Reset & recover', category: 'Mobility', durationMinutes: 20, difficulty: 'Beginner', equipment: 'Exercise mat', description: 'Make room for a slower day with gentle mobility.', exercises: ['Easy movement · 3 minutes', 'Cat-cow · 2 × 10', 'Thoracic rotation · 2 × 8 each side', 'Hip mobility · 5 minutes', 'Gentle stretches · 5 minutes'] },
  { id: 'upper-body', title: 'Upper body focus', category: 'Strength', durationMinutes: 35, difficulty: 'Intermediate', equipment: 'Dumbbells · Bench', description: 'A focused push and pull session for your upper body.', exercises: ['Shoulder warm-up · 5 minutes', 'Bench press · 3 × 10', 'Single-arm row · 3 × 12', 'Shoulder press · 3 × 10', 'Biceps curl · 3 × 12'] },
  { id: 'walk', title: 'A little fresh air', category: 'Cardio', durationMinutes: 25, difficulty: 'Beginner', equipment: 'Comfortable shoes', description: 'An easy walk that fits between the rest of your day.', exercises: ['Easy pace · 5 minutes', 'Brisk walk · 15 minutes', 'Easy pace · 5 minutes'] },
  { id: 'core', title: 'Core foundations', category: 'Strength', durationMinutes: 15, difficulty: 'Beginner', equipment: 'Exercise mat', description: 'Short, simple, and easy to make a habit.', exercises: ['Warm-up · 3 minutes', 'Dead bug · 3 × 10', 'Bird dog · 3 × 10 each side', 'Side plank · 3 × 20 seconds each side'] },
];

export function emptyData() { return { profile: { ...defaults, name: '' }, sessions: [], meals: [], water: {}, steps: {}, customPlans: [], demo: false }; }
export function demoData() {
  const date = today();
  return { ...emptyData(), demo: true, profile: { ...defaults }, water: { [date]: 5 }, steps: { [date]: 6240 },
    sessions: [0, 1, 3, 5, 7, 9, 11, 13].map((days, i) => ({ id: `sample-${i}`, title: ['Morning run', 'Full body strength', 'Reset & recover'][i % 3], category: ['Cardio', 'Strength', 'Mobility'][i % 3], durationMinutes: [32, 45, 20][i % 3], calories: [286, 320, 75][i % 3], date: dayjs().subtract(days, 'day').format('YYYY-MM-DD') })),
    meals: [{ id: 'meal-1', name: 'Oats, banana & peanut butter', type: 'Breakfast', calories: 420, protein: 18, carbs: 58, fat: 14, date }, { id: 'meal-2', name: 'Grilled chicken & rice bowl', type: 'Lunch', calories: 640, protein: 42, carbs: 72, fat: 20, date }, { id: 'meal-3', name: 'Greek yogurt & berries', type: 'Snack', calories: 180, protein: 15, carbs: 22, fat: 4, date }],
  };
}
export function summarize(data, date = today()) {
  const day = dayjs(date);
  const start = day.startOf('day').subtract((day.day() + 6) % 7, 'day');
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = start.add(i, 'day').format('YYYY-MM-DD');
    return { date: key, day: start.add(i, 'day').format('ddd'), minutes: data.sessions.filter(s => s.date === key).reduce((n, s) => n + Number(s.durationMinutes || 0), 0) };
  });
  const sessions = data.sessions.filter(s => s.date === date);
  const meals = data.meals.filter(s => s.date === date);
  const weekSessions = data.sessions.filter(s => s.date >= start.format('YYYY-MM-DD') && s.date <= date);
  let cursor = day, streak = 0;
  const days = new Set(data.sessions.map(s => s.date));
  if (!days.has(date)) cursor = cursor.subtract(1, 'day');
  while (days.has(cursor.format('YYYY-MM-DD'))) { streak++; cursor = cursor.subtract(1, 'day'); }
  return { week, weekSessions, streak, sessions, meals, minutes: sessions.reduce((n, s) => n + Number(s.durationMinutes || 0), 0), burned: sessions.reduce((n, s) => n + Number(s.calories || 0), 0), eaten: meals.reduce((n, s) => n + Number(s.calories || 0), 0), water: data.water[date] || 0, steps: data.steps[date] || 0 };
}
