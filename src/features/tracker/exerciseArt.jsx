import { useId, useState } from 'react';
import { Activity, ChevronDown, Plus, RotateCcw, X } from 'lucide-react';
import { exerciseArtUrl, exercisePhotoUrl, findExerciseArt, mainPhoto } from './exerciseArtMatch.js';
import { isLoggedSet } from './progressStats.js';
import './exerciseArt.css';

export { exerciseArt, findExerciseArt, findPlanArt, exerciseArtUrl, exercisePhotoUrl, mainPhoto } from './exerciseArtMatch.js';

/**
 * A demonstration photograph where the dataset has one. Where it does not, a plain
 * tile rather than a picture of some other exercise, which would be worse than none.
 */
export function ExerciseArtImage({ art, className = '', alt, frame }) {
  const photo = frame || mainPhoto(art);
  const [failed, setFailed] = useState(false);
  if (!art) return null;
  if (!photo || failed) return <span className={`exercise-tile ${className}`} aria-hidden="true"><Activity size={20} /></span>;
  return <img className={`exercise-art photo ${className}`} src={exercisePhotoUrl(photo)}
    onError={() => setFailed(true)} loading="lazy"
    alt={alt === undefined ? `${art.name}, demonstrated` : alt} />;
}

const describeSets = sets =>
  sets.map(set => (Number(set.weight) > 0 ? `${set.weight} kg × ${set.reps}` : `${set.reps} reps`)).join(', ');

/** Weight and repetitions for one exercise. Weight is left blank for bodyweight work. */
function SetLog({ name, sets, lastSets, onChange }) {
  const update = (index, field, value) =>
    onChange(sets.map((set, i) => (i === index ? { ...set, [field]: value } : set)));
  return <div className="set-log">
    {sets.length > 0 && <ol>
      {sets.map((set, i) => <li key={i}>
        <span className="set-index" aria-hidden="true">{i + 1}</span>
        <input type="number" min="0" max="999" step="0.5" inputMode="decimal" placeholder="—"
          aria-label={`${name}, set ${i + 1}, weight in kilograms`}
          value={set.weight} onChange={e => update(i, 'weight', e.target.value)} />
        <span className="set-unit" aria-hidden="true">kg</span>
        <span className="set-times" aria-hidden="true">×</span>
        <input type="number" min="0" max="999" step="1" inputMode="numeric" placeholder="—"
          aria-label={`${name}, set ${i + 1}, repetitions`}
          value={set.reps} onChange={e => update(i, 'reps', e.target.value)} />
        <span className="set-unit" aria-hidden="true">reps</span>
        <button type="button" className="icon-button" aria-label={`Remove set ${i + 1} of ${name}`}
          onClick={() => onChange(sets.filter((_, index) => index !== i))}><X size={15} /></button>
      </li>)}
    </ol>}
    <div className="set-log-actions">
      <button type="button" className="text-link" onClick={() => onChange([...sets, { weight: '', reps: '' }])}>
        <Plus size={14} />Add set
      </button>
      {lastSets.length > 0 && <>
        <span className="set-log-last">Last time: {describeSets(lastSets)}</span>
        <button type="button" className="text-link"
          onClick={() => onChange(lastSets.map(set => ({ weight: set.weight || '', reps: set.reps })))}>
          <RotateCcw size={14} />Repeat
        </button>
      </>}
    </div>
  </div>;
}

/** One checklist line: tick box, thumbnail, set log, and an expandable how-to panel. */
function ExerciseItem({ label, index, checked, onToggle, sets, lastSets, onSetsChange }) {
  const [open, setOpen] = useState(false);
  const panelId = `${useId()}howto`;
  const art = findExerciseArt(label);
  const text = typeof label === 'string' ? label : `${label.name} ${label.sets || ''} ${label.reps || ''}`.trim();
  const frames = art?.photo?.length ? art.photo : [null];
  const done = (sets || []).filter(isLoggedSet).length;
  return <li className="exercise-item">
    <div className="exercise-line">
      <label>
        {onToggle && <input type="checkbox" checked={checked} onChange={() => onToggle(index)} />}
        <ExerciseArtImage art={art} className="thumb" alt="" />
        <span>{text}</span>
      </label>
      {done > 0 && <span className="set-count">{done} {done === 1 ? 'set' : 'sets'}</span>}
      {art && <button type="button" className="how-to-toggle" aria-expanded={open} aria-controls={panelId}
        onClick={() => setOpen(value => !value)}>
        How to<ChevronDown size={15} className={open ? 'flipped' : ''} />
      </button>}
    </div>
    {checked && <SetLog name={art?.name || text} sets={sets || []} lastSets={lastSets || []} onChange={next => onSetsChange(index, next)} />}
    {art && <div className="exercise-howto" id={panelId} hidden={!open}>
      {art.photo?.length > 0 && <div className="exercise-frames">
        {frames.map((frame, i) => <figure key={i}>
          <ExerciseArtImage art={art} className="figure" frame={frame}
            alt={`${art.name}, ${frames.length > 1 && i === 0 ? 'starting position' : 'finishing position'}`} />
          {frames.length > 1 && <figcaption>{i === 0 ? 'Start' : 'Finish'}</figcaption>}
        </figure>)}
      </div>}
      <div>
        <h3>{art.name}</h3>
        <ol>{art.cues.map((cue, i) => <li key={i}>{cue}</li>)}</ol>
        <p className="exercise-howto-note">Move within a range that feels comfortable, and stop if anything hurts.</p>
      </div>
    </div>}
  </li>;
}

export function ExerciseChecklist({ exercises, checked, onToggle, sets = {}, lastSets = {}, onSetsChange }) {
  return <ul className="exercise-checklist">
    {exercises.map((exercise, i) =>
      <ExerciseItem key={i} label={exercise} index={i} checked={checked.includes(i)} onToggle={onToggle}
        sets={sets[i]} lastSets={lastSets[i]} onSetsChange={onSetsChange} />)}
  </ul>;
}
