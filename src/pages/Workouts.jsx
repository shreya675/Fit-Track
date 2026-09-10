import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import { Activity, Clock, Dumbbell, Flame, Footprints, Pencil, Play, Trash2 } from 'lucide-react';
import './workouts.css';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

const suggestedWorkouts = [
  {
    title: 'Upper Body Strength',
    duration: '48 mins',
    category: 'Strength',
    difficulty: 'Intermediate',
    equipment: 'Barbell, dumbbells, bench',
    focusArea: 'Chest, shoulders, triceps',
    exercises: [
      { name: 'Dynamic shoulder warm-up', sets: '2 rounds', reps: '45 sec' },
      { name: 'Bench Press', sets: '4 sets', reps: '6-8 reps' },
      { name: 'Incline Dumbbell Press', sets: '3 sets', reps: '8-10 reps' },
      { name: 'Seated Shoulder Press', sets: '3 sets', reps: '8-10 reps' },
      { name: 'Cable Triceps Pressdown', sets: '3 sets', reps: '12-15 reps' },
      { name: 'Cool-down chest stretch', sets: '1 round', reps: '3 min' },
    ],
    notes: 'Rest 90 seconds on compound lifts and 45 seconds on isolation work.',
  },
  {
    title: 'Lower Body Power',
    duration: '52 mins',
    category: 'Strength',
    difficulty: 'Advanced',
    equipment: 'Squat rack, barbell, leg press',
    focusArea: 'Quads, glutes, hamstrings',
    exercises: [
      { name: 'Hip mobility warm-up', sets: '2 rounds', reps: '60 sec' },
      { name: 'Back Squat', sets: '5 sets', reps: '5 reps' },
      { name: 'Romanian Deadlift', sets: '4 sets', reps: '8 reps' },
      { name: 'Walking Lunges', sets: '3 sets', reps: '12 each leg' },
      { name: 'Leg Press', sets: '3 sets', reps: '10-12 reps' },
      { name: 'Standing Calf Raise', sets: '4 sets', reps: '15 reps' },
    ],
    notes: 'Keep two reps in reserve on the first three squat sets.',
  },
  {
    title: 'Zone 2 Conditioning',
    duration: '35 mins',
    category: 'Cardio',
    difficulty: 'Beginner',
    equipment: 'Treadmill, bike, or outdoor route',
    focusArea: 'Aerobic base',
    exercises: [
      { name: 'Easy warm-up walk', sets: '1 block', reps: '5 min' },
      { name: 'Steady conversational pace', sets: '1 block', reps: '24 min' },
      { name: 'Controlled incline push', sets: '3 rounds', reps: '90 sec' },
      { name: 'Cool-down walk', sets: '1 block', reps: '4 min' },
    ],
    notes: 'Aim for a pace where you can speak in short sentences.',
  },
  {
    title: 'Pull & Core Builder',
    duration: '44 mins',
    category: 'Strength',
    difficulty: 'Intermediate',
    equipment: 'Pull-up bar, cable station, mat',
    focusArea: 'Back, biceps, core',
    exercises: [
      { name: 'Band pull-aparts', sets: '2 sets', reps: '20 reps' },
      { name: 'Pull-ups or Lat Pulldown', sets: '4 sets', reps: '6-10 reps' },
      { name: 'Single-arm Cable Row', sets: '3 sets', reps: '10 each side' },
      { name: 'Face Pulls', sets: '3 sets', reps: '15 reps' },
      { name: 'Hammer Curls', sets: '3 sets', reps: '10-12 reps' },
      { name: 'Dead Bug', sets: '3 sets', reps: '10 each side' },
    ],
    notes: 'Prioritize full range of motion over heavier weight.',
  },
];

const initialWorkoutForm = {
  title: '',
  duration: '',
  exercises: '',
  category: 'Strength',
  difficulty: 'Beginner',
  equipment: '',
  focusArea: '',
  notes: '',
};

const parseDuration = (duration) => {
  const match = String(duration).match(/\d+/);
  return match ? Number(match[0]) : 30;
};

const parseExercises = (exercises) => {
  if (Array.isArray(exercises)) {
    return exercises.map((exercise) => exercise.name || exercise).filter(Boolean);
  }

  return String(exercises)
    .split(',')
    .map((exercise) => exercise.trim())
    .filter(Boolean);
};

