import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { exerciseCatalog, recommendExercises } from './recommendations';
import { plans, today } from './data';
import { ExerciseArtImage, findExerciseArt } from './exerciseArt';
import { Icon } from './components';

export default function ExerciseRecommendations({ tracker, setModal }) {
  const { sessions, customPlans, profile, demo } = tracker.data;
  const [busy, setBusy] = useState('');
  const result = useMemo(() => recommendExercises(sessions, [...plans, ...customPlans], today(), profile),
    [sessions, customPlans, profile]);
  const unavailable = Object.keys(tracker.loadErrors || {}).some(key => ['sessions', 'customPlans'].includes(key));

  async function dismiss(exercise) {
    setBusy(exercise.id);
    try { await tracker.dismissExercise(exercise.id); } finally { setBusy(''); }
  }

  return <section className="exercise-recommendations" aria-labelledby="recommendations-heading">
    <h2 id="recommendations-heading">Exercises for you</h2>
    {tracker.loading ? <p role="status">Loading your workout history…</p> : unavailable ? <p>Recommendations will be available once your workout history loads. Retry using the account message above.</p> : !result.items.length ? <p>Log your first workout to get three exercise suggestions based on your activity.</p> : <>
      <p>{demo ? 'Based on sample workout history' : `Based on ${result.historyCount} completed ${result.historyCount === 1 ? 'session' : 'sessions'}`} · Top 3 from {exerciseCatalog.length} exercises</p>
      <div className="recommendation-grid">{result.items.map(exercise => {
        const art = findExerciseArt(exercise.name);
        return <article className="panel recommendation-card" key={exercise.id}>
        {/* photo if available, else category tile */}
        {art?.photo?.length
          ? <ExerciseArtImage art={art} />
          : <span className={`exercise-tile ${exercise.category.toLowerCase()}`} aria-hidden="true"><Icon category={exercise.category} size={28} /></span>}
        <div className="recommendation-head">
          <span>{exercise.category}</span>
          <button className="icon-button" disabled={busy === exercise.id} title="Not for me"
            aria-label={`Stop suggesting ${exercise.name}`} onClick={() => dismiss(exercise)}><X size={17} /></button>
        </div>
        <h3>{exercise.name}</h3>
        <p className="recommendation-reason">{exercise.reason}</p>
        <p className="recommendation-equipment">{exercise.equipment}</p>
        <button className="button secondary" onClick={() => setModal({ type: 'workout', initial: { title: exercise.name, category: exercise.category } })}>Log this exercise</button>
      </article>;
      })}</div>
      {result.dismissedCount > 0 && <p className="recommendation-hidden">
        <span role="status">{result.dismissedCount} {result.dismissedCount === 1 ? 'exercise is' : 'exercises are'} hidden from suggestions.</span>
        <button className="text-link" onClick={tracker.restoreExercises}>Show them again</button>
      </p>}
      <details><summary>How suggestions are chosen</summary><p>Suggestions are based on your sessions from the last twelve weeks, with recent ones counting more. Each exercise is scored on strength, cardio, mobility, upper body, lower body, core, impact and equipment. We suggest the areas of your own routine that have had the least attention, exercises you have not done for a while, equipment you have, and your chosen focus. Exercises done in the last couple of days are skipped, and harder movements than you have done before are not suggested first.{result.categorySessions > 0 ? ` ${result.categorySessions} older or manually logged sessions use category information because exercise details were unavailable.` : ''}</p><p>These are descriptions of content, not measurements of what is effective or safe for you. This is not a training or medical prescription. Check the equipment and pick what suits you today. Your focus and your equipment are set in <Link to="/profile">My profile</Link>.</p></details>
    </>}
  </section>;
}
