import { useCallback, useRef, useState } from 'react';
import { draftKey, readDrafts, writeDrafts } from './workoutDrafts';

export default function useWorkoutDrafts(userId) {
  const key = draftKey(userId);
  const [initial] = useState(() => {
    try { return { drafts: readDrafts(localStorage, key), error: '' }; }
    catch { return { drafts: {}, error: 'Workout drafts could not be loaded from this browser.' }; }
  });
  const [drafts, setDrafts] = useState(initial.drafts);
  const [error, setError] = useState(initial.error);
  const current = useRef(initial.drafts);
  const persist = useCallback(next => {
    current.current = next;
    setDrafts(next);
    try { writeDrafts(localStorage, key, next); setError(''); }
    catch { setError('Your workout draft is kept for this visit, but could not be saved in this browser. Keep this tab open until you save the workout.'); }
  }, [key]);
  const saveDraft = useCallback(draft => persist({ ...current.current, [draft.plan.id]: draft }), [persist]);
  const removeDraft = useCallback(id => {
    const next = { ...current.current };
    delete next[id];
    persist(next);
  }, [persist]);
  const clearDrafts = useCallback(() => persist({}), [persist]);
  return { drafts, error, saveDraft, removeDraft, clearDrafts };
}
