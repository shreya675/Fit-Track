import React, { useState } from 'react';
import './workouts.css';

function AddWorkoutForm({ onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [exerciseText, setExerciseText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const exercises = exerciseText.split(',').map(ex => {
      const parts = ex.trim().split('-');
      return {
        name: parts[0].trim(),
        sets: parts[1]?.trim() || '',
        reps: parts[2]?.trim() || '',
        time: parts[3]?.trim() || '',
      };
    });

    const newWorkout = { title, duration, exercises };
    onSave(newWorkout);
  };

  return (
    <div className="popup-overlay">
      <div className="popup-form">
        <h2>Add Custom Workout</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Workout Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Total Duration (e.g. 45 mins)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
          <textarea
            placeholder="Exercises (Format: Exercise - Sets - Reps - Time [Optional])"
            value={exerciseText}
            onChange={(e) => setExerciseText(e.target.value)}
            required
          />
          <div className="form-buttons">
            <button type="submit">Save</button>
            <button type="button" className="cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddWorkoutForm;
