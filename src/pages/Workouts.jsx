import React from 'react';
import './workouts.css';

const workouts = [
  {
    title: "Push Day",
    duration: "45 mins",
    exercises: "Bench Press, Shoulder Press, Triceps Dips",
  },
  {
    title: "Leg Day",
    duration: "60 mins",
    exercises: "Squats, Lunges, Leg Press",
  },
  {
    title: "Cardio",
    duration: "30 mins",
    exercises: "Running, Jump Rope, Cycling",
  },
  {
    title: "Pull Day",
    duration: "50 mins",
    exercises: "Deadlifts, Pull-ups, Bicep Curls",
  },
];

function Workouts() {
  return (
    <div className="workouts-page">
      <div className="header">
        <h1>My Workouts</h1>
        <button className="add-btn">+ Add Workout</button>
      </div>
      <div className="workout-list">
        {workouts.map((workout, index) => (
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
