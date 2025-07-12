// src/pages/Workouts.jsx
import React, { useState, useEffect } from 'react';
import './workouts.css';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';


const suggestedWorkouts = [
  {
    title: 'Push Day',
    duration: '45 mins',
    exercises: 'Bench Press, Shoulder Press, Triceps Dips',
  },
  {
    title: 'Leg Day',
    duration: '60 mins',
    exercises: 'Squats, Lunges, Leg Press',
  },
  {
    title: 'Cardio',
    duration: '30 mins',
    exercises: 'Running, Jump Rope, Cycling',
  },
  {
    title: 'Pull Day',
    duration: '50 mins',
    exercises: 'Deadlifts, Pull-ups, Bicep Curls',
  },
];

function Workouts() {
  const [user] = useAuthState(auth);
  const [customWorkouts, setCustomWorkouts] = useState([]);
  const [newWorkout, setNewWorkout] = useState({ title: '', duration: '', exercises: '' });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'workouts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCustomWorkouts(workouts);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddWorkout = async () => {
    if (!newWorkout.title || !newWorkout.duration || !newWorkout.exercises) {
      alert('Please fill all fields');
      return;
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'workouts'), newWorkout);
      setNewWorkout({ title: '', duration: '', exercises: '' });
    } catch (err) {
      console.error('Error adding workout:', err);
    }
  };

  return (
    <div className="workouts-page">
      <div className="header">
          <h1>My Workouts</h1>
          <div className="add-workout-form">
            <input
              type="text"
              placeholder="Workout Title"
              value={newWorkout.title}
              onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
            />
            <input
              type="text"
              placeholder="Duration"
              value={newWorkout.duration}
              onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
            />
            <input
              type="text"
              placeholder="Exercises (comma-separated)"
              value={newWorkout.exercises}
              onChange={(e) => setNewWorkout({ ...newWorkout, exercises: e.target.value })}
            />
            <button onClick={handleAddWorkout}>+ Save Workout</button>
          </div>
        </div>


      <h2>Your Workouts</h2>
      <div className="workout-list">
        {customWorkouts.map((workout, index) => (
          <div key={workout.id} className="workout-card-horizontal">
            <div className="workout-info">
              <h3>{workout.title}</h3>
              <p><strong>Duration:</strong> {workout.duration}</p>
              <p><strong>Exercises:</strong> {workout.exercises}</p>
            </div>
            <button className="card-btn">Start Workout</button>
          </div>
        ))}
      </div>

      <h2>Suggested Workouts</h2>
      <div className="workout-list">
        {suggestedWorkouts.map((workout, index) => (
          <div key={index} className="workout-card-horizontal">
            <div className="workout-info">
              <h3>{workout.title}</h3>
              <p><strong>Duration:</strong> {workout.duration}</p>
              <p><strong>Exercises:</strong> {workout.exercises}</p>
            </div>
            <button className="card-btn">Start Workout</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Workouts;
