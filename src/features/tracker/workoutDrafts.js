export const draftKey = userId => `fittrack.workout-drafts.v1.${userId ? `user:${userId}` : 'local'}`;

export function readDrafts(storage, key) {
  const saved = JSON.parse(storage.getItem(key) || '{}');
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
  return Object.fromEntries(Object.entries(saved).filter(([id, draft]) =>
    draft?.plan?.id === id && Array.isArray(draft.plan.exercises) &&
    Array.isArray(draft.checked) && draft.sets && typeof draft.sets === 'object' &&
    Number.isFinite(draft.elapsed) && draft.elapsed >= 0));
}

export function writeDrafts(storage, key, drafts) {
  if (Object.keys(drafts).length) storage.setItem(key, JSON.stringify(drafts));
  else storage.removeItem(key);
}
