import { useMemo } from 'react';
import { exerciseCatalog, recommendExercises } from './recommendations';
import { plans } from './data';

export default function ExerciseRecommendations({ tracker, setModal }) {
  const { sessions, customPlans, demo } = tracker.data;
  const result = useMemo(() => recommendExercises(sessions, [...plans, ...customPlans]), [sessions, customPlans]);
  const unavailable = Object.keys(tracker.loadErrors || {}).some(key => ['sessions', 'customPlans'].includes(key));
  return <section className="exercise-recommendations" aria-labelledby="recommendations-heading">
    <h2 id="recommendations-heading">Exercises for you</h2>
    {tracker.loading ? <p role="status">Loading your workout history…</p> : unavailable ? <p>Recommendations will be available once your workout history loads. Retry using the account message above.</p> : !result.items.length ? <p>Log your first workout to get three exercise suggestions based on your activity.</p> : <>
      <p>{demo ? 'Based on sample workout history' : `Based on ${result.historyCount} completed ${result.historyCount === 1 ? 'session' : 'sessions'}`} · Top 3 from {exerciseCatalog.length} exercises</p>
      <div className="recommendation-grid">{result.items.map(exercise => <article className="panel recommendation-card" key={exercise.id}>
        <span>{exercise.category}</span><h3>{exercise.name}</h3><p>{exercise.equipment}</p>
        <button className="button secondary" onClick={() => setModal({ type: 'workout', initial: { title: exercise.name, category: exercise.category } })}>Log this exercise</button>
      </article>)}</div>
      <details><summary>How suggestions are chosen</summary><p>We compare strength, cardio, mobility, upper body, lower body, core, impact, and equipment features with your past sessions using cosine similarity. These suggestions reflect activity similarity, not a training prescription. Check the equipment before choosing an exercise.{result.categorySessions > 0 ? ` ${result.categorySessions} older or manually logged sessions use category information because exercise details were unavailable.` : ''}</p></details>
    </>}
  </section>;
}