const formatExercises = (exercises) => {
  if (Array.isArray(exercises)) {
    return exercises.map((exercise) => {
      if (typeof exercise === 'string') return exercise;
      return `${exercise.name}${exercise.sets ? ` - ${exercise.sets}` : ''}${exercise.reps ? ` x ${exercise.reps}` : ''}`;
    }).join(', ');
  }

  return exercises;
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const estimateCalories = (workout, durationMinutes) => {
  const title = workout.title.toLowerCase();
  const category = String(workout.category || '').toLowerCase();
  const intensity = title.includes('cardio') || title.includes('running') || category.includes('cardio') ? 9 : 7;
  return Math.max(Math.round(durationMinutes * intensity), 1);
};

const estimateSteps = (workout, durationMinutes) => {
  const title = workout.title.toLowerCase();
  const category = String(workout.category || '').toLowerCase();
  const stepRate = title.includes('cardio') || title.includes('running') || category.includes('cardio') ? 120 : 35;
  return Math.max(Math.round(durationMinutes * stepRate), 0);
};

function Workouts() {
  const [user] = useAuthState(auth);
  const [customWorkouts, setCustomWorkouts] = useState([]);
  const [newWorkout, setNewWorkout] = useState(initialWorkoutForm);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (!user || !db) return undefined;

    const q = query(collection(db, 'users', user.uid, 'workouts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workouts = snapshot.docs.map((workoutDoc) => ({
        id: workoutDoc.id,
        category: 'Custom',
        ...workoutDoc.data(),
      }));
      setCustomWorkouts(workouts);
    });

    return () => unsubscribe();
  }, [user]);

  const sessionPlan = useMemo(() => {
    if (!activeWorkout) return null;

    const durationMinutes = parseDuration(activeWorkout.duration);
    const totalSeconds = durationMinutes * 60;
    const exerciseNames = parseExercises(activeWorkout.exercises);
    const exerciseSeconds = Math.max(Math.floor(totalSeconds / (exerciseNames.length || 1)), 1);
    const exercises = exerciseNames.map((name, index) => ({
      name,
      startsAt: index * exerciseSeconds,
      endsAt: index === exerciseNames.length - 1 ? totalSeconds : (index + 1) * exerciseSeconds,
      durationSeconds: index === exerciseNames.length - 1
        ? totalSeconds - index * exerciseSeconds
        : exerciseSeconds,
    }));

    return { durationMinutes, totalSeconds, exercises };
  }, [activeWorkout]);

  const currentExerciseIndex = useMemo(() => {
    if (!sessionPlan) return 0;

    return Math.min(
      sessionPlan.exercises.findIndex((exercise) => (
        elapsedSeconds >= exercise.startsAt && elapsedSeconds < exercise.endsAt
      )),
      sessionPlan.exercises.length - 1
    );
  }, [elapsedSeconds, sessionPlan]);

  const normalizedExerciseIndex = currentExerciseIndex < 0 ? sessionPlan?.exercises.length - 1 || 0 : currentExerciseIndex;
  const durationMinutes = sessionPlan ? Math.round(elapsedSeconds / 60) || sessionPlan.durationMinutes : 0;
  const sessionCalories = activeWorkout ? estimateCalories(activeWorkout, durationMinutes) : 0;
  const sessionSteps = activeWorkout ? estimateSteps(activeWorkout, durationMinutes) : 0;

  useEffect(() => {
    if (!isRunning || !sessionPlan) return undefined;

    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => {
        if (seconds + 1 >= sessionPlan.totalSeconds) {
          setIsRunning(false);
          setShowSummary(true);
          return sessionPlan.totalSeconds;
        }

        return seconds + 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, sessionPlan]);

  const handleSaveWorkout = async () => {
    if (!newWorkout.title || !newWorkout.duration || !newWorkout.exercises) {
      alert('Please fill all fields');
      return;
    }

    if (!user || !db) {
      alert('Sign in before saving workouts');
      return;
    }

    try {
      if (editingWorkoutId) {
        await updateDoc(doc(db, 'users', user.uid, 'workouts', editingWorkoutId), newWorkout);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'workouts'), newWorkout);
      }

      setNewWorkout(initialWorkoutForm);
      setEditingWorkoutId(null);
    } catch (err) {
      console.error('Error saving workout:', err);
    }
  };

  const handleEditWorkout = (workout) => {
    setNewWorkout({
      title: workout.title || '',
      duration: workout.duration || '',
      exercises: workout.exercises || '',
      category: workout.category || 'Custom',
      difficulty: workout.difficulty || 'Beginner',
      equipment: workout.equipment || '',
      focusArea: workout.focusArea || '',
      notes: workout.notes || '',
    });
    setEditingWorkoutId(workout.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (!user || !db) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'workouts', workoutId));
    } catch (err) {
      console.error('Error deleting workout:', err);
    }
  };

  const openWorkout = (workout) => {
    setActiveWorkout(workout);
    setElapsedSeconds(0);
    setIsRunning(false);
    setShowSummary(false);
  };

  const closeWorkout = () => {
    setActiveWorkout(null);
    setElapsedSeconds(0);
    setIsRunning(false);
    setShowSummary(false);
  };

  const saveCompletedWorkout = async () => {
    if (!user || !db || !activeWorkout || !sessionPlan) return;

    try {
      await addDoc(collection(db, 'users', user.uid, 'workoutSessions'), {
        title: activeWorkout.title,
        category: activeWorkout.category || 'Workout',
        difficulty: activeWorkout.difficulty || 'Beginner',
        equipment: activeWorkout.equipment || 'Bodyweight',
        focusArea: activeWorkout.focusArea || 'Full body',
        durationMinutes,
        plannedDurationMinutes: sessionPlan.durationMinutes,
        calories: sessionCalories,
        steps: sessionSteps,
        exercises: sessionPlan.exercises.map((exercise) => ({
          name: exercise.name,
          allocatedSeconds: exercise.durationSeconds,
        })),
        date: dayjs().format('YYYY-MM-DD'),
        completedAt: serverTimestamp(),
      });

      closeWorkout();
    } catch (err) {
      console.error('Error saving completed workout:', err);
    }
  };

  const renderWorkoutCard = (workout, key, isCustom = false) => (
    <div key={key} className="workout-card-horizontal">
      <div className="workout-info">
        <div className="workout-title-row">
          <h3>{workout.title}</h3>
          <span>{workout.category || 'Workout'}</span>
          <span>{workout.difficulty || 'Beginner'}</span>
        </div>
        <div className="workout-meta-grid">
          <span><Clock size={16} /> {workout.duration}</span>
          <span><Dumbbell size={16} /> {workout.equipment || 'Bodyweight'}</span>
          <span><Activity size={16} /> {workout.focusArea || 'Full body'}</span>
        </div>
        <p><strong>Plan:</strong> {formatExercises(workout.exercises)}</p>
        {workout.notes && <p className="coach-note"><strong>Coach note:</strong> {workout.notes}</p>}
      </div>
      <div className="workout-card-actions">
        {isCustom && (
          <>
            <button className="secondary-card-btn" onClick={() => handleEditWorkout(workout)} aria-label={`Edit ${workout.title}`}>
              <Pencil size={16} /> Edit
            </button>
            <button className="secondary-card-btn" onClick={() => handleDeleteWorkout(workout.id)} aria-label={`Delete ${workout.title}`}>
              <Trash2 size={16} /> Delete
            </button>
          </>
        )}
        <button className="card-btn" onClick={() => openWorkout(workout)}>
          <Play size={18} /> Start
        </button>
      </div>
    </div>
  );

  const sessionModal = activeWorkout && sessionPlan ? (
    <div className="session-overlay">
      <div className="session-modal">
        <div className="session-header">
          <div>
            <p className="session-label">Workout Session</p>
            <h2>{activeWorkout.title}</h2>
          </div>
          <button className="session-close" onClick={closeWorkout}>×</button>
        </div>

        {showSummary ? (
          <div className="session-summary">
            <h3>Workout Summary</h3>
            <div className="summary-grid">
              <div><Clock size={18} /><strong>{durationMinutes}</strong><span>Minutes</span></div>
              <div><Flame size={18} /><strong>{sessionCalories}</strong><span>Calories</span></div>
              <div><Footprints size={18} /><strong>{sessionSteps}</strong><span>Steps</span></div>
              <div><Dumbbell size={18} /><strong>{sessionPlan.exercises.length}</strong><span>Exercises</span></div>
            </div>
            <div className="session-actions">
              <button onClick={() => setShowSummary(false)}>Back</button>
              <button onClick={closeWorkout}>Discard</button>
              <button className="finish-session wide-action" onClick={saveCompletedWorkout}>Save Workout</button>
            </div>
          </div>
        ) : (
          <>
            <div className="timer-display">{formatTime(elapsedSeconds)}</div>
            <div className="timer-meta">
              <span>{formatTime(Math.max(sessionPlan.totalSeconds - elapsedSeconds, 0))} left</span>
              <span>{sessionPlan.durationMinutes} min plan</span>
            </div>

            <div className="session-progress">
              <div style={{ width: `${Math.min((elapsedSeconds / sessionPlan.totalSeconds) * 100, 100)}%` }}></div>
            </div>

            <div className="current-exercise">
              <span>Current Exercise</span>
              <strong>{sessionPlan.exercises[normalizedExerciseIndex]?.name}</strong>
            </div>

            <div className="exercise-timeline">
              {sessionPlan.exercises.map((exercise, index) => (
                <div
                  className={`exercise-step ${index === normalizedExerciseIndex ? 'active' : ''} ${elapsedSeconds >= exercise.endsAt ? 'done' : ''}`}
                  key={exercise.name}
                >
                  <span>{exercise.name}</span>
                  <small>{formatTime(exercise.durationSeconds)}</small>
                </div>
              ))}
            </div>

            <div className="session-actions">
              <button onClick={() => setIsRunning((running) => !running)}>
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button onClick={() => {
                setElapsedSeconds(0);
                setIsRunning(false);
              }}>
                Reset
              </button>
              <button onClick={closeWorkout}>Stop</button>
              <button className="finish-session" onClick={() => {
                setIsRunning(false);
                setShowSummary(true);
              }}>
                Finish
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="workouts-page">
      <div className="header">
        <div className="workout-page-heading">
          <span>Training Library</span>
          <h1>Workouts</h1>
          <p>Create structured routines, run timed sessions, and save completion data back to your dashboard.</p>
        </div>
        <div className="add-workout-form">
          <input
            type="text"
            placeholder="Workout Title"
            value={newWorkout.title}
            onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
          />
          <input
            type="text"
            placeholder="Duration, e.g. 30 mins"
            value={newWorkout.duration}
            onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
          />
          <select
            value={newWorkout.category}
            onChange={(e) => setNewWorkout({ ...newWorkout, category: e.target.value })}
          >
            <option value="Strength">Strength</option>
            <option value="Cardio">Cardio</option>
            <option value="Mobility">Mobility</option>
            <option value="HIIT">HIIT</option>
          </select>
          <select
            value={newWorkout.difficulty}
            onChange={(e) => setNewWorkout({ ...newWorkout, difficulty: e.target.value })}
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <input
            type="text"
            placeholder="Equipment, e.g. dumbbells"
            value={newWorkout.equipment}
            onChange={(e) => setNewWorkout({ ...newWorkout, equipment: e.target.value })}
          />
          <input
            type="text"
            placeholder="Focus area, e.g. upper body"
            value={newWorkout.focusArea}
            onChange={(e) => setNewWorkout({ ...newWorkout, focusArea: e.target.value })}
          />
          <input
            type="text"
            placeholder="Exercises, comma-separated"
            value={newWorkout.exercises}
            onChange={(e) => setNewWorkout({ ...newWorkout, exercises: e.target.value })}
          />
          <input
            type="text"
            placeholder="Coach note, rest target, or intensity cue"
            value={newWorkout.notes}
            onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
          />
          <button onClick={handleSaveWorkout}>{editingWorkoutId ? 'Update Workout' : '+ Save Workout'}</button>
          {editingWorkoutId && (
            <button className="cancel-edit-btn" onClick={() => {
              setNewWorkout(initialWorkoutForm);
              setEditingWorkoutId(null);
            }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <h2>Your Workouts</h2>
      <div className="workout-list">
        {customWorkouts.length > 0 ? (
          customWorkouts.map((workout) => renderWorkoutCard(workout, workout.id, true))
        ) : (
          <p className="empty-workouts">Save a custom workout to see it here.</p>
        )}
      </div>

      <h2>Suggested Workouts</h2>
      <div className="workout-list">
        {suggestedWorkouts.map((workout) => renderWorkoutCard(workout, workout.title))}
      </div>

      {sessionModal && createPortal(sessionModal, document.body)}
    </div>
  );
}

export default Workouts;
