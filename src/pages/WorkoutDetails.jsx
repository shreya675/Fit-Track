import React from 'react';
import './workouts.css';

function WorkoutDetails({ workout, onClose }) {
  return (
    <div className="popup-overlay">
      <div className="popup-details">
        <h2>{workout.title}</h2>
        <p><strong>Total Duration:</strong> {workout.duration}</p>
        <h4>Exercises:</h4>
        <ul>
          {workout.exercises.map((ex, idx) => (
            <li key={idx}>
              <strong>{ex.name}</strong> — 
              {ex.sets && ` Sets: ${ex.sets}`} 
              {ex.reps && ` Reps: ${ex.reps}`} 
              {ex.time && ` Time: ${ex.time}`}
            </li>
          ))}
        </ul>
        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default WorkoutDetails;
